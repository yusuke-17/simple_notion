package upload

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/mux"

	"simple-notion-backend/internal/apierror"
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
	FileID   int    `json:"fileId,omitempty"` // file_metadata.id
	Filename string `json:"filename,omitempty"`
	URL      string `json:"url,omitempty"`
	Message  string `json:"message,omitempty"`
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
		apierror.Write(w, r, apierror.NewUnauthorized(
			"UNAUTHORIZED", "認証が必要です", nil,
		))
		return
	}

	// multipart/form-dataの解析（最大32MB）
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_FORM_DATA", "フォームデータの解析に失敗しました", err,
		))
		return
	}

	// ファイルの取得
	file, header, err := r.FormFile("image")
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"NO_FILE_UPLOADED", "画像ファイルを選択してください", err,
		))
		return
	}
	defer file.Close()

	// ストレージクォータチェック
	err = h.fileService.CheckStorageQuota(r.Context(), userID, header.Size, h.userStorageQuota)
	if err != nil {
		if errors.Is(err, services.ErrStorageQuotaExceeded) {
			apierror.Write(w, r, apierror.NewPayloadTooLarge(
				"QUOTA_EXCEEDED", "ストレージ容量の上限を超えています", err,
			))
			return
		}
		apierror.Write(w, r, err)
		return
	}

	// ファイルアップロード
	fileMeta, presignedURL, err := h.fileService.UploadImage(r.Context(), userID, file, header)
	if err != nil {
		apierror.Write(w, r, apierror.NewInternal(
			fmt.Errorf("failed to upload image: %w", err),
		))
		return
	}

	// キャッシュに保存（TTL: 23時間）
	h.setCachedURL(filepath.Base(fileMeta.FileKey), presignedURL, 23*time.Hour)

	// 成功レスポンス（相対パスを返す）
	response := UploadResponse{
		Success:  true,
		FileID:   fileMeta.ID,
		Filename: fileMeta.OriginalName,
		URL:      fmt.Sprintf("/api/uploads/%s", filepath.Base(fileMeta.FileKey)),
		Message:  "Image uploaded successfully",
	}

	apierror.WriteJSON(w, http.StatusOK, response)
}

// GetPresignedURL は ファイルの署名付きURLを取得するハンドラー
func (h *UploadHandler) GetPresignedURL(w http.ResponseWriter, r *http.Request) {
	// ユーザーIDを取得
	userID := middleware.GetUserIDFromContext(r.Context())
	if userID == 0 {
		apierror.Write(w, r, apierror.NewUnauthorized(
			"UNAUTHORIZED", "認証が必要です", nil,
		))
		return
	}

	// ファイルIDを取得
	vars := mux.Vars(r)
	fileIDStr := vars["id"]
	fileID, err := strconv.Atoi(fileIDStr)
	if err != nil {
		apierror.Write(w, r, apierror.NewValidationError(
			"INVALID_FILE_ID", "ファイルIDは数値である必要があります", err,
		))
		return
	}

	// 署名付きURLを取得（repository からの ErrNotFound は自動で 404 にマップされる）
	presignedURL, err := h.fileService.GetPresignedURL(r.Context(), fileID, userID)
	if err != nil {
		apierror.Write(w, r, err)
		return
	}

	apierror.WriteJSON(w, http.StatusOK, PresignedURLResponse{URL: presignedURL})
}

// GetStorageUsage は ユーザーのストレージ使用量を取得するハンドラー
func (h *UploadHandler) GetStorageUsage(w http.ResponseWriter, r *http.Request) {
	// ユーザーIDを取得
	userID := middleware.GetUserIDFromContext(r.Context())
	if userID == 0 {
		apierror.Write(w, r, apierror.NewUnauthorized(
			"UNAUTHORIZED", "認証が必要です", nil,
		))
		return
	}

	// ストレージ使用量を取得
	usage, err := h.fileService.GetUserStorageUsage(r.Context(), userID)
	if err != nil {
		apierror.Write(w, r, apierror.NewInternal(
			fmt.Errorf("failed to get storage usage: %w", err),
		))
		return
	}

	// 使用率を計算
	usageRate := 0.0
	if h.userStorageQuota > 0 {
		usageRate = (float64(usage.TotalBytes) / float64(h.userStorageQuota)) * 100
	}

	apierror.WriteJSON(w, http.StatusOK, StorageUsageResponse{
		UserID:     usage.UserID,
		FileCount:  usage.FileCount,
		TotalBytes: usage.TotalBytes,
		TotalMB:    usage.TotalMB,
		QuotaBytes: h.userStorageQuota,
		QuotaMB:    float64(h.userStorageQuota) / (1024 * 1024),
		UsageRate:  usageRate,
	})
}

// ServeFile は ストレージからファイルを配信するハンドラー（プロキシ方式）
func (h *UploadHandler) ServeFile(w http.ResponseWriter, r *http.Request) {
	// パラメータからファイル名を取得
	vars := mux.Vars(r)
	filename := vars["filename"]

	// データベースから検索してファイルメタデータを取得
	// repository からの ErrNotFound は apierror.Write 内で自動的に 404 にマップされる
	fileMeta, err := h.fileService.GetFileMetadataByFilename(r.Context(), filename)
	if err != nil {
		apierror.Write(w, r, err)
		return
	}

	// ストレージからファイルを取得
	object, err := h.fileService.GetFileObject(r.Context(), fileMeta.FileKey)
	if err != nil {
		apierror.Write(w, r, apierror.NewInternal(
			fmt.Errorf("failed to retrieve file: %w", err),
		))
		return
	}
	defer object.Close()

	// Content-Typeを設定
	w.Header().Set("Content-Type", fileMeta.MimeType)
	w.Header().Set("Cache-Control", "public, max-age=86400") // 24時間キャッシュ

	// ファイルをストリーミング
	if _, err := io.Copy(w, object); err != nil {
		// ヘッダー送信済みのためレスポンスは書き換えられない。ログのみ残す
		return
	}
}
