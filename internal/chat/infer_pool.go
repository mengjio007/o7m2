package chat

import (
	"context"
	"errors"
	"time"
)

var ErrInferBusy = errors.New("inference busy")

type InferPool struct {
	sem     chan struct{}
	engine  Engine
	timeout time.Duration
}

func NewInferPool(engine Engine, maxConcurrency int, timeout time.Duration) *InferPool {
	if maxConcurrency <= 0 {
		maxConcurrency = 1
	}
	return &InferPool{sem: make(chan struct{}, maxConcurrency), engine: engine, timeout: timeout}
}

func (p *InferPool) Generate(ctx context.Context, prompt string) (string, error) {
	select {
	case p.sem <- struct{}{}:
		defer func() { <-p.sem }()
	default:
		return "", ErrInferBusy
	}

	cctx := ctx
	cancel := func() {}
	if p.timeout > 0 {
		cctx, cancel = context.WithTimeout(ctx, p.timeout)
	}
	defer cancel()

	return p.engine.Generate(cctx, prompt)
}
