package mysql

import (
	"database/sql"

	"o7m2/internal/domain"
)

type AccountRepository struct {
	db *DB
}

func NewAccountRepository(db *DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) Create(account *domain.Account) error {
	query := `INSERT INTO accounts (id, user_id, balance, frozen, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, account.ID, account.UserID, account.Balance,
		account.Frozen, account.CreatedAt, account.UpdatedAt)
	return err
}

func (r *AccountRepository) FindByUserID(userID string) (*domain.Account, error) {
	query := `SELECT id, user_id, balance, frozen, created_at, updated_at
		FROM accounts WHERE user_id = ?`

	account := &domain.Account{}
	err := r.db.QueryRow(query, userID).Scan(
		&account.ID, &account.UserID, &account.Balance,
		&account.Frozen, &account.CreatedAt, &account.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return account, err
}

func (r *AccountRepository) UpdateBalance(userID string, balance int64) error {
	query := `UPDATE accounts SET balance = ?, updated_at = NOW() WHERE user_id = ?`
	_, err := r.db.Exec(query, balance, userID)
	return err
}

func (r *AccountRepository) GetHolding(userID, characterID string) (*domain.Holding, error) {
	query := `SELECT id, user_id, character_id, quantity, avg_cost, created_at, updated_at
		FROM holdings WHERE user_id = ? AND character_id = ?`

	holding := &domain.Holding{}
	err := r.db.QueryRow(query, userID, characterID).Scan(
		&holding.ID, &holding.UserID, &holding.CharacterID,
		&holding.Quantity, &holding.AvgCost, &holding.CreatedAt, &holding.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return &domain.Holding{
			UserID:      userID,
			CharacterID: characterID,
			Quantity:    0,
			AvgCost:     0,
		}, nil
	}
	return holding, err
}

func (r *AccountRepository) GetHoldings(userID string) ([]*domain.Holding, error) {
	query := `SELECT id, user_id, character_id, quantity, avg_cost, created_at, updated_at
		FROM holdings WHERE user_id = ? AND quantity > 0`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var holdings []*domain.Holding
	for rows.Next() {
		h := &domain.Holding{}
		err := rows.Scan(&h.ID, &h.UserID, &h.CharacterID,
			&h.Quantity, &h.AvgCost, &h.CreatedAt, &h.UpdatedAt)
		if err != nil {
			return nil, err
		}
		holdings = append(holdings, h)
	}
	return holdings, nil
}

func (r *AccountRepository) UpsertHolding(holding *domain.Holding) error {
	query := `INSERT INTO holdings (id, user_id, character_id, quantity, avg_cost, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE quantity = ?, avg_cost = ?, updated_at = ?`

	_, err := r.db.Exec(query, holding.ID, holding.UserID, holding.CharacterID,
		holding.Quantity, holding.AvgCost, holding.CreatedAt, holding.UpdatedAt,
		holding.Quantity, holding.AvgCost, holding.UpdatedAt)
	return err
}

func (r *AccountRepository) CreateLedger(ledger *domain.Ledger) error {
	query := `INSERT INTO ledger (id, user_id, type, amount, balance, ref_id, remark, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, ledger.ID, ledger.UserID, ledger.Type,
		ledger.Amount, ledger.Balance, ledger.RefID, ledger.Remark, ledger.CreatedAt)
	return err
}
