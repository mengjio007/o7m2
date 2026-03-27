//go:build onnx

package chat

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	ort "github.com/yalue/onnxruntime_go"
)

// LlavaInterleaveQwenONNXEngine wires HF-style exports from
// luisresende13/llava-interleave-qwen-0.5b-hf into our chat Engine.
//
// It supports text-only greedy decoding by running:
// - onnx/embed_tokens.onnx to obtain inputs_embeds
// - onnx/decoder_model_merged.onnx to obtain logits
//
// This is intentionally minimal (no KV cache, no sampling).
type LlavaInterleaveQwenONNXEngine struct {
	opt Options
	tok *GPT2Tokenizer

	embed   *ort.DynamicAdvancedSession
	decoder *ort.DynamicAdvancedSession

	embedIn  string
	embedOut string

	decInputs  []string
	decOutputs []string

	logitsOutput string
}

func NewLlavaInterleaveQwenONNXEngine(opt Options) (*LlavaInterleaveQwenONNXEngine, error) {
	modelDir := opt.ModelPath
	st, err := os.Stat(modelDir)
	if err != nil {
		return nil, fmt.Errorf("stat CHAT_MODEL_PATH: %w", err)
	}
	if !st.IsDir() {
		return nil, fmt.Errorf("CHAT_MODEL_PATH must be a directory for llava/qwen hf export")
	}

	onnxDir := filepath.Join(modelDir, "onnx")
	embedPath := opt.OnnxEmbedModelPath
	if embedPath == "" {
		embedPath = filepath.Join(onnxDir, "embed_tokens.onnx")
	}
	decoderPath := opt.OnnxDecoderModelPath
	if decoderPath == "" {
		decoderPath = filepath.Join(onnxDir, "decoder_model_merged.onnx")
	}

	vocabPath := opt.OnnxVocabJSONPath
	if vocabPath == "" {
		vocabPath = filepath.Join(modelDir, "vocab.json")
	}
	mergesPath := opt.OnnxMergesPath
	if mergesPath == "" {
		mergesPath = filepath.Join(modelDir, "merges.txt")
	}

	tok, err := NewGPT2TokenizerFromFiles(vocabPath, mergesPath)
	if err != nil {
		return nil, err
	}

	embedInputs, embedOutputs, err := ort.GetInputOutputInfo(embedPath)
	if err != nil {
		return nil, fmt.Errorf("inspect embed_tokens.onnx: %w", err)
	}
	if len(embedInputs) != 1 {
		return nil, fmt.Errorf("embed model expected 1 input, got %d", len(embedInputs))
	}
	if len(embedOutputs) != 1 {
		return nil, fmt.Errorf("embed model expected 1 output, got %d", len(embedOutputs))
	}
	embedIn := embedInputs[0].Name
	embedOut := embedOutputs[0].Name
	embedSess, err := ort.NewDynamicAdvancedSession(embedPath, []string{embedIn}, []string{embedOut}, nil)
	if err != nil {
		return nil, fmt.Errorf("create embed session: %w", err)
	}

	decInputsInfo, decOutputsInfo, err := ort.GetInputOutputInfo(decoderPath)
	if err != nil {
		_ = embedSess.Destroy()
		return nil, fmt.Errorf("inspect decoder_model_merged.onnx: %w", err)
	}

	decInputs := pickDecoderInputs(decInputsInfo)
	if len(decInputs) == 0 {
		_ = embedSess.Destroy()
		return nil, fmt.Errorf("decoder inputs not recognized; need inputs_embeds and attention_mask")
	}
	decOutputs := pickDecoderOutputs(decOutputsInfo)
	if len(decOutputs) == 0 {
		_ = embedSess.Destroy()
		return nil, fmt.Errorf("decoder outputs not recognized; need logits")
	}

	logitsName := ""
	for _, o := range decOutputsInfo {
		if strings.Contains(strings.ToLower(o.Name), "logits") {
			logitsName = o.Name
			break
		}
	}
	if logitsName == "" {
		logitsName = decOutputs[0]
	}

	decSess, err := ort.NewDynamicAdvancedSession(decoderPath, decInputs, decOutputs, nil)
	if err != nil {
		_ = embedSess.Destroy()
		return nil, fmt.Errorf("create decoder session: %w", err)
	}

	return &LlavaInterleaveQwenONNXEngine{
		opt:          opt,
		tok:          tok,
		embed:        embedSess,
		decoder:      decSess,
		embedIn:      embedIn,
		embedOut:     embedOut,
		decInputs:    decInputs,
		decOutputs:   decOutputs,
		logitsOutput: logitsName,
	}, nil
}

func pickDecoderInputs(infos []ort.InputOutputInfo) []string {
	// We support a minimal subset.
	want := []string{"inputs_embeds", "attention_mask", "position_ids"}
	found := make([]string, 0, len(want))
	for _, w := range want {
		for _, i := range infos {
			if i.Name == w {
				found = append(found, w)
				break
			}
		}
	}
	// Must at least have inputs_embeds.
	hasEmbeds := false
	for _, x := range found {
		if x == "inputs_embeds" {
			hasEmbeds = true
			break
		}
	}
	if !hasEmbeds {
		return nil
	}
	return found
}

func pickDecoderOutputs(infos []ort.InputOutputInfo) []string {
	for _, o := range infos {
		if strings.Contains(strings.ToLower(o.Name), "logits") {
			return []string{o.Name}
		}
	}
	if len(infos) == 0 {
		return nil
	}
	// fallback: first output
	return []string{infos[0].Name}
}

func (e *LlavaInterleaveQwenONNXEngine) Generate(ctx context.Context, prompt string) (string, error) {
	prompt = strings.TrimSpace(prompt)
	if prompt == "" {
		return "", nil
	}

	// A tiny hint to the model that we want an assistant response.
	prompt = prompt + "\n\nAssistant:"

	inputIDs, err := e.tok.Encode(prompt)
	if err != nil {
		return "", err
	}
	if len(inputIDs) == 0 {
		return "", nil
	}
	if e.opt.OnnxMaxInputTokens > 0 && len(inputIDs) > e.opt.OnnxMaxInputTokens {
		inputIDs = inputIDs[len(inputIDs)-e.opt.OnnxMaxInputTokens:]
	}

	generated := make([]int64, 0, e.opt.OnnxMaxOutputTokens)
	for step := 0; step < e.opt.OnnxMaxOutputTokens; step++ {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}

		all := append(append([]int64{}, inputIDs...), generated...)
		attn := make([]int64, len(all))
		for i := range attn {
			attn[i] = 1
		}

		embeds, err := e.runEmbed(all)
		if err != nil {
			return "", err
		}

		logits, err := e.runDecoder(embeds, attn)
		if err != nil {
			return "", err
		}

		next := argmaxLast(logits, len(all))
		generated = append(generated, next)
		if e.opt.OnnxEosTokenID != 0 && next == e.opt.OnnxEosTokenID {
			break
		}
	}

	// Decode only the generated completion.
	out, err := e.tok.Decode(generated)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}

func (e *LlavaInterleaveQwenONNXEngine) runEmbed(inputIDs []int64) ([]float32, error) {
	shape := ort.NewShape(1, int64(len(inputIDs)))
	inTensor, err := ort.NewTensor(shape, inputIDs)
	if err != nil {
		return nil, fmt.Errorf("embed input tensor: %w", err)
	}
	defer inTensor.Destroy()

	outs := make([]ort.Value, 1)
	if err := e.embed.Run([]ort.Value{inTensor}, outs); err != nil {
		return nil, fmt.Errorf("embed run: %w", err)
	}
	if outs[0] == nil {
		return nil, fmt.Errorf("embed output nil")
	}
	defer outs[0].Destroy()

	t, ok := outs[0].(*ort.Tensor[float32])
	if !ok {
		return nil, fmt.Errorf("embed output type %T not supported (need float32)", outs[0])
	}
	data := t.GetData()
	copyData := make([]float32, len(data))
	copy(copyData, data)
	return copyData, nil
}

func (e *LlavaInterleaveQwenONNXEngine) runDecoder(embeds []float32, attnMask []int64) ([]float32, error) {
	// embeds shape is expected [1, seq, hidden]. Hidden is inferred by len/seq.
	seq := int64(len(attnMask))
	if seq <= 0 {
		return nil, fmt.Errorf("empty seq")
	}
	if int64(len(embeds))%seq != 0 {
		return nil, fmt.Errorf("embed size mismatch")
	}
	hidden := int64(len(embeds)) / seq

	embShape := ort.NewShape(1, seq, hidden)
	embTensor, err := ort.NewTensor(embShape, embeds)
	if err != nil {
		return nil, fmt.Errorf("decoder inputs_embeds tensor: %w", err)
	}
	defer embTensor.Destroy()

	maskShape := ort.NewShape(1, seq)
	maskTensor, err := ort.NewTensor(maskShape, attnMask)
	if err != nil {
		return nil, fmt.Errorf("decoder attention_mask tensor: %w", err)
	}
	defer maskTensor.Destroy()

	var posTensor *ort.Tensor[int64]
	if contains(e.decInputs, "position_ids") {
		pos := make([]int64, seq)
		for i := int64(0); i < seq; i++ {
			pos[i] = i
		}
		posTensor, err = ort.NewTensor(maskShape, pos)
		if err != nil {
			return nil, fmt.Errorf("decoder position_ids tensor: %w", err)
		}
		defer posTensor.Destroy()
	}

	inputs := make([]ort.Value, 0, len(e.decInputs))
	for _, name := range e.decInputs {
		switch name {
		case "inputs_embeds":
			inputs = append(inputs, embTensor)
		case "attention_mask":
			inputs = append(inputs, maskTensor)
		case "position_ids":
			inputs = append(inputs, posTensor)
		default:
			return nil, fmt.Errorf("unsupported decoder input %q", name)
		}
	}

	outs := make([]ort.Value, len(e.decOutputs))
	if err := e.decoder.Run(inputs, outs); err != nil {
		return nil, fmt.Errorf("decoder run: %w", err)
	}
	for _, o := range outs {
		if o != nil {
			defer o.Destroy()
		}
	}

	// Find logits output.
	idx := 0
	for i, name := range e.decOutputs {
		if name == e.logitsOutput {
			idx = i
			break
		}
	}
	if outs[idx] == nil {
		return nil, fmt.Errorf("decoder logits nil")
	}
	logitsTensor, ok := outs[idx].(*ort.Tensor[float32])
	if !ok {
		return nil, fmt.Errorf("decoder logits type %T not supported (need float32)", outs[idx])
	}
	data := logitsTensor.GetData()
	copyData := make([]float32, len(data))
	copy(copyData, data)
	return copyData, nil
}

func contains(a []string, x string) bool {
	for _, s := range a {
		if s == x {
			return true
		}
	}
	return false
}

func argmaxLast(logits []float32, seqLen int) int64 {
	// logits flattened [1, seq, vocab]. Infer vocab.
	if seqLen <= 0 {
		return 0
	}
	if len(logits)%seqLen != 0 {
		return 0
	}
	vocab := len(logits) / seqLen
	if vocab <= 0 {
		return 0
	}
	offset := (seqLen - 1) * vocab
	best := 0
	bestVal := logits[offset]
	for i := 1; i < vocab; i++ {
		v := logits[offset+i]
		if v > bestVal {
			bestVal = v
			best = i
		}
	}
	return int64(best)
}
