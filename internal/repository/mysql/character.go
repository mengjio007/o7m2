package mysql

import (
	"database/sql"

	"o7m2/internal/domain"
)

type CharacterRepository struct {
	db *DB
}

func NewCharacterRepository(db *DB) *CharacterRepository {
	return &CharacterRepository{db: db}
}

func (r *CharacterRepository) FindAll(category string, status string) ([]*domain.Character, error) {
	query := `SELECT id, name, category, avatar, description, initial_price, status, created_at, updated_at
		FROM characters WHERE 1=1`
	args := []interface{}{}

	if category != "" {
		query += ` AND category = ?`
		args = append(args, category)
	}
	if status != "" {
		query += ` AND status = ?`
		args = append(args, status)
	}

	query += ` ORDER BY created_at DESC`

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var characters []*domain.Character
	for rows.Next() {
		char := &domain.Character{}
		err := rows.Scan(&char.ID, &char.Name, &char.Category, &char.Avatar,
			&char.Description, &char.InitialPrice, &char.Status, &char.CreatedAt, &char.UpdatedAt)
		if err != nil {
			return nil, err
		}
		characters = append(characters, char)
	}
	return characters, nil
}

func (r *CharacterRepository) FindByID(id string) (*domain.Character, error) {
	query := `SELECT id, name, category, avatar, description, initial_price, status, created_at, updated_at
		FROM characters WHERE id = ?`

	char := &domain.Character{}
	err := r.db.QueryRow(query, id).Scan(
		&char.ID, &char.Name, &char.Category, &char.Avatar,
		&char.Description, &char.InitialPrice, &char.Status, &char.CreatedAt, &char.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return char, err
}

func (r *CharacterRepository) Create(char *domain.Character) error {
	query := `INSERT INTO characters (id, name, category, avatar, description, initial_price, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, char.ID, char.Name, char.Category, char.Avatar,
		char.Description, char.InitialPrice, char.Status, char.CreatedAt, char.UpdatedAt)
	return err
}

func (r *CharacterRepository) Update(char *domain.Character) error {
	query := `UPDATE characters SET name = ?, category = ?, avatar = ?, description = ?, 
		initial_price = ?, status = ?, updated_at = ? WHERE id = ?`

	_, err := r.db.Exec(query, char.Name, char.Category, char.Avatar, char.Description,
		char.InitialPrice, char.Status, char.UpdatedAt, char.ID)
	return err
}

func (r *CharacterRepository) Delete(id string) error {
	query := `UPDATE characters SET status = 'delisted', updated_at = NOW() WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}
