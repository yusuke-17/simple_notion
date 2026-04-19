package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"simple-notion-backend/internal/apierror"
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
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_REQUEST", "リクエストボディが不正です", err,
		))
		return
	}

	// 認証失敗時は「メールが存在しない」と「パスワード不一致」を区別せず同じレスポンスを返す
	// （メール列挙攻撃を防ぐ）
	user, err := h.userRepo.GetByEmail(req.Email)
	if err != nil {
		apierror.Write(w, r, apierror.NewUnauthorized(
			"INVALID_CREDENTIALS", "メールアドレスまたはパスワードが正しくありません", err,
		))
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		apierror.Write(w, r, apierror.NewUnauthorized(
			"INVALID_CREDENTIALS", "メールアドレスまたはパスワードが正しくありません", err,
		))
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(h.jwtSecret)
	if err != nil {
		apierror.Write(w, r, apierror.NewInternal(err))
		return
	}

	// セキュアなCookie設定を使用
	cookie := h.createSecureCookie("auth_token", tokenString, 86400) // 24時間
	http.SetCookie(w, cookie)

	apierror.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user":  user,
		"token": tokenString,
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_REQUEST", "リクエストボディが不正です", err,
		))
		return
	}

	// パスワードの基本検証
	if len(req.Password) < 6 {
		apierror.Write(w, r, apierror.NewValidationError(
			"PASSWORD_TOO_SHORT", "パスワードは6文字以上で入力してください", nil,
		))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		apierror.Write(w, r, apierror.NewInternal(err))
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
	}

	if err := h.userRepo.Create(user); err != nil {
		// UNIQUE 制約違反（email 重複）は 409 Conflict として返す
		if errors.Is(err, apierror.ErrConflict) {
			apierror.Write(w, r, apierror.NewConflict(
				"EMAIL_ALREADY_EXISTS", "このメールアドレスは既に登録されています", err,
			))
			return
		}
		apierror.Write(w, r, apierror.NewInternal(err))
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
		apierror.Write(w, r, apierror.NewInternal(err))
		return
	}

	// セキュアなCookie設定を使用
	cookie := h.createSecureCookie("auth_token", tokenString, 86400) // 24時間
	http.SetCookie(w, cookie)

	apierror.WriteJSON(w, http.StatusCreated, map[string]interface{}{
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
		apierror.Write(w, r, apierror.NewUnauthorized(
			"UNAUTHORIZED", "認証が必要です", nil,
		))
		return
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, apierror.ErrNotFound) {
			apierror.Write(w, r, apierror.NewNotFound(
				"USER_NOT_FOUND", "ユーザーが見つかりません", err,
			))
			return
		}
		apierror.Write(w, r, apierror.NewInternal(err))
		return
	}

	apierror.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"user": user,
	})
}
