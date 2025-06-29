package repository

import (
	"database/sql"
	"fmt"

	"simple-notion-backend/internal/models"
)

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
		return nil, err
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
		return nil, err
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

	return err
}

func (r *UserRepository) Update(user *models.User) error {
	query, err := r.queries.Get("UpdateUser")
	if err != nil {
		return err
	}

	_, err = r.db.Exec(query, user.Email, user.Name, user.ID)
	return err
}
