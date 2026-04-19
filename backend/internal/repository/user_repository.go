package repository

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/lib/pq"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/models"
)

// postgresUniqueViolation は PostgreSQL の UNIQUE 制約違反エラーコード
const postgresUniqueViolation = "23505"

type UserRepository struct {
	db      *sql.DB
	queries *SQLQueries
}

func NewUserRepository(db *sql.DB) (*UserRepository, error) {
	queries, err := NewSQLQueries()
	if err != nil {
		return nil, fmt.Errorf("failed to load SQL queries: %w", err)
	}

	return &UserRepository{
		db:      db,
		queries: queries,
	}, nil
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	query, err := r.queries.Get("GetUserByEmail")
	if err != nil {
		return nil, err
	}

	var user models.User
	err = r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, apierror.WrapNotFound(err, fmt.Sprintf("user email=%s", email))
	}

	return &user, nil
}

func (r *UserRepository) GetByID(id int) (*models.User, error) {
	query, err := r.queries.Get("GetUserByID")
	if err != nil {
		return nil, err
	}

	var user models.User
	err = r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.Name,
		&user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, apierror.WrapNotFound(err, fmt.Sprintf("user id=%d", id))
	}

	return &user, nil
}

func (r *UserRepository) Create(user *models.User) error {
	query, err := r.queries.Get("CreateUser")
	if err != nil {
		return err
	}

	err = r.db.QueryRow(query, user.Email, user.PasswordHash, user.Name).Scan(
		&user.ID, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		// UNIQUE 制約違反（email 重複など）は ErrConflict にラップする
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == postgresUniqueViolation {
			return fmt.Errorf("user email=%s: %w", user.Email, apierror.ErrConflict)
		}
		return err
	}

	return nil
}

func (r *UserRepository) Update(user *models.User) error {
	query, err := r.queries.Get("UpdateUser")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, user.Email, user.Name, user.ID)
	return err
}
