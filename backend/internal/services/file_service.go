package services

import (
	"context"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"mime/multipart"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"

	"simple-notion-backend/internal/models"
	"simple-notion-backend/internal/repository"
	"simple-notion-backend/internal/storage"
)

// FileService は ファイル管理のビジネスロジックを提供します
type FileService struct {
	fileRepo      *repository.FileRepository
	s3Client      *storage.S3Client
	maxFileSize   int64
	presignExpiry int // 署名付きURLの有効期限（秒）
}

// NewFileService は 新しい FileService インスタンスを作成します
func NewFileService(
	fileRepo *repository.FileRepository,
	s3Client *storage.S3Client,
	maxFileSize int64,
	presignExpiry int,
) *FileService {
	return &FileService{
		fileRepo:      fileRepo,
		s3Client:      s3Client,
		maxFileSize:   maxFileSize,
		presignExpiry: presignExpiry,
	}
}

// UploadImage は 画像ファイルをアップロードします
func (s *FileService) UploadImage(
	ctx context.Context,
	userID int,
	file multipart.File,
	header *multipart.FileHeader,
) (*models.FileMetadata, string, error) {
	// 1. ファイルサイズのバリデーション
	if header.Size > s.maxFileSize {
		return nil, "", fmt.Errorf("file size exceeds maximum allowed size of %d bytes", s.maxFileSize)
	}

	// 2. MIMEタイプのバリデーション
	contentType := header.Header.Get("Content-Type")
	if !isValidImageType(contentType) {
		return nil, "", fmt.Errorf("invalid image type: %s", contentType)
	}

	// 3. 画像の寸法を取得
	dimensions, err := getImageDimensions(file)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get image dimensions: %w", err)
	}

	// ファイルポインタを先頭に戻す
	if _, err := file.Seek(0, 0); err != nil {
		return nil, "", fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// 4. 一意なファイルキーを生成
	fileKey := generateFileKey(userID, header.Filename, "images")

	// 5. MinIOにアップロード
	err = s.s3Client.UploadFile(ctx, fileKey, file, header.Size, contentType)
	if err != nil {
		return nil, "", fmt.Errorf("failed to upload file to S3: %w", err)
	}

	// 6. メタデータをデータベースに保存
	fileMeta := &models.FileMetadata{
		UserID:       userID,
		FileKey:      fileKey,
		BucketName:   s.s3Client.GetBucketName(),
		OriginalName: header.Filename,
		FileSize:     header.Size,
		MimeType:     contentType,
		FileType:     "image",
		Width:        &dimensions.Width,
		Height:       &dimensions.Height,
		Status:       "active",
	}

	err = s.fileRepo.Create(ctx, fileMeta)
	if err != nil {
		// アップロード済みのファイルを削除
		_ = s.s3Client.DeleteFile(ctx, fileKey)
		return nil, "", fmt.Errorf("failed to save file metadata: %w", err)
	}

	// 7. 署名付きURLを生成
	presignedURL, err := s.s3Client.GetPresignedURL(ctx, fileKey, time.Duration(s.presignExpiry)*time.Second)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return fileMeta, presignedURL, nil
}

// UploadFile は 一般ファイルをアップロードします
func (s *FileService) UploadFile(
	ctx context.Context,
	userID int,
	file multipart.File,
	header *multipart.FileHeader,
) (*models.FileMetadata, string, error) {
	// 1. ファイルサイズのバリデーション
	if header.Size > s.maxFileSize {
		return nil, "", fmt.Errorf("file size exceeds maximum allowed size of %d bytes", s.maxFileSize)
	}

	// 2. MIMEタイプのバリデーション
	contentType := header.Header.Get("Content-Type")
	if !isValidFileType(contentType) {
		return nil, "", fmt.Errorf("invalid file type: %s", contentType)
	}

	// 3. 一意なファイルキーを生成
	fileKey := generateFileKey(userID, header.Filename, "files")

	// 4. MinIOにアップロード
	err := s.s3Client.UploadFile(ctx, fileKey, file, header.Size, contentType)
	if err != nil {
		return nil, "", fmt.Errorf("failed to upload file to S3: %w", err)
	}

	// 5. メタデータをデータベースに保存
	fileMeta := &models.FileMetadata{
		UserID:       userID,
		FileKey:      fileKey,
		BucketName:   s.s3Client.GetBucketName(),
		OriginalName: header.Filename,
		FileSize:     header.Size,
		MimeType:     contentType,
		FileType:     "file",
		Status:       "active",
	}

	err = s.fileRepo.Create(ctx, fileMeta)
	if err != nil {
		// アップロード済みのファイルを削除
		_ = s.s3Client.DeleteFile(ctx, fileKey)
		return nil, "", fmt.Errorf("failed to save file metadata: %w", err)
	}

	// 6. 署名付きURLを生成
	presignedURL, err := s.s3Client.GetPresignedURL(ctx, fileKey, time.Duration(s.presignExpiry)*time.Second)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return fileMeta, presignedURL, nil
}

// GetPresignedURL は ファイルの署名付きURLを取得します
func (s *FileService) GetPresignedURL(ctx context.Context, fileID int, userID int) (string, error) {
	// 1. ファイルメタデータを取得
	fileMeta, err := s.fileRepo.GetByID(ctx, fileID)
	if err != nil {
		return "", fmt.Errorf("failed to get file metadata: %w", err)
	}

	// 2. アクセス権限チェック
	if fileMeta.UserID != userID {
		return "", fmt.Errorf("access denied: user %d does not own file %d", userID, fileID)
	}

	// 3. ステータスチェック
	if fileMeta.Status != "active" {
		return "", fmt.Errorf("file is not available: status=%s", fileMeta.Status)
	}

	// 4. 署名付きURLを生成
	presignedURL, err := s.s3Client.GetPresignedURL(ctx, fileMeta.FileKey, time.Duration(s.presignExpiry)*time.Second)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL, nil
}

// GetPresignedURLByFileKey は ファイルキーから署名付きURLを取得します
func (s *FileService) GetPresignedURLByFileKey(ctx context.Context, fileKey string, userID int) (string, error) {
	// 1. ファイルメタデータを取得
	fileMeta, err := s.fileRepo.GetByFileKey(ctx, fileKey)
	if err != nil {
		return "", fmt.Errorf("failed to get file metadata: %w", err)
	}

	// 2. アクセス権限チェック
	if fileMeta.UserID != userID {
		return "", fmt.Errorf("access denied: user %d does not own file with key %s", userID, fileKey)
	}

	// 3. ステータスチェック
	if fileMeta.Status != "active" {
		return "", fmt.Errorf("file is not available: status=%s", fileMeta.Status)
	}

	// 4. 署名付きURLを生成
	presignedURL, err := s.s3Client.GetPresignedURL(ctx, fileMeta.FileKey, time.Duration(s.presignExpiry)*time.Second)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL, nil
}

// DeleteFile は ファイルを削除します（ソフトデリート）
func (s *FileService) DeleteFile(ctx context.Context, fileID int, userID int) error {
	// 1. ファイルメタデータを取得
	fileMeta, err := s.fileRepo.GetByID(ctx, fileID)
	if err != nil {
		return fmt.Errorf("failed to get file metadata: %w", err)
	}

	// 2. アクセス権限チェック
	if fileMeta.UserID != userID {
		return fmt.Errorf("access denied: user %d does not own file %d", userID, fileID)
	}

	// 3. データベースで削除済みマーク
	err = s.fileRepo.MarkAsDeleted(ctx, fileID)
	if err != nil {
		return fmt.Errorf("failed to mark file as deleted: %w", err)
	}

	// 4. MinIOから削除（非同期で行う方が良いが、ここでは同期的に実行）
	// 本番環境では、後でクリーンアップジョブで削除する方が安全
	err = s.s3Client.DeleteFile(ctx, fileMeta.FileKey)
	if err != nil {
		// ログに記録するが、エラーは返さない（メタデータの削除は成功しているため）
		// log.Printf("Warning: failed to delete file from S3: %v", err)
	}

	return nil
}

// CleanupOrphanedFiles は 孤立したファイルをクリーンアップします
func (s *FileService) CleanupOrphanedFiles(ctx context.Context) error {
	// 1. 孤立ファイルを取得
	orphanedFiles, err := s.fileRepo.GetOrphanedFiles(ctx)
	if err != nil {
		return fmt.Errorf("failed to get orphaned files: %w", err)
	}

	// 2. 各ファイルを処理
	for _, file := range orphanedFiles {
		// MinIOから削除
		err := s.s3Client.DeleteFile(ctx, file.FileKey)
		if err != nil {
			// ログに記録して続行
			// log.Printf("Warning: failed to delete orphaned file from S3: %v", err)
			continue
		}

		// データベースで削除済みマーク
		err = s.fileRepo.MarkAsDeleted(ctx, file.ID)
		if err != nil {
			// log.Printf("Warning: failed to mark orphaned file as deleted: %v", err)
		}
	}

	return nil
}

// GetUserStorageUsage は ユーザーのストレージ使用量を取得します
func (s *FileService) GetUserStorageUsage(ctx context.Context, userID int) (*models.UserStorageUsage, error) {
	usage, err := s.fileRepo.GetUserStorageUsage(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user storage usage: %w", err)
	}

	return usage, nil
}

// ListUserFiles は ユーザーのファイル一覧を取得します
func (s *FileService) ListUserFiles(ctx context.Context, userID int) ([]*models.FileMetadata, error) {
	files, err := s.fileRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list user files: %w", err)
	}

	return files, nil
}

// UpdateBlockID は ファイルメタデータのblock_idを更新します
func (s *FileService) UpdateBlockID(ctx context.Context, fileID int, blockID int, userID int) error {
	// 1. ファイルメタデータを取得
	fileMeta, err := s.fileRepo.GetByID(ctx, fileID)
	if err != nil {
		return fmt.Errorf("failed to get file metadata: %w", err)
	}

	// 2. アクセス権限チェック
	if fileMeta.UserID != userID {
		return fmt.Errorf("access denied: user %d does not own file %d", userID, fileID)
	}

	// 3. block_idを更新
	err = s.fileRepo.UpdateBlockID(ctx, fileID, blockID)
	if err != nil {
		return fmt.Errorf("failed to update block_id: %w", err)
	}

	return nil
}

// ヘルパー関数

// ImageDimensions は 画像の寸法を表します
type ImageDimensions struct {
	Width  int
	Height int
}

// getImageDimensions は 画像ファイルから寸法を取得します
func getImageDimensions(file multipart.File) (*ImageDimensions, error) {
	img, _, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	return &ImageDimensions{
		Width:  bounds.Dx(),
		Height: bounds.Dy(),
	}, nil
}

// generateFileKey は 一意なファイルキーを生成します
func generateFileKey(userID int, filename string, prefix string) string {
	// ファイル拡張子を取得
	ext := filepath.Ext(filename)

	// ファイル名をサニタイズ
	baseName := strings.TrimSuffix(filename, ext)
	safeName := sanitizeFilename(baseName)

	// 長すぎる場合は切り詰める
	if len(safeName) > 50 {
		safeName = safeName[:50]
	}

	// UUIDを生成
	uniqueID := uuid.New().String()

	// ファイルキーを生成: prefix/userID/uuid_filename.ext
	return fmt.Sprintf("%s/%d/%s_%s%s", prefix, userID, uniqueID, safeName, ext)
}

// sanitizeFilename は ファイル名をサニタイズします
func sanitizeFilename(filename string) string {
	// 英数字、ハイフン、アンダースコアのみ許可
	reg := regexp.MustCompile(`[^a-zA-Z0-9\-_]`)
	return reg.ReplaceAllString(filename, "_")
}

// isValidImageType は 画像のMIMEタイプをバリデーションします
func isValidImageType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
		"image/gif":  true,
	}
	return validTypes[strings.ToLower(contentType)]
}

// isValidFileType は ファイルのMIMEタイプをバリデーションします
func isValidFileType(contentType string) bool {
	validTypes := map[string]bool{
		// PDF
		"application/pdf": true,
		// Microsoft Office (新形式)
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document":   true, // .docx
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":         true, // .xlsx
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": true, // .pptx
		// Microsoft Office (旧形式)
		"application/msword":            true, // .doc
		"application/vnd.ms-excel":      true, // .xls
		"application/vnd.ms-powerpoint": true, // .ppt
		// テキストファイル
		"text/plain": true, // .txt
		// 圧縮ファイル
		"application/zip":              true, // .zip
		"application/x-rar-compressed": true, // .rar
		"application/x-7z-compressed":  true, // .7z
		"application/x-tar":            true, // .tar
		"application/gzip":             true, // .gz
		// その他
		"application/json": true, // .json
		"text/csv":         true, // .csv
		"application/xml":  true, // .xml
		"text/xml":         true, // .xml
		"application/rtf":  true, // .rtf
	}
	return validTypes[strings.ToLower(contentType)]
}
