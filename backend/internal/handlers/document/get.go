package document

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/middleware"
)

func (h *DocumentHandler) GetDocumentTree(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())

	tree, err := h.DocRepo.GetDocumentTree(userID)
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

	doc, err := h.DocRepo.GetDocumentWithBlocks(docID, userID)
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
		docs, err := h.DocRepo.GetTrashedDocuments(userID)
		if err != nil {
			http.Error(w, "Failed to load trashed documents", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(docs)
		return
	}

	tree, err := h.DocRepo.GetDocumentTree(userID)
	if err != nil {
		http.Error(w, "Failed to load documents", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}
