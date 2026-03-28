//go:build onnx

package chat

import (
	"context"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strings"

	"github.com/sugarme/tokenizer"
	"github.com/sugarme/tokenizer/pretrained"
	ort "github.com/yalue/onnxruntime_go"
)

// LlamaChatONNXEngine supports ORT-GenAI style Llama decoder exports:
// - a single ONNX model taking input_ids (+ attention_mask [+ position_ids] [+ past_key_values.*])
// - outputs logits (+ present_key_values.*)
//
// It does greedy text generation with KV cache when available.
type LlamaChatONNXEngine struct {
	opt Options
	tok *tokenizer.Tokenizer

	session *ort.DynamicAdvancedSession
	model   string

	inputIDsName   string
	attnMaskName   string
	positionIDs    string
	pastInputNames []string

	outNames    []string
	logitsName  string
	kvOutNames  []string
	pastLenSeed int64

	pastInfos map[string]ort.InputOutputInfo
}

func NewLlamaChatONNXEngine(opt Options) (*LlamaChatONNXEngine, error) {
	modelDir := opt.ModelPath
	st, err := os.Stat(modelDir)
	if err != nil {
		return nil, fmt.Errorf("stat CHAT_MODEL_PATH: %w", err)
	}
	if !st.IsDir() {
		return nil, fmt.Errorf("CHAT_MODEL_PATH must be a directory for llama onnx")
	}

	modelPath := opt.OnnxModelFilePath
	if modelPath == "" {
		modelPath = filepath.Join(modelDir, "model.onnx")
	}
	if _, err := os.Stat(modelPath); err != nil {
		return nil, fmt.Errorf("missing model onnx file: %w", err)
	}

	tokenizerPath := opt.OnnxTokenizerJSONPath
	if tokenizerPath == "" {
		tokenizerPath = filepath.Join(modelDir, "tokenizer.json")
	}
	if _, err := os.Stat(tokenizerPath); err != nil {
		return nil, fmt.Errorf("missing tokenizer.json: %w", err)
	}

	tk, err := pretrained.FromFile(tokenizerPath)
	if err != nil {
		return nil, fmt.Errorf("load tokenizer.json: %w", err)
	}

	inInfos, outInfos, err := ort.GetInputOutputInfo(modelPath)
	if err != nil {
		return nil, fmt.Errorf("inspect llama model: %w", err)
	}

	inputIDsName, attnMaskName, positionIDsName, pastInputs, pastInfo, err := pickLlamaInputs(inInfos)
	if err != nil {
		return nil, err
	}
	logitsName, kvOutNames, err := pickLlamaOutputs(outInfos)
	if err != nil {
		return nil, err
	}

	outNames := append([]string{logitsName}, kvOutNames...)
	inputNames := []string{inputIDsName, attnMaskName}
	if positionIDsName != "" {
		inputNames = append(inputNames, positionIDsName)
	}
	inputNames = append(inputNames, pastInputs...)

	sess, err := ort.NewDynamicAdvancedSession(modelPath, inputNames, outNames, nil)
	if err != nil {
		return nil, fmt.Errorf("create llama session: %w", err)
	}

	pastLenSeed := int64(0)
	if len(pastInputs) > 0 {
		pastLenSeed = 1
	}

	return &LlamaChatONNXEngine{
		opt:            opt,
		tok:            tk,
		session:        sess,
		model:          modelPath,
		inputIDsName:   inputIDsName,
		attnMaskName:   attnMaskName,
		positionIDs:    positionIDsName,
		pastInputNames: append([]string(nil), pastInputs...),
		outNames:       outNames,
		logitsName:     logitsName,
		kvOutNames:     kvOutNames,
		pastLenSeed:    pastLenSeed,
		pastInfos:      pastInfo,
	}, nil
}

func pickLlamaInputs(infos []ort.InputOutputInfo) (inputIDs, attnMask, positionIDs string, past []string, pastInfo map[string]ort.InputOutputInfo, err error) {
	lowName := func(s string) string { return strings.ToLower(strings.TrimSpace(s)) }
	pastInfo = make(map[string]ort.InputOutputInfo)

	for _, i := range infos {
		switch lowName(i.Name) {
		case "input_ids":
			inputIDs = i.Name
		case "attention_mask":
			attnMask = i.Name
		case "position_ids":
			positionIDs = i.Name
		default:
			ln := lowName(i.Name)
			if strings.HasPrefix(ln, "past_key_values.") || strings.HasPrefix(ln, "past.") {
				past = append(past, i.Name)
				pastInfo[i.Name] = i
			}
		}
	}

	if inputIDs == "" || attnMask == "" {
		return "", "", "", nil, nil, fmt.Errorf("llama model inputs not recognized; need input_ids and attention_mask")
	}
	return inputIDs, attnMask, positionIDs, past, pastInfo, nil
}

func pickLlamaOutputs(infos []ort.InputOutputInfo) (logits string, kvOut []string, err error) {
	for _, o := range infos {
		if strings.Contains(strings.ToLower(o.Name), "logits") {
			logits = o.Name
			break
		}
	}
	if logits == "" {
		return "", nil, fmt.Errorf("llama model outputs not recognized; need logits")
	}

	for _, o := range infos {
		low := strings.ToLower(o.Name)
		if strings.HasPrefix(low, "present_key_values.") || strings.HasPrefix(low, "present.") {
			kvOut = append(kvOut, o.Name)
		}
	}
	return logits, kvOut, nil
}

func (e *LlamaChatONNXEngine) Generate(ctx context.Context, prompt string) (string, error) {
	prompt = strings.TrimSpace(prompt)
	if prompt == "" {
		return "", nil
	}

	enc, err := e.tok.Encode(tokenizer.NewSingleEncodeInput(prompt), true)
	if err != nil {
		return "", fmt.Errorf("tokenize: %w", err)
	}
	inputIDs := enc.Ids
	if len(inputIDs) == 0 {
		return "", nil
	}
	if e.opt.OnnxMaxInputTokens > 0 && len(inputIDs) > e.opt.OnnxMaxInputTokens {
		inputIDs = inputIDs[len(inputIDs)-e.opt.OnnxMaxInputTokens:]
	}

	eos := e.opt.OnnxEosTokenID
	if eos == 0 {
		eos = 2 // llama default
	}

	past := make(map[string]ort.Value)
	pastTotal := e.pastLenSeed
	if e.pastLenSeed > 0 {
		for _, name := range e.pastInputNames {
			info := e.pastInfos[name]
			v, err := newZeroTensorFromInfo(info, pastTotal)
			if err != nil {
				return "", fmt.Errorf("init past tensor %s: %w", name, err)
			}
			past[name] = v
		}
	}
	defer func() {
		for _, v := range past {
			v.Destroy()
		}
	}()

	generated := make([]int, 0, e.opt.OnnxMaxOutputTokens)

	// First pass: full prompt
	{
		attn := make([]int64, int(pastTotal)+len(inputIDs))
		for i := 0; i < int(pastTotal); i++ {
			attn[i] = 0
		}
		for i := int(pastTotal); i < len(attn); i++ {
			attn[i] = 1
		}

		pos := make([]int64, len(inputIDs))
		if e.positionIDs != "" {
			for i := range pos {
				pos[i] = pastTotal + int64(i)
			}
		}

		logits, newPast, err := e.runStep(inputIDsToInt64(inputIDs), int64(len(inputIDs)), attn, pos, past)
		if err != nil {
			return "", err
		}
		pastTotal += int64(len(inputIDs))
		replacePast(past, newPast)

		next := argmaxLastFloat32(logits, len(inputIDs))
		generated = append(generated, int(next))
		if eos != 0 && next == eos {
			out := e.tok.Decode(generated, true)
			out = SanitizeAssistantReply(prompt, out)
			return strings.TrimSpace(out), nil
		}
	}

	maxOut := e.opt.OnnxMaxOutputTokens
	if maxOut <= 0 {
		maxOut = 128
	}

	for step := 1; step < maxOut; step++ {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}

		lastID := generated[len(generated)-1]
		attn := make([]int64, int(pastTotal)+1)
		for i := 0; i < int(e.pastLenSeed); i++ {
			attn[i] = 0
		}
		for i := int(e.pastLenSeed); i < len(attn); i++ {
			attn[i] = 1
		}

		var pos []int64
		if e.positionIDs != "" {
			pos = []int64{pastTotal}
		}

		logits, newPast, err := e.runStep([]int64{int64(lastID)}, 1, attn, pos, past)
		if err != nil {
			return "", err
		}
		pastTotal += 1
		replacePast(past, newPast)

		next := argmaxLastFloat32(logits, 1)
		generated = append(generated, int(next))
		if eos != 0 && next == eos {
			break
		}
	}

	out := e.tok.Decode(generated, true)
	out = SanitizeAssistantReply(prompt, out)
	return strings.TrimSpace(out), nil
}

func inputIDsToInt64(ids []int) []int64 {
	out := make([]int64, 0, len(ids))
	for _, id := range ids {
		out = append(out, int64(id))
	}
	return out
}

func (e *LlamaChatONNXEngine) runStep(inputIDs []int64, seqLen int64, attnMask []int64, positionIDs []int64, past map[string]ort.Value) ([]float32, map[string]ort.Value, error) {
	inTensor, err := ort.NewTensor(ort.NewShape(1, int64(len(inputIDs))), inputIDs)
	if err != nil {
		return nil, nil, fmt.Errorf("input_ids tensor: %w", err)
	}
	defer inTensor.Destroy()

	maskTensor, err := ort.NewTensor(ort.NewShape(1, int64(len(attnMask))), attnMask)
	if err != nil {
		return nil, nil, fmt.Errorf("attention_mask tensor: %w", err)
	}
	defer maskTensor.Destroy()

	var posTensor ort.Value
	if e.positionIDs != "" {
		posTensor, err = ort.NewTensor(ort.NewShape(1, int64(len(positionIDs))), positionIDs)
		if err != nil {
			return nil, nil, fmt.Errorf("position_ids tensor: %w", err)
		}
		defer posTensor.Destroy()
	}

	inputs := make([]ort.Value, 0, 2+len(e.pastInputNames)+1)
	inputs = append(inputs, inTensor, maskTensor)
	if e.positionIDs != "" {
		inputs = append(inputs, posTensor)
	}
	for _, name := range e.pastInputNames {
		v, ok := past[name]
		if !ok {
			return nil, nil, fmt.Errorf("missing past input %s", name)
		}
		inputs = append(inputs, v)
	}

	outs := make([]ort.Value, len(e.outNames))
	if err := e.session.Run(inputs, outs); err != nil {
		return nil, nil, fmt.Errorf("llama run: %w", err)
	}

	if outs[0] == nil {
		for _, o := range outs {
			if o != nil {
				o.Destroy()
			}
		}
		return nil, nil, fmt.Errorf("llama logits nil")
	}

	logits, err := readLogitsFloat32(outs[0], int(seqLen))
	if err != nil {
		for _, o := range outs {
			if o != nil {
				o.Destroy()
			}
		}
		return nil, nil, err
	}

	newPast := make(map[string]ort.Value)
	for i := 1; i < len(outs); i++ {
		v := outs[i]
		if v == nil {
			continue
		}
		outName := e.outNames[i]
		inName := mapKVOutputToInput(outName)
		if inName == "" {
			v.Destroy()
			continue
		}
		newPast[inName] = v
	}

	outs[0].Destroy()
	return logits, newPast, nil
}

func readLogitsFloat32(v ort.Value, seqLen int) ([]float32, error) {
	switch t := v.(type) {
	case *ort.Tensor[float32]:
		data := t.GetData()
		out := make([]float32, len(data))
		copy(out, data)
		return out, nil
	case *ort.Tensor[uint16]:
		// float16 bits
		data := t.GetData()
		out := make([]float32, len(data))
		for i, bits := range data {
			out[i] = float16ToFloat32(bits)
		}
		return out, nil
	default:
		return nil, fmt.Errorf("unsupported logits tensor type %T (need float32 or float16)", v)
	}
}

func float16ToFloat32(h uint16) float32 {
	// IEEE 754 half -> float32 conversion.
	sign := uint32(h>>15) & 0x00000001
	exp := uint32(h>>10) & 0x0000001f
	frac := uint32(h & 0x03ff)

	var f uint32
	switch exp {
	case 0:
		if frac == 0 {
			f = sign << 31
		} else {
			// subnormal
			e := int32(-14)
			for (frac & 0x0400) == 0 {
				frac <<= 1
				e--
			}
			frac &= 0x03ff
			f = (sign << 31) | (uint32(e+127) << 23) | (frac << 13)
		}
	case 31:
		f = (sign << 31) | (0xff << 23) | (frac << 13)
	default:
		f = (sign << 31) | ((exp + 112) << 23) | (frac << 13)
	}

	return math.Float32frombits(f)
}

func argmaxLastFloat32(logits []float32, seqLen int) int64 {
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

func newZeroTensorFromInfo(info ort.InputOutputInfo, pastLen int64) (ort.Value, error) {
	if info.OrtValueType != ort.ONNXTypeTensor {
		return nil, fmt.Errorf("past input %s is not a tensor", info.Name)
	}
	dims := make([]int64, len(info.Dimensions))
	for i, d := range info.Dimensions {
		if d > 0 {
			dims[i] = d
			continue
		}
		// Use pastLen for unknown dims (usually sequence), otherwise 1.
		if pastLen > 0 {
			dims[i] = pastLen
		} else {
			dims[i] = 1
		}
	}
	if len(dims) == 0 {
		dims = []int64{1}
	}

	shape := ort.NewShape(dims...)
	n := int64(1)
	for _, d := range dims {
		if d <= 0 {
			d = 1
		}
		n *= d
	}

	switch info.DataType {
	case ort.TensorElementDataTypeFloat16:
		zero := make([]uint16, int(n))
		return ort.NewTensor(shape, zero)
	case ort.TensorElementDataTypeFloat:
		zero := make([]float32, int(n))
		return ort.NewTensor(shape, zero)
	default:
		return nil, fmt.Errorf("unsupported past dtype %v for %s", info.DataType, info.Name)
	}
}
