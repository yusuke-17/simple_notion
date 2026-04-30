package document

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/middleware"
)

func (h *DocumentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_DOCUMENT_ID", "ドキュメントIDが不正です", err,
		))
		return
	}

	// 該当文書が存在しなければ 404、既にゴミ箱なら 409 (service 層が ErrConflict を返す)
	if err := h.DocumentService.SoftDeleteDocument(docID, userID); err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, map[string]string{"message": "Document deleted successfully"})
}

func (h *DocumentHandler) RestoreDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_DOCUMENT_ID", "ドキュメントIDが不正です", err,
		))
		return
	}

	// ゴミ箱にない文書の復元は 409 (ErrConflict)
	if err := h.DocumentService.RestoreDocument(docID, userID); err != nil {
		apierror.Write(w, r, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *DocumentHandler) PermanentDeleteDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_DOCUMENT_ID", "ドキュメントIDが不正です", err,
		))
		return
	}

	// ゴミ箱に入っていない文書の完全削除は 409 (ErrConflict)
	if err := h.DocumentService.PermanentDeleteDocument(docID, userID); err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, map[string]string{"message": "Document permanently deleted"})
}
