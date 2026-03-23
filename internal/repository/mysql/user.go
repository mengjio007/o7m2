package mysql

import (
	"database/sql"
	"time"

	"o7m2/internal/domain"
)

type UserRepository struct {
	db *DB
}

func NewUserRepository(db *DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *domain.User) error {
	query := `INSERT INTO users (id, username, email, password_hash, avatar, role, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, user.ID, user.Username, user.Email, user.PasswordHash,
		user.Avatar, user.Role, user.Status, user.CreatedAt, user.UpdatedAt)
	return err
}

func (r *UserRepository) FindByEmail(email string) (*domain.User, error) {
	query := `SELECT id, username, email, password_hash, avatar, role, status, last_login_at, created_at, updated_at
		FROM users WHERE email = ? AND status = 'active'`

	user := &domain.User{}
	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.Avatar, &user.Role, &user.Status, &user.LastLoginAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *UserRepository) FindByID(id string) (*domain.User, error) {
	query := `SELECT id, username, email, password_hash, avatar, role, status, last_login_at, created_at, updated_at
		FROM users WHERE id = ?`

	user := &domain.User{}
	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.Avatar, &user.Role, &user.Status, &user.LastLoginAt,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return user, err
}

func (r *UserRepository) UpdateLastLogin(userID string) error {
	query := `UPDATE users SET last_login_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, time.Now(), userID)
	return err
}
