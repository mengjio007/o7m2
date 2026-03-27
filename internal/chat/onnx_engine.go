//go:build onnx

package chat

import (
	"context"
	"fmt"
	"strings"

	ort "github.com/yalue/onnxruntime_go"
)

type ONNXEngine struct {
	opt Options

	session    *ort.DynamicAdvancedSession
	inputName  string
	outputName string
}

func NewONNXEngine(opt Options) (*ONNXEngine, error) {
	in := opt.OnnxPromptInput
	out := opt.OnnxResponseOutput
	if in == "" || out == "" {
		return nil, fmt.Errorf("CHAT_ONNX_PROMPT_INPUT and CHAT_ONNX_RESPONSE_OUTPUT are required")
	}

	sess, err := ort.NewDynamicAdvancedSession(opt.ModelPath, []string{in}, []string{out}, nil)
	if err != nil {
		return nil, fmt.Errorf("create onnx session: %w", err)
	}

	return &ONNXEngine{opt: opt, session: sess, inputName: in, outputName: out}, nil
}

func (e *ONNXEngine) Generate(ctx context.Context, prompt string) (string, error) {
	_ = ctx
	prompt = strings.TrimSpace(prompt)
	if prompt == "" {
		return "", nil
	}

	ids := byteTokenize(prompt, e.opt.OnnxTokenOffset, e.opt.OnnxMaxInputTokens)
	inputShape := ort.NewShape(1, int64(len(ids)))
	inputTensor, err := ort.NewTensor(inputShape, ids)
	if err != nil {
		return "", fmt.Errorf("create input tensor: %w", err)
	}
	defer inputTensor.Destroy()

	outputs := make([]ort.Value, 1)
	if err := e.session.Run([]ort.Value{inputTensor}, outputs); err != nil {
		return "", fmt.Errorf("onnx run: %w", err)
	}
	if outputs[0] == nil {
		return "", fmt.Errorf("onnx output is nil")
	}
	defer outputs[0].Destroy()

	switch v := outputs[0].(type) {
	case *ort.Tensor[int64]:
		outIDs := v.GetData()
		return byteDetokenize(outIDs, e.opt), nil
	case *ort.Tensor[float32]:
		if e.opt.OnnxOutputLogitsVocab <= 0 {
			return "", fmt.Errorf("model returned float32 tensor; set CHAT_ONNX_OUTPUT_LOGITS_VOCAB to decode logits")
		}
		return decodeFloat32Logits(v.GetData(), e.opt), nil
	default:
		return "", fmt.Errorf("unsupported onnx output type %T (only int64 tokens or float32 logits supported)", outputs[0])
	}
}

func byteTokenize(s string, offset int64, maxTokens int) []int64 {
	b := []byte(s)
	if maxTokens > 0 && len(b) > maxTokens {
		b = b[len(b)-maxTokens:]
	}
	ids := make([]int64, 0, len(b))
	for _, x := range b {
		ids = append(ids, int64(x)+offset)
	}
	if len(ids) == 0 {
		ids = []int64{offset} // avoid zero-length tensors
	}
	return ids
}

func byteDetokenize(ids []int64, opt Options) string {
	offset := opt.OnnxTokenOffset
	eos := opt.OnnxEosTokenID
	pad := opt.OnnxPadTokenID

	out := make([]byte, 0, len(ids))
	for _, id := range ids {
		if eos != 0 && id == eos {
			break
		}
		if pad != 0 && id == pad {
			continue
		}
		v := id - offset
		if v < 0 || v > 255 {
			if opt.OnnxReturnFullOutput {
				continue
			}
			continue
		}
		out = append(out, byte(v))
	}
	return strings.TrimSpace(string(out))
}

func decodeFloat32Logits(flat []float32, opt Options) string {
	vocab := opt.OnnxOutputLogitsVocab
	if vocab <= 0 {
		return ""
	}
	// Expect [1, seq, vocab] flattened.
	if len(flat)%vocab != 0 {
		return ""
	}
	seq := len(flat) / vocab
	ids := make([]int64, 0, seq)
	for i := 0; i < seq; i++ {
		base := i * vocab
		best := 0
		bestVal := flat[base]
		for j := 1; j < vocab; j++ {
			v := flat[base+j]
			if v > bestVal {
				bestVal = v
				best = j
			}
		}
		ids = append(ids, int64(best))
		if opt.OnnxEosTokenID != 0 && int64(best) == opt.OnnxEosTokenID {
			break
		}
	}
	return byteDetokenize(ids, opt)
}
