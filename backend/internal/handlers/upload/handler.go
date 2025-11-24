package upload

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/services"
)

// UploadHandler は ファイルアップロード関連のHTTPハンドラーです
type UploadHandler struct {
	fileService      *services.FileService
	userStorageQuota int64

	// 署名付きURLのキャッシュ（TTL: 23時間）
	urlCache      map[string]*CachedURL
	urlCacheMutex sync.RWMutex
}

// CachedURL は キャッシュされた署名付きURL情報です
type CachedURL struct {
	URL       string
	ExpiresAt time.Time
}

// NewUploadHandler は 新しい UploadHandler インスタンスを作成します
func NewUploadHandler(fileService *services.FileService, userStorageQuota int64) *UploadHandler {
	handler := &UploadHandler{
		fileService:      fileService,
		userStorageQuota: userStorageQuota,
		urlCache:         make(map[string]*CachedURL),
	}

	// キャッシュクリーンアップのゴルーチンを起動
	go handler.cleanupExpiredCache()

	return handler
}

// cleanupExpiredCache は 期限切れのキャッシュを定期的にクリーンアップします
func (h *UploadHandler) cleanupExpiredCache() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		h.urlCacheMutex.Lock()
		now := time.Now()
		for key, cached := range h.urlCache {
			if now.After(cached.ExpiresAt) {
				delete(h.urlCache, key)
			}
		}
		h.urlCacheMutex.Unlock()
	}
}

// getCachedURL は キャッシュから署名付きURLを取得します
func (h *UploadHandler) getCachedURL(fileKey string) (string, bool) {
	h.urlCacheMutex.RLock()
	defer h.urlCacheMutex.RUnlock()

	cached, exists := h.urlCache[fileKey]
	if !exists {
		return "", false
	}

	// 期限切れチェック
	if time.Now().After(cached.ExpiresAt) {
		return "", false
	}

	return cached.URL, true
}

// setCachedURL は 署名付きURLをキャッシュに保存します
func (h *UploadHandler) setCachedURL(fileKey, url string, ttl time.Duration) {
	h.urlCacheMutex.Lock()
	defer h.urlCacheMutex.Unlock()

	h.urlCache[fileKey] = &CachedURL{
		URL:       url,
		ExpiresAt: time.Now().Add(ttl),
	}
}

// UploadResponse は アップロード成功時のレスポンス
type UploadResponse struct {
	Success  bool   `json:"success"`
	Filename string `json:"filename,omitempty"`
	URL      string `json:"url,omitempty"`
	Message  string `json:"message,omitempty"`
}

// ErrorResponse は エラーレスポンス
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

// StorageUsageResponse は ストレージ使用量レスポンス
type StorageUsageResponse struct {
	UserID     int     `json:"userId"`
	FileCount  int     `json:"fileCount"`
	TotalBytes int64   `json:"totalBytes"`
	TotalMB    float64 `json:"totalMb"`
	QuotaBytes int64   `json:"quotaBytes"`
	QuotaMB    float64 `json:"quotaMb"`
	UsageRate  float64 `json:"usageRate"` // 使用率（0-100%）
}

// PresignedURLResponse は 署名付きURLレスポンス
type PresignedURLResponse struct {
	URL string `json:"url"`
}

// UploadImage は 画像アップロードハンドラー
func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// ユーザーIDを取得（認証ミドルウェアで設定済み）
	userID := middleware.GetUserIDFromContext(r.Context())
	if userID == 0 {
		sendErrorResponse(w, http.StatusUnauthorized, "Unauthorized", "User not authenticated")
		return
	}

	// multipart/form-dataの解析（最大32MB）
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		sendErrorResponse(w, http.StatusBadRequest, "Invalid form data", err.Error())
		return
	}

	// ファイルの取得
	file, header, err := r.FormFile("image")
	if err != nil {
		sendErrorResponse(w, http.StatusBadRequest, "No file uploaded", "Please select an image file to upload")
		return
	}
	defer file.Close()

	// ストレージクォータチェック
	err = h.fileService.CheckStorageQuota(r.Context(), userID, header.Size, h.userStorageQuota)
	if err != nil {
		sendErrorResponse(w, http.StatusRequestEntityTooLarge, "Storage quota exceeded", err.Error())
		return
	}

	// ファイルアップロード
	fileMeta, presignedURL, err := h.fileService.UploadImage(r.Context(), userID, file, header)
	if err != nil {
		sendErrorResponse(w, http.StatusInternalServerError, "Failed to upload image", err.Error())
		return
	}

	// キャッシュに保存（TTL: 23時間）
	h.setCachedURL(fileMeta.FileKey, presignedURL, 23*time.Hour)

	// 成功レスポンス
	response := UploadResponse{
		Success:  true,
		Filename: fileMeta.OriginalName,
		URL:      fmt.Sprintf("/api/uploads/%s", filepath.Base(fileMeta.FileKey)),
		Message:  "Image uploaded successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// UploadFile は ファイルアップロードハンドラー（PDF、Word、Excel等）
func (h *UploadHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	// ユーザーIDを取得（認証ミドルウェアで設定済み）
	userID := middleware.GetUserIDFromContext(r.Context())
	if userID == 0 {
		sendErrorResponse(w, http.StatusUnauthorized, "Unauthorized", "User not authenticated")
		return
	}

	// multipart/form-dataの解析（最大32MB）
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		sendErrorResponse(w, http.StatusBadRequest, "Invalid form data", err.Error())
		return
	}

	// ファイルの取得
	file, header, err := r.FormFile("file")
	if err != nil {
		sendErrorResponse(w, http.StatusBadRequest, "No file uploaded", "Please select a file to upload")
		return
	}
	defer file.Close()

	// ストレージクォータチェック
	err = h.fileService.CheckStorageQuota(r.Context(), userID, header.Size, h.userStorageQuota)
	if err != nil {
		sendErrorResponse(w, http.StatusRequestEntityTooLarge, "Storage quota exceeded", err.Error())
		return
	}

	// ファイルアップロード
	fileMeta, presignedURL, err := h.fileService.UploadFile(r.Context(), userID, file, header)
	if err != nil {
		sendErrorResponse(w, http.StatusInternalServerError, "Failed to upload file", err.Error())
		return
	}

	// キャッシュに保存（TTL: 23時間）
	h.setCachedURL(fileMeta.FileKey, presignedURL, 23*time.Hour)

	// 成功レスポンス
	response := UploadResponse{
		Success:  true,
		Filename: fileMeta.OriginalName,
		URL:      fmt.Sprintf("/api/uploads/%s", filepath.Base(fileMeta.FileKey)),
		Message:  "File uploaded successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetPresignedURL は ファイルの署名付きURLを取得するハンドラー
func (h *UploadHandler) GetPresignedURL(w http.ResponseWriter, r *http.Request) {
	// ユーザーIDを取得
	userID := middleware.GetUserIDFromContext(r.Context())
	if userID == 0 {
		sendErrorResponse(w, http.StatusUnauthorized, "Unauthorized", "User not authenticated")
		return
	}

	// ファイルIDを取得
	vars := mux.Vars(r)
	fileIDStr := vars["id"]
	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		sendErrorResponse(w, http.StatusBadRequest, "Invalid file ID", "File ID must be a number")
		return
	}

	// 署名付きURLを取得
	presignedURL, err := h.fileService.GetPresignedURL(r.Context(), fileID, userID)
	if err != nil {
		sendErrorResponse(w, http.StatusInternalServerError, "Failed to get presigned URL", err.Error())
		return
	}

	// レスポンス
	response := PresignedURLResponse{
		URL: presignedURL,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetStorageUsage は ユーザーのストレージ使用量を取得するハンドラー
func (h *UploadHandler) GetStorageUsage(w http.ResponseWriter, r *http.Request) {
	// ユーザーIDを取得
	userID := middleware.GetUserIDFromContext(r.Context())
	if userID == 0 {
		sendErrorResponse(w, http.StatusUnauthorized, "Unauthorized", "User not authenticated")
		return
	}

	// ストレージ使用量を取得
	usage, err := h.fileService.GetUserStorageUsage(r.Context(), userID)
	if err != nil {
		sendErrorResponse(w, http.StatusInternalServerError, "Failed to get storage usage", err.Error())
		return
	}

	// 使用率を計算
	usageRate := 0.0
	if h.userStorageQuota > 0 {
		usageRate = (float64(usage.TotalBytes) / float64(h.userStorageQuota)) * 100
	}

	// レスポンス
	response := StorageUsageResponse{
		UserID:     usage.UserID,
		FileCount:  usage.FileCount,
		TotalBytes: usage.TotalBytes,
		TotalMB:    usage.TotalMB,
		QuotaBytes: h.userStorageQuota,
		QuotaMB:    float64(h.userStorageQuota) / (1024 * 1024),
		UsageRate:  usageRate,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// ServeFile は MinIOからファイルを配信するハンドラー（互換性のため）
func (h *UploadHandler) ServeFile(w http.ResponseWriter, r *http.Request) {
	// パラメータからファイル名を取得
	vars := mux.Vars(r)
	filename := vars["filename"]

	// ファイルキーを構築（簡易的に最新のファイルキーから検索）
	// 注意: 本番環境では、ファイル名からファイルキーへのマッピングをDBで管理すべき
	// ここでは、キャッシュから検索またはfileKeyとして使用

	// まずキャッシュから検索
	cachedURL, found := h.getCachedURL(filename)
	if found {
		// キャッシュヒット: リダイレクト
		http.Redirect(w, r, cachedURL, http.StatusTemporaryRedirect)
		return
	}

	// キャッシュミス: ファイル名からファイルキーを推測して署名付きURLを取得
	// 注意: この実装は簡易版です。本番環境では適切なファイルキー管理が必要
	// 仮実装として、エラーを返す
	http.Error(w, "File not found in cache. Please re-upload the file.", http.StatusNotFound)
}

// ヘルパー関数

// sendErrorResponse は エラーレスポンスを送信します
func sendErrorResponse(w http.ResponseWriter, statusCode int, error, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := ErrorResponse{
		Error:   error,
		Message: message,
	}

	json.NewEncoder(w).Encode(response)
}
