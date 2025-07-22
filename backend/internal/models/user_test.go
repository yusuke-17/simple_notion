package models

import (
	"testing"
	"time"
)

func TestUser(t *testing.T) {
	t.Run("User struct creation", func(t *testing.T) {
		now := time.Now()
		user := User{
			ID:           1,
			Email:        "test@example.com",
			PasswordHash: "hashed_password",
			Name:         "Test User",
			CreatedAt:    now,
			UpdatedAt:    now,
		}

		if user.ID != 1 {
			t.Errorf("Expected ID to be 1, got %d", user.ID)
		}
		if user.Email != "test@example.com" {
			t.Errorf("Expected Email to be test@example.com, got %s", user.Email)
		}
		if user.Name != "Test User" {
			t.Errorf("Expected Name to be Test User, got %s", user.Name)
		}
	})
}
