package document

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/middleware"
)

func (h *DocumentHandler) MoveDocument(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserIDFromContext(r.Context())
	vars := mux.Vars(r)
	docID, err := strconv.Atoi(vars["id"])
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_DOCUMENT_ID", "ドキュメントIDが不正です", err,
		))
		return
	}

	var req struct {
		NewParentID *int `json:"parentId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_REQUEST", "リクエストボディが不正です", err,
		))
		return
	}

	// service 層は循環参照や自身を親に設定するケースで ErrForbidden を返す
	if err := h.DocumentService.MoveDocument(docID, req.NewParentID, userID); err != nil {
		apierror.Write(w, r, err)
		return
	}

	// 移動されたドキュメントを取得して返す
	movedDoc, err := h.DocumentService.GetDocumentWithBlocks(docID, userID)
	if err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, movedDoc)
}
