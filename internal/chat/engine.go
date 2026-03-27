package chat

import "context"

type Engine interface {
	Generate(ctx context.Context, prompt string) (string, error)
}
