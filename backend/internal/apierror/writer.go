package apierror

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
)

// ErrorResponse は統一エラーレスポンスの JSON 形式（{error, message}）。
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// Write は任意の err を適切な HTTP レスポンスとサーバーログに変換する。
// handler/middleware からはこの関数を呼ぶだけでよい。
func Write(w http.ResponseWriter, r *http.Request, err error) {
	appErr := toAppError(err)

	// 元エラーの詳細はサーバーログに必ず記録する（クライアントには返さない）
	method, path := "-", "-"
	if r != nil {
		method = r.Method
		if r.URL != nil {
			path = r.URL.Path
		}
	}
	log.Printf("[%s] %s %s -> %d: %v",
		appErr.Code, method, path, appErr.HTTPStatus, appErr.Err)

	WriteJSON(w, appErr.HTTPStatus, ErrorResponse{
		Error:   appErr.Code,
		Message: appErr.Message,
	})
}

// WriteJSON は任意の body を JSON として書き出す汎用ヘルパー。
func WriteJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

// toAppError は任意のエラーを *AppError に正規化する。
// - 既に *AppError ならそのまま返す
// - sentinel error はステータスコード付きの AppError に昇格する
// - それ以外は 500 Internal として扱う
func toAppError(err error) *AppError {
	if err == nil {
		return NewInternal(nil)
	}

	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}

	switch {
	case errors.Is(err, ErrNotFound):
		return NewNotFound("NOT_FOUND", "リソースが見つかりません", err)
	case errors.Is(err, ErrConflict):
		return NewConflict("CONFLICT", "リソースが競合しています", err)
	case errors.Is(err, ErrForbidden):
		return NewForbidden("FORBIDDEN", "アクセス権限がありません", err)
	case errors.Is(err, ErrUnauthorized):
		return NewUnauthorized("UNAUTHORIZED", "認証が必要です", err)
	}

	return NewInternal(err)
}
