package apierror

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAppError_Error(t *testing.T) {
	tests := []struct {
		name string
		err  *AppError
		want string
	}{
		{
			name: "cause なし",
			err:  &AppError{Code: "NOT_FOUND", Message: "文書が見つかりません"},
			want: "[NOT_FOUND] 文書が見つかりません",
		},
		{
			name: "cause あり",
			err: &AppError{
				Code:    "NOT_FOUND",
				Message: "文書が見つかりません",
				Err:     errors.New("database error"),
			},
			want: "[NOT_FOUND] 文書が見つかりません: database error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.err.Error(); got != tt.want {
				t.Errorf("Error() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestAppError_Unwrap_IsAs(t *testing.T) {
	original := errors.New("original")
	wrapped := &AppError{Code: "X", Err: original}

	if !errors.Is(wrapped, original) {
		t.Error("errors.Is が元エラーを検出できていない")
	}

	var target *AppError
	if !errors.As(wrapped, &target) {
		t.Error("errors.As が *AppError を取り出せない")
	}
	if target.Code != "X" {
		t.Errorf("Code = %q, want %q", target.Code, "X")
	}
}

func TestConstructors_HTTPStatus(t *testing.T) {
	tests := []struct {
		name       string
		err        *AppError
		wantStatus int
	}{
		{"validation", NewValidationError("C", "m", nil), http.StatusBadRequest},
		{"unauthorized", NewUnauthorized("C", "m", nil), http.StatusUnauthorized},
		{"forbidden", NewForbidden("C", "m", nil), http.StatusForbidden},
		{"not found", NewNotFound("C", "m", nil), http.StatusNotFound},
		{"conflict", NewConflict("C", "m", nil), http.StatusConflict},
		{"payload too large", NewPayloadTooLarge("C", "m", nil), http.StatusRequestEntityTooLarge},
		{"internal", NewInternal(nil), http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.err.HTTPStatus != tt.wantStatus {
				t.Errorf("HTTPStatus = %d, want %d", tt.err.HTTPStatus, tt.wantStatus)
			}
		})
	}
}

func TestWrapNotFound(t *testing.T) {
	tests := []struct {
		name        string
		input       error
		wantIsFound bool
	}{
		{
			name:        "sql.ErrNoRows は ErrNotFound にラップされる",
			input:       sql.ErrNoRows,
			wantIsFound: true,
		},
		{
			name:        "他のエラーはそのまま透過する",
			input:       errors.New("connection lost"),
			wantIsFound: false,
		},
		{
			name:        "ラップされた sql.ErrNoRows も検出される",
			input:       fmt.Errorf("scan: %w", sql.ErrNoRows),
			wantIsFound: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := WrapNotFound(tt.input, "user id=1")
			if errors.Is(got, ErrNotFound) != tt.wantIsFound {
				t.Errorf("errors.Is(result, ErrNotFound) = %v, want %v",
					errors.Is(got, ErrNotFound), tt.wantIsFound)
			}
		})
	}
}

func TestWrite_WritesJSON(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{
			name:       "*AppError はそのまま使われる",
			err:        NewNotFound("DOC_NOT_FOUND", "文書が見つかりません", nil),
			wantStatus: http.StatusNotFound,
			wantCode:   "DOC_NOT_FOUND",
		},
		{
			name:       "ErrNotFound sentinel は自動昇格する",
			err:        fmt.Errorf("query failed: %w", ErrNotFound),
			wantStatus: http.StatusNotFound,
			wantCode:   "NOT_FOUND",
		},
		{
			name:       "ErrConflict sentinel は 409 に昇格する",
			err:        fmt.Errorf("unique violation: %w", ErrConflict),
			wantStatus: http.StatusConflict,
			wantCode:   "CONFLICT",
		},
		{
			name:       "未知のエラーは 500 になる",
			err:        errors.New("boom"),
			wantStatus: http.StatusInternalServerError,
			wantCode:   "INTERNAL_SERVER_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/api/test", nil)

			Write(w, r, tt.err)

			if w.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tt.wantStatus)
			}

			ct := w.Header().Get("Content-Type")
			if ct != "application/json" {
				t.Errorf("Content-Type = %q, want %q", ct, "application/json")
			}

			var resp ErrorResponse
			if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
				t.Fatalf("JSON デコード失敗: %v", err)
			}
			if resp.Error != tt.wantCode {
				t.Errorf("Error = %q, want %q", resp.Error, tt.wantCode)
			}
			if resp.Message == "" {
				t.Error("Message が空")
			}
		})
	}
}

func TestToAppError_Nil(t *testing.T) {
	// nil エラーでもパニックせず 500 として扱う
	got := toAppError(nil)
	if got.HTTPStatus != http.StatusInternalServerError {
		t.Errorf("nil エラーの HTTPStatus = %d, want 500", got.HTTPStatus)
	}
}
