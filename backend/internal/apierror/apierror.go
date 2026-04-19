// Package apierror はアプリケーション全体で使う統一エラー型とヘルパーを提供する。
// - AppError: HTTP ステータス/エラーコード/ユーザー向けメッセージ/元エラーをまとめた型
// - sentinel error: repository 層で使う種別識別用エラー
// - Write: 任意の error を JSON レスポンス + ログに変換するヘルパー
package apierror

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
)

// AppError はアプリケーション全体で使う統一エラー型。
// Err フィールドには元エラーを保持し、errors.Is / errors.As でチェーンをたどれる。
type AppError struct {
	HTTPStatus int    // HTTP ステータスコード
	Code       string // アプリ内エラーコード（例: "NOT_FOUND"）
	Message    string // ユーザー向けメッセージ（日本語）
	Err        error  // 内部ログ用の元エラー
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap により errors.Is / errors.As がチェーンをたどれる。
func (e *AppError) Unwrap() error { return e.Err }

// NewValidationError は 400 Bad Request 相当のエラーを生成する。
func NewValidationError(code, message string, cause error) *AppError {
	return &AppError{HTTPStatus: http.StatusBadRequest, Code: code, Message: message, Err: cause}
}

// NewUnauthorized は 401 Unauthorized 相当のエラーを生成する。
func NewUnauthorized(code, message string, cause error) *AppError {
	return &AppError{HTTPStatus: http.StatusUnauthorized, Code: code, Message: message, Err: cause}
}

// NewForbidden は 403 Forbidden 相当のエラーを生成する。
func NewForbidden(code, message string, cause error) *AppError {
	return &AppError{HTTPStatus: http.StatusForbidden, Code: code, Message: message, Err: cause}
}

// NewNotFound は 404 Not Found 相当のエラーを生成する。
func NewNotFound(code, message string, cause error) *AppError {
	return &AppError{HTTPStatus: http.StatusNotFound, Code: code, Message: message, Err: cause}
}

// NewConflict は 409 Conflict 相当のエラーを生成する。
func NewConflict(code, message string, cause error) *AppError {
	return &AppError{HTTPStatus: http.StatusConflict, Code: code, Message: message, Err: cause}
}

// NewPayloadTooLarge は 413 Payload Too Large 相当のエラーを生成する。
func NewPayloadTooLarge(code, message string, cause error) *AppError {
	return &AppError{HTTPStatus: http.StatusRequestEntityTooLarge, Code: code, Message: message, Err: cause}
}

// NewInternal は 500 Internal Server Error 相当のエラーを生成する。
func NewInternal(cause error) *AppError {
	return &AppError{
		HTTPStatus: http.StatusInternalServerError,
		Code:       "INTERNAL_SERVER_ERROR",
		Message:    "サーバー内部でエラーが発生しました",
		Err:        cause,
	}
}

// repository 層で使う sentinel error。
// サービス層や handler 層では errors.Is を使って種別を判別する。
var (
	ErrNotFound     = errors.New("resource not found")
	ErrConflict     = errors.New("resource conflict")
	ErrForbidden    = errors.New("forbidden")
	ErrUnauthorized = errors.New("unauthorized")
)

// WrapNotFound は sql.ErrNoRows を apierror.ErrNotFound にラップする。
// それ以外のエラーはそのまま透過する。
func WrapNotFound(err error, msg string) error {
	if errors.Is(err, sql.ErrNoRows) {
		return fmt.Errorf("%s: %w", msg, ErrNotFound)
	}
	return err
}
