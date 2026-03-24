package domain

import "time"

type OrderSide string

const (
	OrderSideBuy  OrderSide = "buy"
	OrderSideSell OrderSide = "sell"
)

type OrderType string

const (
	OrderTypeLimit  OrderType = "limit"
	OrderTypeMarket OrderType = "market"
)

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusPartial   OrderStatus = "partial"
	OrderStatusFilled    OrderStatus = "filled"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID            string      `json:"id" db:"id"`
	ClientOrderID string      `json:"client_order_id" db:"client_order_id"`
	UserID        string      `json:"user_id" db:"user_id"`
	CharacterID   string      `json:"character_id" db:"character_id"`
	Side          OrderSide   `json:"side" db:"side"`
	Type          OrderType   `json:"type" db:"type"`
	Price         int64       `json:"price" db:"price"`
	Quantity      int64       `json:"quantity" db:"quantity"`
	FilledQty     int64       `json:"filled_qty" db:"filled_qty"`
	Status        OrderStatus `json:"status" db:"status"`
	CreatedAt     time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at" db:"updated_at"`
}

type Trade struct {
	ID          string    `json:"id" db:"id"`
	CharacterID string    `json:"character_id" db:"character_id"`
	BuyOrderID  string    `json:"buy_order_id" db:"buy_order_id"`
	SellOrderID string    `json:"sell_order_id" db:"sell_order_id"`
	BuyUserID   string    `json:"buy_user_id" db:"buy_user_id"`
	SellUserID  string    `json:"sell_user_id" db:"sell_user_id"`
	Price       int64     `json:"price" db:"price"`
	Quantity    int64     `json:"quantity" db:"quantity"`
	Tax         int64     `json:"tax" db:"tax"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type KLine struct {
	ID          int64     `json:"id" db:"id"`
	CharacterID string    `json:"character_id" db:"character_id"`
	Period      string    `json:"period" db:"period"`
	OpenTime    time.Time `json:"open_time" db:"open_time"`
	OpenPrice   int64     `json:"open_price" db:"open_price"`
	HighPrice   int64     `json:"high_price" db:"high_price"`
	LowPrice    int64     `json:"low_price" db:"low_price"`
	ClosePrice  int64     `json:"close_price" db:"close_price"`
	Volume      int64     `json:"volume" db:"volume"`
}
