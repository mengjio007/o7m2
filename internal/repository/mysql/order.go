package mysql

import (
	"database/sql"
	"time"

	"o7m2/internal/domain"
)

type OrderRepository struct {
	db *DB
}

func NewOrderRepository(db *DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(order *domain.Order) error {
	query := `INSERT INTO orders (id, client_order_id, user_id, character_id, side, type, price, quantity, filled_qty, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, order.ID, order.ClientOrderID, order.UserID, order.CharacterID,
		order.Side, order.Type, order.Price, order.Quantity, order.FilledQty,
		order.Status, order.CreatedAt, order.UpdatedAt)
	return err
}

func (r *OrderRepository) FindByID(id string) (*domain.Order, error) {
	query := `SELECT id, client_order_id, user_id, character_id, side, type, price, quantity, filled_qty, status, created_at, updated_at
		FROM orders WHERE id = ?`

	order := &domain.Order{}
	err := r.db.QueryRow(query, id).Scan(
		&order.ID, &order.ClientOrderID, &order.UserID, &order.CharacterID,
		&order.Side, &order.Type, &order.Price, &order.Quantity, &order.FilledQty,
		&order.Status, &order.CreatedAt, &order.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return order, err
}

func (r *OrderRepository) FindByUserID(userID string) ([]domain.Order, error) {
	query := `SELECT id, client_order_id, user_id, character_id, side, type, price, quantity, filled_qty, status, created_at, updated_at
		FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		var o domain.Order
		if err := rows.Scan(&o.ID, &o.ClientOrderID, &o.UserID, &o.CharacterID,
			&o.Side, &o.Type, &o.Price, &o.Quantity, &o.FilledQty,
			&o.Status, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) FindPendingByCharacter(characterID string) ([]domain.Order, error) {
	query := `SELECT id, client_order_id, user_id, character_id, side, type, price, quantity, filled_qty, status, created_at, updated_at
		FROM orders WHERE character_id = ? AND status IN ('pending', 'partial') ORDER BY price DESC, created_at ASC`

	rows, err := r.db.Query(query, characterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []domain.Order
	for rows.Next() {
		var o domain.Order
		if err := rows.Scan(&o.ID, &o.ClientOrderID, &o.UserID, &o.CharacterID,
			&o.Side, &o.Type, &o.Price, &o.Quantity, &o.FilledQty,
			&o.Status, &o.CreatedAt, &o.UpdatedAt); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) UpdateStatus(id string, status domain.OrderStatus, filledQty int64) error {
	query := `UPDATE orders SET status = ?, filled_qty = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, status, filledQty, time.Now(), id)
	return err
}

func (r *OrderRepository) FindByClientOrderID(clientOrderID, userID string) (*domain.Order, error) {
	query := `SELECT id, client_order_id, user_id, character_id, side, type, price, quantity, filled_qty, status, created_at, updated_at
		FROM orders WHERE client_order_id = ? AND user_id = ?`

	order := &domain.Order{}
	err := r.db.QueryRow(query, clientOrderID, userID).Scan(
		&order.ID, &order.ClientOrderID, &order.UserID, &order.CharacterID,
		&order.Side, &order.Type, &order.Price, &order.Quantity, &order.FilledQty,
		&order.Status, &order.CreatedAt, &order.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return order, err
}

func (r *OrderRepository) FindTradesByCharacter(characterID string, limit int) ([]domain.Trade, error) {
	query := `SELECT id, character_id, buy_order_id, sell_order_id, buy_user_id, sell_user_id, price, quantity, tax, created_at
		FROM trades WHERE character_id = ? ORDER BY created_at DESC LIMIT ?`

	rows, err := r.db.Query(query, characterID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trades []domain.Trade
	for rows.Next() {
		var t domain.Trade
		if err := rows.Scan(&t.ID, &t.CharacterID, &t.BuyOrderID, &t.SellOrderID,
			&t.BuyUserID, &t.SellUserID, &t.Price, &t.Quantity, &t.Tax, &t.CreatedAt); err != nil {
			return nil, err
		}
		trades = append(trades, t)
	}
	return trades, nil
}

func (r *OrderRepository) FindKLines(characterID, period string, limit int) ([]domain.KLine, error) {
	query := `SELECT id, character_id, period, open_time, open_price, high_price, low_price, close_price, volume
		FROM klines WHERE character_id = ? AND period = ? ORDER BY open_time DESC LIMIT ?`

	rows, err := r.db.Query(query, characterID, period, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var klines []domain.KLine
	for rows.Next() {
		var k domain.KLine
		if err := rows.Scan(&k.ID, &k.CharacterID, &k.Period, &k.OpenTime,
			&k.OpenPrice, &k.HighPrice, &k.LowPrice, &k.ClosePrice, &k.Volume); err != nil {
			return nil, err
		}
		klines = append(klines, k)
	}
	return klines, nil
}
