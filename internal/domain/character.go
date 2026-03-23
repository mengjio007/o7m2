package domain

import "time"

type Category string

const (
	CategoryVirtual    Category = "virtual"    // 虚拟人物（二次元、游戏角色等）
	CategoryHistorical Category = "historical" // 历史人物
	CategoryNovel      Category = "novel"      // 小说人物
)

type CharacterStatus string

const (
	CharacterStatusActive   CharacterStatus = "active"
	CharacterStatusPaused   CharacterStatus = "paused"
	CharacterStatusDelisted CharacterStatus = "delisted"
)

type Character struct {
	ID           string          `json:"id" db:"id"`
	Name         string          `json:"name" db:"name"`
	Category     Category        `json:"category" db:"category"`
	Avatar       string          `json:"avatar" db:"avatar"`
	Description  string          `json:"description" db:"description"`
	InitialPrice int64           `json:"initial_price" db:"initial_price"`
	CurrentPrice int64           `json:"current_price"`
	DayOpen      int64           `json:"day_open"`
	DayHigh      int64           `json:"day_high"`
	DayLow       int64           `json:"day_low"`
	Volume       int64           `json:"volume"`
	Status       CharacterStatus `json:"status" db:"status"`
	CreatedAt    time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at" db:"updated_at"`
}

func (c *Character) GetID() string {
	return c.ID
}

func (c *Character) GetName() string {
	return c.Name
}

func (c *Character) GetCategory() Category {
	return c.Category
}

func (c *Character) GetPrice() int64 {
	return c.CurrentPrice
}

type MarketItem interface {
	GetID() string
	GetName() string
	GetCategory() Category
	GetPrice() int64
}
