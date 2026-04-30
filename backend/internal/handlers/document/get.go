package document

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
)

func (h *DocumentHandler) GetDocumentTree(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())

	tree, err := h.DocumentService.GetDocumentTree(userID)
	if err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, tree)
}

func (h *DocumentHandler) GetDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_DOCUMENT_ID", "ドキュメントIDが不正です", err,
		))
		return
	}

	// includeDeleted クエリパラメータをチェック
	includeDeleted := r.URL.Query().Get("includeDeleted") == "true"

	var doc *models.DocumentWithBlocks
	if includeDeleted {
		doc, err = h.DocumentService.GetDocumentWithBlocksIncludingDeleted(docID, userID)
	} else {
		doc, err = h.DocumentService.GetDocumentWithBlocks(docID, userID)
	}

	if err != nil {
		// ErrNotFound（自分のドキュメントが存在しない／他人のドキュメント）は 404
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, doc)
}

func (h *DocumentHandler) GetDocuments(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	deleted := r.URL.Query().Get("deleted") == "true"

	if deleted {
		docs, err := h.DocumentService.GetTrashedDocuments(userID)
		if err != nil {
			apierror.Write(w, r, err)
			return
		}
		apierror.WriteJSON(w, http.StatusOK, docs)
		return
	}

	tree, err := h.DocumentService.GetDocumentTree(userID)
	if err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, tree)
}
