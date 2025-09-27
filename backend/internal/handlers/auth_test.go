package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
)

// エラー定義
var ErrUserExists = errors.New("user already exists")

// createTestConfig creates a config for testing with secure settings disabled
func createTestConfig() *config.Config {
	return &config.Config{
		Environment:    "development",
		CookieSecure:   false,
		CookieSameSite: "lax",
		CookieDomain:   "",
	}
}

// MockUserRepository は UserRepository のモック実装
type MockUserRepository struct {
	users     map[string]*models.User
	usersByID map[int]*models.User
	nextID    int
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users:     make(map[string]*models.User),
		usersByID: make(map[int]*models.User),
		nextID:    1,
	}
}

func (m *MockUserRepository) GetByEmail(email string) (*models.User, error) {
	user, exists := m.users[email]
	if !exists {
		return nil, sql.ErrNoRows
	}
	return user, nil
}

func (m *MockUserRepository) GetByID(id int) (*models.User, error) {
	user, exists := m.usersByID[id]
	if !exists {
		return nil, sql.ErrNoRows
	}
	return user, nil
}

func (m *MockUserRepository) Create(user *models.User) error {
	// 既存のユーザーチェック
	if _, exists := m.users[user.Email]; exists {
		return ErrUserExists
	}

	user.ID = m.nextID
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	m.users[user.Email] = user
	m.usersByID[user.ID] = user
	m.nextID++

	return nil
}

func (m *MockUserRepository) Update(user *models.User) error {
	if _, exists := m.usersByID[user.ID]; !exists {
		return sql.ErrNoRows
	}

	user.UpdatedAt = time.Now()
	m.users[user.Email] = user
	m.usersByID[user.ID] = user

	return nil
}

func TestAuthHandler_Login(t *testing.T) {
	// テストデータのセットアップ
	mockRepo := NewMockUserRepository()
	jwtSecret := []byte("test-secret-key")
	testConfig := createTestConfig()
	handler := NewAuthHandler(mockRepo, jwtSecret, testConfig)

	// テストユーザーの作成
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	testUser := &models.User{
		ID:           1,
		Email:        "test@example.com",
		PasswordHash: string(hashedPassword),
		Name:         "Test User",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	mockRepo.users["test@example.com"] = testUser
	mockRepo.usersByID[1] = testUser

	t.Run("successful login", func(t *testing.T) {
		loginReq := LoginRequest{
			Email:    "test@example.com",
			Password: "password123",
		}
		body, _ := json.Marshal(loginReq)

		req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Login(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code 200, got %d", w.Code)
		}

		// レスポンスの検証
		var response map[string]interface{}
		json.NewDecoder(w.Body).Decode(&response)

		if response["user"] == nil {
			t.Error("Expected user in response")
		}
		if response["token"] == nil {
			t.Error("Expected token in response")
		}

		// Cookieの検証
		cookies := w.Result().Cookies()
		var authCookie *http.Cookie
		for _, cookie := range cookies {
			if cookie.Name == "auth_token" {
				authCookie = cookie
				break
			}
		}
		if authCookie == nil {
			t.Error("Expected auth_token cookie to be set")
		}
	})

	t.Run("invalid email", func(t *testing.T) {
		loginReq := LoginRequest{
			Email:    "nonexistent@example.com",
			Password: "password123",
		}
		body, _ := json.Marshal(loginReq)

		req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Login(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status code 401, got %d", w.Code)
		}
	})

	t.Run("invalid password", func(t *testing.T) {
		loginReq := LoginRequest{
			Email:    "test@example.com",
			Password: "wrongpassword",
		}
		body, _ := json.Marshal(loginReq)

		req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Login(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status code 401, got %d", w.Code)
		}
	})

	t.Run("invalid JSON", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewReader([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Login(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code 400, got %d", w.Code)
		}
	})
}

func TestAuthHandler_Register(t *testing.T) {
	mockRepo := NewMockUserRepository()
	jwtSecret := []byte("test-secret-key")
	testConfig := createTestConfig()
	handler := NewAuthHandler(mockRepo, jwtSecret, testConfig)

	t.Run("successful registration", func(t *testing.T) {
		registerReq := RegisterRequest{
			Email:    "newuser@example.com",
			Password: "password123",
			Name:     "New User",
		}
		body, _ := json.Marshal(registerReq)

		req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Register(w, req)

		if w.Code != http.StatusCreated {
			t.Errorf("Expected status code 201, got %d", w.Code)
		}

		// レスポンスの検証
		var response map[string]interface{}
		json.NewDecoder(w.Body).Decode(&response)

		if response["user"] == nil {
			t.Error("Expected user in response")
		}
		if response["token"] == nil {
			t.Error("Expected token in response")
		}

		// ユーザーが作成されたか確認
		user, exists := mockRepo.users["newuser@example.com"]
		if !exists {
			t.Error("User should be created in repository")
		}
		if user.Name != "New User" {
			t.Errorf("Expected user name to be 'New User', got %s", user.Name)
		}
	})

	t.Run("password too short", func(t *testing.T) {
		registerReq := RegisterRequest{
			Email:    "user@example.com",
			Password: "123",
			Name:     "User",
		}
		body, _ := json.Marshal(registerReq)

		req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Register(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code 400, got %d", w.Code)
		}
	})

	t.Run("duplicate email", func(t *testing.T) {
		// 最初のユーザーを登録
		testUser := &models.User{
			ID:    1,
			Email: "existing@example.com",
			Name:  "Existing User",
		}
		mockRepo.users["existing@example.com"] = testUser

		registerReq := RegisterRequest{
			Email:    "existing@example.com",
			Password: "password123",
			Name:     "Another User",
		}
		body, _ := json.Marshal(registerReq)

		req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Register(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("Expected status code 500, got %d", w.Code)
		}
	})

	t.Run("invalid JSON", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Register(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code 400, got %d", w.Code)
		}
	})
}

func TestAuthHandler_Logout(t *testing.T) {
	mockRepo := NewMockUserRepository()
	jwtSecret := []byte("test-secret-key")
	testConfig := createTestConfig()
	handler := NewAuthHandler(mockRepo, jwtSecret, testConfig)

	t.Run("successful logout", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
		w := httptest.NewRecorder()

		handler.Logout(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code 200, got %d", w.Code)
		}

		// Cookieが削除されたか確認
		cookies := w.Result().Cookies()
		var authCookie *http.Cookie
		for _, cookie := range cookies {
			if cookie.Name == "auth_token" {
				authCookie = cookie
				break
			}
		}
		if authCookie == nil {
			t.Error("Expected auth_token cookie to be set for deletion")
		} else if authCookie.MaxAge != -1 {
			t.Error("Expected auth_token cookie MaxAge to be -1 for deletion")
		}
	})
}

func TestAuthHandler_Me(t *testing.T) {
	mockRepo := NewMockUserRepository()
	jwtSecret := []byte("test-secret-key")
	testConfig := createTestConfig()
	handler := NewAuthHandler(mockRepo, jwtSecret, testConfig)

	// テストユーザーの作成
	testUser := &models.User{
		ID:    1,
		Email: "test@example.com",
		Name:  "Test User",
	}
	mockRepo.usersByID[1] = testUser

	t.Run("successful me request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)

		// コンテキストにユーザーIDを設定
		ctx := context.WithValue(req.Context(), middleware.UserIDKey, 1)
		req = req.WithContext(ctx)

		w := httptest.NewRecorder()

		handler.Me(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status code 200, got %d", w.Code)
		}

		var response map[string]interface{}
		json.NewDecoder(w.Body).Decode(&response)

		if response["user"] == nil {
			t.Error("Expected user in response")
		}
	})

	t.Run("unauthorized request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
		w := httptest.NewRecorder()

		handler.Me(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status code 401, got %d", w.Code)
		}
	})

	t.Run("user not found", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)

		// 存在しないユーザーIDを設定
		ctx := context.WithValue(req.Context(), middleware.UserIDKey, 999)
		req = req.WithContext(ctx)

		w := httptest.NewRecorder()

		handler.Me(w, req)

		if w.Code != http.StatusNotFound {
			t.Errorf("Expected status code 404, got %d", w.Code)
		}
	})
}

// TestCookieSecuritySettings tests cookie security configurations
func TestCookieSecuritySettings(t *testing.T) {
	mockRepo := NewMockUserRepository()
	jwtSecret := []byte("test-secret-key")

	t.Run("development environment settings", func(t *testing.T) {
		devConfig := &config.Config{
			Environment:    "development",
			CookieSecure:   false,
			CookieSameSite: "lax",
			CookieDomain:   "",
		}
		handler := NewAuthHandler(mockRepo, jwtSecret, devConfig)

		// テストユーザーの作成
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &models.User{
			ID:           1,
			Email:        "test@example.com",
			PasswordHash: string(hashedPassword),
			Name:         "Test User",
		}
		mockRepo.users["test@example.com"] = testUser

		loginReq := LoginRequest{
			Email:    "test@example.com",
			Password: "password123",
		}
		body, _ := json.Marshal(loginReq)
		req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Login(w, req)

		// Cookieの設定を確認
		cookies := w.Result().Cookies()
		if len(cookies) == 0 {
			t.Fatal("Expected auth_token cookie to be set")
		}

		cookie := cookies[0]
		if cookie.Name != "auth_token" {
			t.Errorf("Expected cookie name 'auth_token', got %s", cookie.Name)
		}
		if cookie.HttpOnly != true {
			t.Error("Expected HttpOnly to be true")
		}
		if cookie.Secure != false {
			t.Error("Expected Secure to be false in development")
		}
		if cookie.SameSite != http.SameSiteLaxMode {
			t.Error("Expected SameSite to be Lax in development")
		}
	})

	t.Run("production environment settings", func(t *testing.T) {
		prodConfig := &config.Config{
			Environment:    "production",
			CookieSecure:   true,
			CookieSameSite: "strict",
			CookieDomain:   "example.com",
		}
		handler := NewAuthHandler(mockRepo, jwtSecret, prodConfig)

		// テストユーザーの作成
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		testUser := &models.User{
			ID:           2,
			Email:        "prod@example.com",
			PasswordHash: string(hashedPassword),
			Name:         "Prod User",
		}
		mockRepo.users["prod@example.com"] = testUser

		loginReq := LoginRequest{
			Email:    "prod@example.com",
			Password: "password123",
		}
		body, _ := json.Marshal(loginReq)
		req := httptest.NewRequest(http.MethodPost, "/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Login(w, req)

		// Cookieの設定を確認
		cookies := w.Result().Cookies()
		if len(cookies) == 0 {
			t.Fatal("Expected auth_token cookie to be set")
		}

		cookie := cookies[0]
		if cookie.Name != "auth_token" {
			t.Errorf("Expected cookie name 'auth_token', got %s", cookie.Name)
		}
		if cookie.HttpOnly != true {
			t.Error("Expected HttpOnly to be true")
		}
		if cookie.Secure != true {
			t.Error("Expected Secure to be true in production")
		}
		if cookie.SameSite != http.SameSiteStrictMode {
			t.Error("Expected SameSite to be Strict in production")
		}
		if cookie.Domain != "example.com" {
			t.Errorf("Expected Domain to be 'example.com', got %s", cookie.Domain)
		}
	})

	t.Run("logout cookie deletion", func(t *testing.T) {
		testConfig := createTestConfig()
		handler := NewAuthHandler(mockRepo, jwtSecret, testConfig)

		req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
		w := httptest.NewRecorder()

		handler.Logout(w, req)

		// Cookieの削除を確認
		cookies := w.Result().Cookies()
		if len(cookies) == 0 {
			t.Fatal("Expected auth_token cookie to be set for deletion")
		}

		cookie := cookies[0]
		if cookie.Name != "auth_token" {
			t.Errorf("Expected cookie name 'auth_token', got %s", cookie.Name)
		}
		if cookie.MaxAge != -1 {
			t.Errorf("Expected MaxAge to be -1 for deletion, got %d", cookie.MaxAge)
		}
		if cookie.Value != "" {
			t.Errorf("Expected empty value for deletion, got %s", cookie.Value)
		}
	})
}
