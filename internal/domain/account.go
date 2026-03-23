package domain

import "time"

type UserRole string

const (
	RoleUser       UserRole = "user"
	RoleAdmin      UserRole = "admin"
	RoleSuperAdmin UserRole = "superadmin"
)

type UserStatus string

const (
	UserStatusActive  UserStatus = "active"
	UserStatusBanned  UserStatus = "banned"
	UserStatusDeleted UserStatus = "deleted"
)

type User struct {
	ID           string     `json:"id" db:"id"`
	Username     string     `json:"username" db:"username"`
	Email        string     `json:"email" db:"email"`
	PasswordHash string     `json:"-" db:"password_hash"`
	Avatar       string     `json:"avatar" db:"avatar"`
	Role         UserRole   `json:"role" db:"role"`
	Status       UserStatus `json:"status" db:"status"`
	LastLoginAt  *time.Time `json:"last_login_at" db:"last_login_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

type Account struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Balance   int64     `json:"balance" db:"balance"`
	Frozen    int64     `json:"frozen" db:"frozen"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type Holding struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	CharacterID string    `json:"character_id" db:"character_id"`
	Quantity    int64     `json:"quantity" db:"quantity"`
	AvgCost     int64     `json:"avg_cost" db:"avg_cost"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type LedgerType string

const (
	LedgerLoginReward  LedgerType = "login_reward"
	LedgerTradeCost    LedgerType = "trade_cost"
	LedgerTradeIncome  LedgerType = "trade_income"
	LedgerTradeTax     LedgerType = "trade_tax"
	LedgerMiningReward LedgerType = "mining_reward"
	LedgerAdminAdjust  LedgerType = "admin_adjust"
)

type Ledger struct {
	ID        string     `json:"id" db:"id"`
	UserID    string     `json:"user_id" db:"user_id"`
	Type      LedgerType `json:"type" db:"type"`
	Amount    int64      `json:"amount" db:"amount"`
	Balance   int64      `json:"balance" db:"balance"`
	RefID     string     `json:"ref_id" db:"ref_id"`
	Remark    string     `json:"remark" db:"remark"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}
