package chat

import "time"

type Role string

const (
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

type Message struct {
	Role      Role      `json:"role"`
	Text      string    `json:"text"`
	Timestamp time.Time `json:"timestamp"`
}

type Session struct {
	ID          string    `json:"session_id"`
	UserID      string    `json:"user_id"`
	CharacterID string    `json:"character_id"`
	CreatedAt   time.Time `json:"created_at"`
	LastActive  time.Time `json:"last_active_at"`
	History     []Message `json:"history"`
}
