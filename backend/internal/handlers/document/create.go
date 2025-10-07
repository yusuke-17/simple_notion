package document

import (
	"encoding/json"
	"net/http"

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
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// タイトルが空の場合はエラーを返す
	if req.Title == "" {
		http.Error(w, "Title is required", http.StatusBadRequest)
		return
	}

	doc := &models.Document{
		UserID:   userID,
		ParentID: req.ParentID,
		Title:    req.Title,
		Content:  req.Content,
	}

	if err := h.DocumentService.CreateDocument(doc); err != nil {
		http.Error(w, "Failed to create document", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(doc)
}
