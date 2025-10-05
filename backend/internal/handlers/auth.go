package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
	"simple-notion-backend/internal/repository"
)

// UserRepositoryInterface は ユーザーリポジトリ操作のインターフェースを定義します
type UserRepositoryInterface interface {
	GetByEmail(email string) (*models.User, error)
	GetByID(id int) (*models.User, error)
	Create(user *models.User) error
	Update(user *models.User) error
}

type AuthHandler struct {
	userRepo  UserRepositoryInterface
	jwtSecret []byte
	config    *config.Config
}

func NewAuthHandler(userRepo UserRepositoryInterface, jwtSecret []byte, config *config.Config) *AuthHandler {
	return &AuthHandler{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		config:    config,
	}
}

// NewAuthHandlerFromRepo は 具象リポジトリを使用してAuthHandlerを作成します
func NewAuthHandlerFromRepo(userRepo *repository.UserRepository, jwtSecret []byte, config *config.Config) *AuthHandler {
	return &AuthHandler{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
		config:    config,
	}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// createSecureCookie は 環境に基づくセキュアな設定でHTTP Cookieを作成します
func (h *AuthHandler) createSecureCookie(name, value string, maxAge int) *http.Cookie {
	sameSiteMode := http.SameSiteLaxMode
	if h.config.CookieSameSite == "strict" {
		sameSiteMode = http.SameSiteStrictMode
	} else if h.config.CookieSameSite == "none" {
		sameSiteMode = http.SameSiteNoneMode
	}

	cookie := &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		HttpOnly: true,                  // XSS攻撃防止
		Secure:   h.config.CookieSecure, // HTTPS環境でのみ送信
		SameSite: sameSiteMode,          // CSRF攻撃防止
		MaxAge:   maxAge,
	}

	// ドメイン設定がある場合は適用
	if h.config.CookieDomain != "" {
		cookie.Domain = h.config.CookieDomain
	}

	return cookie
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByEmail(req.Email)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// セキュアなCookie設定を使用
	cookie := h.createSecureCookie("auth_token", tokenString, 86400) // 24時間
	http.SetCookie(w, cookie)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":  user,
		"token": tokenString,
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// パスワードの基本検証
	if len(req.Password) < 6 {
		http.Error(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
	}

	if err := h.userRepo.Create(user); err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// 登録後に自動ログイン
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// セキュアなCookie設定を使用
	cookie := h.createSecureCookie("auth_token", tokenString, 86400) // 24時間
	http.SetCookie(w, cookie)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user":  user,
		"token": tokenString,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Cookieを削除するためにMaxAgeを-1に設定
	cookie := h.createSecureCookie("auth_token", "", -1)
	http.SetCookie(w, cookie)

	w.WriteHeader(http.StatusOK)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"user": user,
	})
}
