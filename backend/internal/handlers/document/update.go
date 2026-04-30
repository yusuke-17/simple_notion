package document

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/apierror"
	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
)

func (h *DocumentHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
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
		Title   string         `json:"title"`
		Content string         `json:"content"`
		Blocks  []models.Block `json:"blocks"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_REQUEST", "リクエストボディが不正です", err,
		))
		return
	}

	// 該当する場合はリッチテキストJSONを検証
	if err := ValidateRichTextJSON(req.Content); err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_RICH_TEXT", "リッチテキスト形式が不正です", err,
		))
		return
	}

	// ブロックコンテンツのリッチテキスト形式を検証
	// ただし、image と file ブロックは除外（これらは独自のJSONフォーマットを持つ）
	for i, block := range req.Blocks {
		// 画像とファイルブロックはリッチテキストではないのでスキップ
		if block.Type == "image" || block.Type == "file" {
			continue
		}

		// json.RawMessageは[]byte型なので、string()で変換
		contentStr := string(block.Content)
		if err := ValidateRichTextJSON(contentStr); err != nil {
			apierror.Write(w, r, apierror.NewValidationError(
				"INVALID_RICH_TEXT_BLOCK",
				fmt.Sprintf("ブロック %d のリッチテキスト形式が不正です", i),
				err,
			))
			return
		}
	}

	// ドキュメントとブロックを統合更新
	// service 層が ErrNotFound / ErrForbidden / ErrConflict を返す場合は
	// apierror.Write が適切な 404/403/409 に自動変換する
	if err := h.DocumentService.UpdateDocumentWithBlocks(docID, userID, req.Title, req.Content, req.Blocks); err != nil {
		apierror.Write(w, r, err)
		return
	}

	// 更新されたドキュメントを取得して返す
	updatedDoc, err := h.DocumentService.GetDocumentWithBlocks(docID, userID)
	if err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, updatedDoc)
}
