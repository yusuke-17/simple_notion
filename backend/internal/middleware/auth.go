package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"

	"simple-notion-backend/internal/apierror"
)

type contextKey string

const UserIDKey contextKey = "userID"

func AuthMiddleware(jwtSecret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Cookieからトークンを取得
			cookie, err := r.Cookie("auth_token")
			if err != nil {
				// Authorizationヘッダーからも試行
				authHeader := r.Header.Get("Authorization")
				if authHeader == "" {
					apierror.Write(w, r, apierror.NewUnauthorized(
						"NO_AUTH_TOKEN",
						"認証トークンが必要です",
						nil,
					))
					return
				}

				tokenString := strings.TrimPrefix(authHeader, "Bearer ")
				if tokenString == authHeader {
					apierror.Write(w, r, apierror.NewUnauthorized(
						"INVALID_AUTH_HEADER",
						"Authorization ヘッダーの形式が不正です",
						nil,
					))
					return
				}
				cookie = &http.Cookie{Value: tokenString}
			}

			// JWTトークンを検証
			token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return jwtSecret, nil
			})

			if err != nil || !token.Valid {
				apierror.Write(w, r, apierror.NewUnauthorized(
					"INVALID_TOKEN",
					"トークンが無効または期限切れです",
					err,
				))
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				apierror.Write(w, r, apierror.NewUnauthorized(
					"INVALID_TOKEN_CLAIMS",
					"トークンのクレームが不正です",
					nil,
				))
				return
			}

			userID, ok := claims["user_id"].(float64)
			if !ok {
				apierror.Write(w, r, apierror.NewUnauthorized(
					"INVALID_USER_ID_CLAIM",
					"ユーザーIDクレームが不正です",
					nil,
				))
				return
			}

			// コンテキストにユーザーIDを設定
			ctx := context.WithValue(r.Context(), UserIDKey, int(userID))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserIDFromContext(ctx context.Context) int {
	userID, ok := ctx.Value(UserIDKey).(int)
	if !ok {
		return 0
	}
	return userID
}
