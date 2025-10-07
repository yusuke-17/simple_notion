package document

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/middleware"
)

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

	if err := h.DocumentService.MoveDocument(docID, req.NewParentID, userID); err != nil {
		http.Error(w, "Failed to move document", http.StatusInternalServerError)
		return
	}

	// 移動されたドキュメントを取得して返す
	movedDoc, err := h.DocumentService.GetDocumentWithBlocks(docID, userID)
	if err != nil {
		http.Error(w, "Failed to retrieve moved document", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(movedDoc)
}
