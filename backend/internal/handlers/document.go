package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
	"simple-notion-backend/internal/repository"
)

type DocumentHandler struct {
	docRepo *repository.DocumentRepository
}

func NewDocumentHandler(docRepo *repository.DocumentRepository) *DocumentHandler {
	return &DocumentHandler{
		docRepo: docRepo,
	}
}

func (h *DocumentHandler) GetDocumentTree(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())

	tree, err := h.docRepo.GetDocumentTree(userID)
	if err != nil {
		http.Error(w, "Failed to load documents", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}

func (h *DocumentHandler) GetDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid document ID", http.StatusBadRequest)
		return
	}

	doc, err := h.docRepo.GetDocumentWithBlocks(docID, userID)
	if err != nil {
		http.Error(w, "Document not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(doc)
}

func (h *DocumentHandler) GetDocuments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	deleted := r.URL.Query().Get("deleted") == "true"

	if deleted {
		docs, err := h.docRepo.GetTrashedDocuments(userID)
		if err != nil {
			http.Error(w, "Failed to load trashed documents", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(docs)
		return
	}

	tree, err := h.docRepo.GetDocumentTree(userID)
	if err != nil {
		http.Error(w, "Failed to load documents", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}

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

	if err := h.docRepo.CreateDocument(doc); err != nil {
		http.Error(w, "Failed to create document", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(doc)
}

func (h *DocumentHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid document ID", http.StatusBadRequest)
		return
	}

	var req struct {
		Title   string         `json:"title"`
		Content string         `json:"content"`
		Blocks  []models.Block `json:"blocks"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// ドキュメント更新（titleとcontentの両方を更新）
	if err := h.docRepo.UpdateDocument(docID, userID, req.Title, req.Content); err != nil {
		http.Error(w, "Failed to update document", http.StatusInternalServerError)
		return
	}

	// ブロック更新
	if err := h.docRepo.UpdateBlocks(docID, req.Blocks); err != nil {
		http.Error(w, "Failed to update blocks", http.StatusInternalServerError)
		return
	}

	// 更新されたドキュメントを取得して返す
	updatedDoc, err := h.docRepo.GetDocumentWithBlocks(docID, userID)
	if err != nil {
		http.Error(w, "Failed to retrieve updated document", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedDoc)
}

func (h *DocumentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid document ID", http.StatusBadRequest)
		return
	}

	if err := h.docRepo.SoftDeleteDocument(docID, userID); err != nil {
		http.Error(w, "Failed to delete document", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Document deleted successfully"})
}

func (h *DocumentHandler) RestoreDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid document ID", http.StatusBadRequest)
		return
	}

	if err := h.docRepo.RestoreDocument(docID, userID); err != nil {
		http.Error(w, "Failed to restore document", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *DocumentHandler) MoveDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid document ID", http.StatusBadRequest)
		return
	}

	var req struct {
		NewParentID *int `json:"parentId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := h.docRepo.MoveDocument(docID, req.NewParentID, userID); err != nil {
		http.Error(w, "Failed to move document", http.StatusInternalServerError)
		return
	}

	// 移動されたドキュメントを取得して返す
	movedDoc, err := h.docRepo.GetDocumentWithBlocks(docID, userID)
	if err != nil {
		http.Error(w, "Failed to retrieve moved document", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(movedDoc)
}
