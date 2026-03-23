package domain

import "time"

type MiningStatus string

const (
	MiningStatusPending   MiningStatus = "pending"
	MiningStatusCompleted MiningStatus = "completed"
	MiningStatusExpired   MiningStatus = "expired"
)

type MiningSession struct {
	ID          string       `json:"id" db:"id"`
	UserID      string       `json:"user_id" db:"user_id"`
	CharacterID string       `json:"character_id" db:"character_id"`
	Challenge   string       `json:"challenge" db:"challenge"`
	Difficulty  int          `json:"difficulty" db:"difficulty"`
	TargetHash  string       `json:"target_hash"`
	Status      MiningStatus `json:"status" db:"status"`
	Nonce       string       `json:"nonce,omitempty" db:"nonce"`
	HashRate    int64        `json:"hash_rate,omitempty" db:"hash_rate"`
	Reward      int64        `json:"reward,omitempty" db:"reward"`
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`
	CompletedAt *time.Time   `json:"completed_at,omitempty" db:"completed_at"`
}

type MiningReward struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	CharacterID string    `json:"character_id" db:"character_id"`
	BaseReward  int64     `json:"base_reward" db:"base_reward"`
	BonusRate   float64   `json:"bonus_rate" db:"bonus_rate"`
	FinalReward int64     `json:"final_reward" db:"final_reward"`
	Difficulty  int       `json:"difficulty" db:"difficulty"`
	HashRate    int64     `json:"hash_rate" db:"hash_rate"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type HoldingBonus struct {
	MinHolding int64   `json:"min_holding"`
	BonusRate  float64 `json:"bonus_rate"`
}

var DefaultHoldingBonuses = []HoldingBonus{
	{MinHolding: 1000, BonusRate: 0.50},
	{MinHolding: 500, BonusRate: 0.25},
	{MinHolding: 100, BonusRate: 0.10},
	{MinHolding: 0, BonusRate: 0.00},
}

func GetHoldingBonus(holding int64) float64 {
	for _, b := range DefaultHoldingBonuses {
		if holding >= b.MinHolding {
			return b.BonusRate
		}
	}
	return 0.0
}
