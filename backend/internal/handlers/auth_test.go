package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
)

// createTestConfig は セキュリティ設定を無効にしたテスト用設定を作成します
func createTestConfig() *config.Config {
	return &config.Config{
		Environment:    "development",
		CookieSecure:   false,
		CookieSameSite: "lax",
		CookieDomain:   "",
	}
}

// MockUserRepository は UserRepository のモック実装。
// 本番の UserRepository と同様、存在しないレコードは apierror.ErrNotFound、
// UNIQUE 制約違反は apierror.ErrConflict をラップしたエラーを返す。
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
		return nil, fmt.Errorf("user email=%s: %w", email, apierror.ErrNotFound)
	}
	return user, nil
}

func (m *MockUserRepository) GetByID(id int) (*models.User, error) {
	user, exists := m.usersByID[id]
	if !exists {
		return nil, fmt.Errorf("user id=%d: %w", id, apierror.ErrNotFound)
	}
	return user, nil
}

func (m *MockUserRepository) Create(user *models.User) error {
	// UNIQUE 制約違反を模す
	if _, exists := m.users[user.Email]; exists {
		return fmt.Errorf("user email=%s: %w", user.Email, apierror.ErrConflict)
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
		return fmt.Errorf("user id=%d: %w", user.ID, apierror.ErrNotFound)
	}

	user.UpdatedAt = time.Now()
	m.users[user.Email] = user
	m.usersByID[user.ID] = user

	return nil
}

// decodeErrorResponse はレスポンスボディを apierror.ErrorResponse にデコードする
func decodeErrorResponse(t *testing.T, body *bytes.Buffer) apierror.ErrorResponse {
	t.Helper()
	var resp apierror.ErrorResponse
	if err := json.Unmarshal(body.Bytes(), &resp); err != nil {
		t.Fatalf("エラーレスポンスの JSON デコードに失敗: %v (body=%s)", err, body.String())
	}
	return resp
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
		if resp := decodeErrorResponse(t, w.Body); resp.Error != "INVALID_CREDENTIALS" {
			t.Errorf("Expected error code INVALID_CREDENTIALS, got %s", resp.Error)
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
		if resp := decodeErrorResponse(t, w.Body); resp.Error != "INVALID_CREDENTIALS" {
			t.Errorf("Expected error code INVALID_CREDENTIALS, got %s", resp.Error)
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
		if resp := decodeErrorResponse(t, w.Body); resp.Error != "INVALID_REQUEST" {
			t.Errorf("Expected error code INVALID_REQUEST, got %s", resp.Error)
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
		if resp := decodeErrorResponse(t, w.Body); resp.Error != "PASSWORD_TOO_SHORT" {
			t.Errorf("Expected error code PASSWORD_TOO_SHORT, got %s", resp.Error)
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

		// 破壊的変更: 500 → 409 Conflict に変更
		if w.Code != http.StatusConflict {
			t.Errorf("Expected status code 409, got %d", w.Code)
		}
		if resp := decodeErrorResponse(t, w.Body); resp.Error != "EMAIL_ALREADY_EXISTS" {
			t.Errorf("Expected error code EMAIL_ALREADY_EXISTS, got %s", resp.Error)
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
		if resp := decodeErrorResponse(t, w.Body); resp.Error != "UNAUTHORIZED" {
			t.Errorf("Expected error code UNAUTHORIZED, got %s", resp.Error)
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
		if resp := decodeErrorResponse(t, w.Body); resp.Error != "USER_NOT_FOUND" {
			t.Errorf("Expected error code USER_NOT_FOUND, got %s", resp.Error)
		}
	})
}

// TestCookieSecuritySettings は Cookieセキュリティ設定をテストします
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
