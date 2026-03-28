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
// Text-only greedy decoding using KV cache outputs when available.
//
// Important: some merged decoder exports include past_key_values inputs.
// onnxruntime_go disallows 0-length dimensions, so we seed KV with a 1-length
// dummy past cache and mask it out via attention_mask[0]=0.
type LlavaInterleaveQwenONNXEngine struct {
	opt Options
	tok *GPT2Tokenizer

	pastLen int64

	embed   *ort.DynamicAdvancedSession
	decoder *ort.DynamicAdvancedSession

	embedIn  string
	embedOut string

	decInputs  []string
	decOutputs []string

	logitsOutput string
	kvOutNames   []string
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
		decoderPath = filepath.Join(onnxDir, "decoder_model_merged_quantized.onnx")
		if _, err := os.Stat(decoderPath); err != nil {
			decoderPath = filepath.Join(onnxDir, "decoder_model_merged.onnx")
		}
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
	if len(embedInputs) != 1 || len(embedOutputs) != 1 {
		return nil, fmt.Errorf("embed model must have 1 input/1 output")
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
		return nil, fmt.Errorf("inspect decoder model: %w", err)
	}

	for _, input := range decInputsInfo {
		fmt.Printf("Decoder input: %s, shape: %v\n", input.Name, input.Dimensions)
	}
	for _, output := range decOutputsInfo {
		fmt.Printf("Decoder output: %s, shape: %v\n", output.Name, output.Dimensions)
	}

	decInputs := pickDecoderInputs(decInputsInfo)
	if len(decInputs) == 0 {
		_ = embedSess.Destroy()
		return nil, fmt.Errorf("decoder inputs not recognized; need inputs_embeds and attention_mask")
	}

	logitsName, kvOutNames := pickDecoderOutputs(decOutputsInfo)
	if logitsName == "" {
		_ = embedSess.Destroy()
		return nil, fmt.Errorf("decoder outputs not recognized; need logits")
	}

	decOutputs := append([]string{logitsName}, kvOutNames...)
	decSess, err := ort.NewDynamicAdvancedSession(decoderPath, decInputs, decOutputs, nil)
	if err != nil {
		_ = embedSess.Destroy()
		return nil, fmt.Errorf("create decoder session: %w", err)
	}

	pastLen := int64(0)
	for _, in := range decInputsInfo {
		if strings.HasPrefix(in.Name, "past_key_values.") {
			pastLen = 1
			break
		}
	}

	return &LlavaInterleaveQwenONNXEngine{
		opt:          opt,
		tok:          tok,
		pastLen:      pastLen,
		embed:        embedSess,
		decoder:      decSess,
		embedIn:      embedIn,
		embedOut:     embedOut,
		decInputs:    decInputs,
		decOutputs:   decOutputs,
		logitsOutput: logitsName,
		kvOutNames:   kvOutNames,
	}, nil
}

func pickDecoderInputs(infos []ort.InputOutputInfo) []string {
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

	for _, i := range infos {
		if strings.HasPrefix(i.Name, "past_key_values") {
			found = append(found, i.Name)
		}
	}

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

func pickDecoderOutputs(infos []ort.InputOutputInfo) (logits string, kvOut []string) {
	for _, o := range infos {
		if strings.Contains(strings.ToLower(o.Name), "logits") {
			logits = o.Name
			break
		}
	}
	if logits == "" {
		return "", nil
	}

	for _, o := range infos {
		name := o.Name
		low := strings.ToLower(name)
		if strings.HasPrefix(low, "present_key_values.") || strings.HasPrefix(low, "past_key_values.") || strings.HasPrefix(low, "present.") {
			kvOut = append(kvOut, name)
		}
	}
	return logits, kvOut
}

func (e *LlavaInterleaveQwenONNXEngine) Generate(ctx context.Context, prompt string) (string, error) {
	prompt = strings.TrimSpace(prompt)
	if prompt == "" {
		return "", nil
	}

	if !strings.HasSuffix(strings.TrimSpace(prompt), "Assistant:") {
		prompt = prompt + "\n\nAssistant:"
	}

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

	past := make(map[string]ort.Value)
	pastTotal := e.pastLen
	if e.pastLen > 0 {
		for _, name := range e.decInputs {
			if !strings.HasPrefix(name, "past_key_values") {
				continue
			}
			zero := make([]float32, 1*16*int(e.pastLen)*64)
			t, err := ort.NewTensor(ort.NewShape(1, 16, e.pastLen, 64), zero)
			if err != nil {
				return "", fmt.Errorf("init past tensor %s: %w", name, err)
			}
			past[name] = t
		}
	}
	defer func() {
		for _, v := range past {
			v.Destroy()
		}
	}()

	generated := make([]int64, 0, e.opt.OnnxMaxOutputTokens)

	// First pass: full prompt
	{
		attn := make([]int64, int(pastTotal)+len(inputIDs))
		for i := 0; i < int(pastTotal); i++ {
			attn[i] = 0
		}
		for i := int(pastTotal); i < len(attn); i++ {
			attn[i] = 1
		}

		embeds, err := e.runEmbed(inputIDs)
		if err != nil {
			return "", err
		}

		pos := make([]int64, len(inputIDs))
		for i := range pos {
			pos[i] = pastTotal + int64(i)
		}

		logits, newPast, err := e.runDecoderStep(embeds, int64(len(inputIDs)), attn, pos, past)
		if err != nil {
			return "", err
		}
		pastTotal += int64(len(inputIDs))
		replacePast(past, newPast)

		next := argmaxLast(logits, len(inputIDs))
		generated = append(generated, next)
		if e.opt.OnnxEosTokenID != 0 && next == e.opt.OnnxEosTokenID {
			out, _ := e.tok.Decode(generated)
			return strings.TrimSpace(out), nil
		}
	}

	for step := 1; step < e.opt.OnnxMaxOutputTokens; step++ {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}

		lastID := generated[len(generated)-1]
		embeds, err := e.runEmbed([]int64{lastID})
		if err != nil {
			return "", err
		}

		attn := make([]int64, int(pastTotal)+1)
		for i := 0; i < int(e.pastLen); i++ {
			attn[i] = 0
		}
		for i := int(e.pastLen); i < len(attn); i++ {
			attn[i] = 1
		}

		pos := []int64{pastTotal}

		logits, newPast, err := e.runDecoderStep(embeds, 1, attn, pos, past)
		if err != nil {
			return "", err
		}
		pastTotal += 1
		replacePast(past, newPast)

		next := argmaxLast(logits, 1)
		generated = append(generated, next)
		if e.opt.OnnxEosTokenID != 0 && next == e.opt.OnnxEosTokenID {
			break
		}
	}

	out, err := e.tok.Decode(generated)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(out), nil
}

func replacePast(dst map[string]ort.Value, newPast map[string]ort.Value) {
	for k, v := range dst {
		if _, ok := newPast[k]; !ok {
			v.Destroy()
			delete(dst, k)
		}
	}
	for k, v := range newPast {
		if old, ok := dst[k]; ok {
			old.Destroy()
		}
		dst[k] = v
	}
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

func (e *LlavaInterleaveQwenONNXEngine) runDecoderStep(embeds []float32, seqEmbeds int64, attnMask []int64, positionIDs []int64, past map[string]ort.Value) ([]float32, map[string]ort.Value, error) {
	if seqEmbeds <= 0 {
		return nil, nil, fmt.Errorf("empty seq")
	}
	maskSeq := int64(len(attnMask))
	if maskSeq <= 0 {
		return nil, nil, fmt.Errorf("empty attention_mask")
	}
	if int64(len(embeds))%seqEmbeds != 0 {
		return nil, nil, fmt.Errorf("embed size mismatch")
	}
	hidden := int64(len(embeds)) / seqEmbeds

	embTensor, err := ort.NewTensor(ort.NewShape(1, seqEmbeds, hidden), embeds)
	if err != nil {
		return nil, nil, fmt.Errorf("decoder inputs_embeds tensor: %w", err)
	}
	defer embTensor.Destroy()

	maskTensor, err := ort.NewTensor(ort.NewShape(1, maskSeq), attnMask)
	if err != nil {
		return nil, nil, fmt.Errorf("decoder attention_mask tensor: %w", err)
	}
	defer maskTensor.Destroy()

	posTensor, err := ort.NewTensor(ort.NewShape(1, int64(len(positionIDs))), positionIDs)
	if err != nil {
		return nil, nil, fmt.Errorf("decoder position_ids tensor: %w", err)
	}
	defer posTensor.Destroy()

	inputs := make([]ort.Value, 0, len(e.decInputs))
	for _, name := range e.decInputs {
		switch {
		case name == "inputs_embeds":
			inputs = append(inputs, embTensor)
		case name == "attention_mask":
			inputs = append(inputs, maskTensor)
		case name == "position_ids":
			inputs = append(inputs, posTensor)
		case strings.HasPrefix(name, "past_key_values"):
			v, ok := past[name]
			if !ok {
				return nil, nil, fmt.Errorf("missing past input %s", name)
			}
			inputs = append(inputs, v)
		default:
			return nil, nil, fmt.Errorf("unsupported decoder input %q", name)
		}
	}

	outs := make([]ort.Value, len(e.decOutputs))
	if err := e.decoder.Run(inputs, outs); err != nil {
		return nil, nil, fmt.Errorf("decoder run: %w", err)
	}

	// outs[0] is logits
	if outs[0] == nil {
		return nil, nil, fmt.Errorf("decoder logits nil")
	}
	logitsTensor, ok := outs[0].(*ort.Tensor[float32])
	if !ok {
		for _, o := range outs {
			if o != nil {
				o.Destroy()
			}
		}
		return nil, nil, fmt.Errorf("decoder logits type %T not supported (need float32)", outs[0])
	}
	logitsData := logitsTensor.GetData()
	logits := make([]float32, len(logitsData))
	copy(logits, logitsData)

	newPast := make(map[string]ort.Value)
	// Remaining outs correspond to kvOutNames in order.
	for i := 1; i < len(outs); i++ {
		v := outs[i]
		if v == nil {
			continue
		}
		outName := e.decOutputs[i]
		inName := mapKVOutputToInput(outName)
		if inName == "" {
			v.Destroy()
			continue
		}
		newPast[inName] = v
	}

	// Destroy logits tensor Value now that we copied data.
	outs[0].Destroy()

	return logits, newPast, nil
}

func mapKVOutputToInput(outName string) string {
	if strings.HasPrefix(outName, "present_key_values.") {
		return "past_key_values." + strings.TrimPrefix(outName, "present_key_values.")
	}
	if strings.HasPrefix(outName, "present.") {
		return "past_key_values." + strings.TrimPrefix(outName, "present.")
	}
	if strings.HasPrefix(outName, "past_key_values.") {
		return outName
	}
	return ""
}

func argmaxLast(logits []float32, seqLen int) int64 {
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
