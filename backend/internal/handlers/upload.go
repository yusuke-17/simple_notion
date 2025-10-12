package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gorilla/mux"
)

// サポートする画像形式
var supportedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// 最大ファイルサイズ (10MB)
const maxFileSize = 10 << 20

// アップロードレスポンス
type UploadResponse struct {
	Success  bool   `json:"success"`
	Filename string `json:"filename,omitempty"`
	URL      string `json:"url,omitempty"`
	Message  string `json:"message,omitempty"`
}

// エラーレスポンス
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// UploadImageHandler 画像アップロードハンドラー
func UploadImageHandler(w http.ResponseWriter, r *http.Request) {
	// CORSヘッダー設定
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// OPTIONSリクエストの処理
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// POSTメソッドのみ許可
	if r.Method != http.MethodPost {
		sendErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed", "Only POST method is supported")
		return
	}

	// multipart/form-dataの解析（最大32MB）
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		sendErrorResponse(w, http.StatusBadRequest, "Invalid form data", err.Error())
		return
	}

	// ファイルの取得
	file, handler, err := r.FormFile("image")
	if err != nil {
		sendErrorResponse(w, http.StatusBadRequest, "No file uploaded", "Please select an image file to upload")
		return
	}
	defer file.Close()

	// ファイルサイズチェック
	if handler.Size > maxFileSize {
		sendErrorResponse(w, http.StatusBadRequest, "File too large", fmt.Sprintf("File size must be less than %d MB", maxFileSize>>20))
		return
	}

	// MIMEタイプチェック
	contentType := handler.Header.Get("Content-Type")

	// Content-Typeが設定されていない場合はファイル拡張子で判定
	if contentType == "" {
		contentType = getMIMETypeFromExtension(handler.Filename)
	}

	if !isValidImageType(contentType) {
		sendErrorResponse(w, http.StatusBadRequest, "Invalid file type", "Only JPEG, PNG, WebP, and GIF images are supported")
		return
	}

	// ファイル名の生成（重複回避のためタイムスタンプ付き）
	filename := generateUniqueFilename(handler.Filename)

	// uploads ディレクトリの作成
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		sendErrorResponse(w, http.StatusInternalServerError, "Failed to create upload directory", err.Error())
		return
	}

	// ファイルの保存
	filepath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(filepath)
	if err != nil {
		sendErrorResponse(w, http.StatusInternalServerError, "Failed to create file", err.Error())
		return
	}
	defer dst.Close()

	// ファイルの内容をコピー
	_, err = io.Copy(dst, file)
	if err != nil {
		// 失敗した場合はファイルを削除
		os.Remove(filepath)
		sendErrorResponse(w, http.StatusInternalServerError, "Failed to save file", err.Error())
		return
	}

	// 成功レスポンス
	response := UploadResponse{
		Success:  true,
		Filename: filename,
		URL:      fmt.Sprintf("/api/uploads/%s", filename),
		Message:  "Image uploaded successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// ServeUploadsHandler 静的ファイル配信ハンドラー
func ServeUploadsHandler(w http.ResponseWriter, r *http.Request) {
	// パラメータからファイル名を取得
	vars := mux.Vars(r)
	filename := vars["filename"]

	// セキュリティ: パスインジェクション対策
	if !isValidFilename(filename) {
		http.Error(w, "Invalid filename", http.StatusBadRequest)
		return
	}

	// ファイルパス
	filepath := filepath.Join("./uploads", filename)

	// ファイルの存在確認
	if _, err := os.Stat(filepath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// ファイルの配信
	http.ServeFile(w, r, filepath)
}

// ヘルパー関数

// 画像ファイルタイプの検証
func isValidImageType(contentType string) bool {
	return supportedImageTypes[strings.ToLower(contentType)]
}

// ファイル拡張子からMIMEタイプを取得
func getMIMETypeFromExtension(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	default:
		return ""
	}
}

// 一意なファイル名の生成
func generateUniqueFilename(originalName string) string {
	// ファイル拡張子の取得
	ext := filepath.Ext(originalName)

	// ファイル名をサニタイズ（英数字とハイフン、アンダースコアのみ許可）
	baseName := strings.TrimSuffix(originalName, ext)
	reg := regexp.MustCompile(`[^a-zA-Z0-9\-_]`)
	safeName := reg.ReplaceAllString(baseName, "_")

	// 長すぎる場合は切り詰める
	if len(safeName) > 50 {
		safeName = safeName[:50]
	}

	// ナノ秒までのタイムスタンプを付けて一意性を確保
	timestamp := time.Now().UnixNano()
	return fmt.Sprintf("%d_%s%s", timestamp, safeName, ext)
}

// ファイル名の検証（パスインジェクション対策）
func isValidFilename(filename string) bool {
	// 危険な文字やパターンをチェック
	dangerousPatterns := []string{"..", "/", "\\", ":", "*", "?", "\"", "<", ">", "|"}

	for _, pattern := range dangerousPatterns {
		if strings.Contains(filename, pattern) {
			return false
		}
	}

	// 英数字、ハイフン、アンダースコア、ドットのみ許可
	matched, _ := regexp.MatchString(`^[a-zA-Z0-9\-_.]+$`, filename)
	return matched
}

// エラーレスポンスの送信
func sendErrorResponse(w http.ResponseWriter, statusCode int, error, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := ErrorResponse{
		Error:   error,
		Message: message,
	}

	json.NewEncoder(w).Encode(response)
}
