package domain

import (
	"encoding/json"
	"time"
)

type EventType string

const (
	EventTypeCrash    EventType = "crash"
	EventTypePump     EventType = "pump"
	EventTypeActivity EventType = "activity"
	EventTypeSystem   EventType = "system"
)

type EventSeverity string

const (
	EventSeverityInfo     EventSeverity = "info"
	EventSeverityWarning  EventSeverity = "warning"
	EventSeverityCritical EventSeverity = "critical"
)

type Event struct {
	ID            string        `json:"id" db:"id"`
	Type          EventType     `json:"type" db:"type"`
	Title         string        `json:"title" db:"title"`
	Content       string        `json:"content" db:"content"`
	AffectedChars []string      `json:"affected_chars"`
	AffectedJSON  string        `json:"-" db:"affected_chars"`
	Severity      EventSeverity `json:"severity" db:"severity"`
	StartAt       *time.Time    `json:"start_at" db:"start_at"`
	EndAt         *time.Time    `json:"end_at" db:"end_at"`
	IsActive      bool          `json:"is_active" db:"is_active"`
	CreatedAt     time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at" db:"updated_at"`
}

func (e *Event) MarshalAffected() error {
	if e.AffectedChars != nil {
		data, err := json.Marshal(e.AffectedChars)
		if err != nil {
			return err
		}
		e.AffectedJSON = string(data)
	}
	return nil
}

func (e *Event) UnmarshalAffected() error {
	if e.AffectedJSON != "" {
		return json.Unmarshal([]byte(e.AffectedJSON), &e.AffectedChars)
	}
	return nil
}
