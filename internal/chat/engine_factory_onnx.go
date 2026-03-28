//go:build onnx

package chat

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	ort "github.com/yalue/onnxruntime_go"
)

var ortInitOnce sync.Once
var ortInitErr error

func NewEngineFromOptions(opt Options) (Engine, error) {
	if opt.ModelPath == "" {
		return nil, fmt.Errorf("CHAT_MODEL_PATH is required when built with -tags onnx")
	}

	ortInitOnce.Do(func() {
		if opt.OnnxSharedLibraryPath != "" {
			ort.SetSharedLibraryPath(opt.OnnxSharedLibraryPath)
		}
		ortInitErr = ort.InitializeEnvironment()
		if ortInitErr == nil {
			_ = ort.DisableTelemetry()
		}
	})
	if ortInitErr != nil {
		return nil, fmt.Errorf("onnxruntime init failed: %w", ortInitErr)
	}

	mode := strings.ToLower(strings.TrimSpace(opt.OnnxTokenizer))
	st, err := os.Stat(opt.ModelPath)
	if err == nil && st.IsDir() {
		// Llama-style single-model exports (e.g. llmware/*-onnx) commonly ship
		// `model.onnx` + `tokenizer.json` at the root.
		if _, err := os.Stat(filepath.Join(opt.ModelPath, "model.onnx")); err == nil {
			if _, err := os.Stat(filepath.Join(opt.ModelPath, "tokenizer.json")); err == nil {
				return NewLlamaChatONNXEngine(opt)
			}
		}

		if mode == "auto" || mode == "gpt2" {
			return NewLlavaInterleaveQwenONNXEngine(opt)
		}
	}

	// Fallback: simple token engine (prompt tensor -> output tensor) for custom graphs.
	return NewONNXEngine(opt)
}
