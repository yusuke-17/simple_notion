package document

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/models"
)

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

	// デバッグ: ブロック情報をログ出力
	fmt.Printf("[DEBUG] UpdateDocument: docID=%d, title=%s, blocks count=%d\n", docID, req.Title, len(req.Blocks))
	for i, block := range req.Blocks {
		fmt.Printf("[DEBUG] Block %d: id=%d, type=%s, content length=%d\n", i, block.ID, block.Type, len(block.Content))
		if block.Type == "image" || block.Type == "file" {
			fmt.Printf("[DEBUG] Block %d content: %s\n", i, string(block.Content))
		}
	}

	// 該当する場合はリッチテキストJSONを検証
	if err := ValidateRichTextJSON(req.Content); err != nil {
		http.Error(w, "Invalid rich text content", http.StatusBadRequest)
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
			http.Error(w, fmt.Sprintf("Invalid rich text content in block %d", i), http.StatusBadRequest)
			return
		}
	}

	// ドキュメントとブロックを統合更新
	if err := h.DocumentService.UpdateDocumentWithBlocks(docID, userID, req.Title, req.Content, req.Blocks); err != nil {
		http.Error(w, "Failed to update document", http.StatusInternalServerError)
		return
	}

	// 更新されたドキュメントを取得して返す
	updatedDoc, err := h.DocumentService.GetDocumentWithBlocks(docID, userID)
	if err != nil {
		http.Error(w, "Failed to retrieve updated document", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedDoc)
}
