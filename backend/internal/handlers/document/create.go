package document

import (
	"encoding/json"
	"net/http"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
)

func (h *DocumentHandler) CreateDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())

	var req struct {
		Title    string `json:"title"`
		Content  string `json:"content"`
		ParentID *int   `json:"parentId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_REQUEST", "リクエストボディが不正です", err,
		))
		return
	}

	// タイトルが空の場合はエラーを返す
	if req.Title == "" {
		apierror.Write(w, r, apierror.NewValidationError(
			"TITLE_REQUIRED", "タイトルを入力してください", nil,
		))
		return
	}

	doc := &models.Document{
		UserID:   userID,
		ParentID: req.ParentID,
		Title:    req.Title,
		Content:  req.Content,
	}

	// service 層から返る sentinel error は apierror.Write が自動で 404/409 等に変換する
	if err := h.DocumentService.CreateDocument(doc); err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusCreated, doc)
}
