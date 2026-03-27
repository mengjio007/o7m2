//go:build !onnx

package chat

import "fmt"

func NewEngineFromOptions(opt Options) (Engine, error) {
	if opt.ModelPath != "" {
		return nil, fmt.Errorf("CHAT_MODEL_PATH is set but this binary was built without ONNX support; rebuild with CGO_ENABLED=1 and -tags onnx")
	}
	return NewStubEngine(), nil
}
