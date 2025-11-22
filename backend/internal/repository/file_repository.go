package repository

import (
	"context"
	"database/sql"
	"fmt"

	"simple-notion-backend/internal/models"
)

// FileRepository は file_metadata テーブルへのデータアクセスを提供します
type FileRepository struct {
	db *sql.DB
}

// NewFileRepository は 新しい FileRepository インスタンスを作成します
func NewFileRepository(db *sql.DB) *FileRepository {
	return &FileRepository{db: db}
}

// Create は 新しいファイルメタデータをデータベースに保存します
func (r *FileRepository) Create(ctx context.Context, file *models.FileMetadata) error {
	query := `
		INSERT INTO file_metadata 
		(user_id, document_id, block_id, file_key, bucket_name, original_name, 
		 file_size, mime_type, file_type, width, height, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, uploaded_at
	`

	err := r.db.QueryRowContext(
		ctx, query,
		file.UserID,
		file.DocumentID,
		file.BlockID,
		file.FileKey,
		file.BucketName,
		file.OriginalName,
		file.FileSize,
		file.MimeType,
		file.FileType,
		file.Width,
		file.Height,
		file.Status,
	).Scan(&file.ID, &file.UploadedAt)

	if err != nil {
		return fmt.Errorf("failed to create file metadata: %w", err)
	}

	return nil
}

// GetByID は IDでファイルメタデータを取得します
func (r *FileRepository) GetByID(ctx context.Context, id int) (*models.FileMetadata, error) {
	query := `
		SELECT id, user_id, document_id, block_id, file_key, bucket_name,
		       original_name, file_size, mime_type, file_type, width, height,
		       uploaded_at, status, deleted_at
		FROM file_metadata
		WHERE id = $1
	`

	var row models.FileMetadataRow
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&row.ID,
		&row.UserID,
		&row.DocumentID,
		&row.BlockID,
		&row.FileKey,
		&row.BucketName,
		&row.OriginalName,
		&row.FileSize,
		&row.MimeType,
		&row.FileType,
		&row.Width,
		&row.Height,
		&row.UploadedAt,
		&row.Status,
		&row.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("file metadata not found: id=%d", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get file metadata: %w", err)
	}

	return row.ToFileMetadata(), nil
}

// GetByFileKey は ファイルキーでファイルメタデータを取得します
func (r *FileRepository) GetByFileKey(ctx context.Context, fileKey string) (*models.FileMetadata, error) {
	query := `
		SELECT id, user_id, document_id, block_id, file_key, bucket_name,
		       original_name, file_size, mime_type, file_type, width, height,
		       uploaded_at, status, deleted_at
		FROM file_metadata
		WHERE file_key = $1
	`

	var row models.FileMetadataRow
	err := r.db.QueryRowContext(ctx, query, fileKey).Scan(
		&row.ID,
		&row.UserID,
		&row.DocumentID,
		&row.BlockID,
		&row.FileKey,
		&row.BucketName,
		&row.OriginalName,
		&row.FileSize,
		&row.MimeType,
		&row.FileType,
		&row.Width,
		&row.Height,
		&row.UploadedAt,
		&row.Status,
		&row.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("file metadata not found: fileKey=%s", fileKey)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get file metadata: %w", err)
	}

	return row.ToFileMetadata(), nil
}

// GetByBlockID は ブロックIDでファイルメタデータを取得します
func (r *FileRepository) GetByBlockID(ctx context.Context, blockID int) (*models.FileMetadata, error) {
	query := `
		SELECT id, user_id, document_id, block_id, file_key, bucket_name,
		       original_name, file_size, mime_type, file_type, width, height,
		       uploaded_at, status, deleted_at
		FROM file_metadata
		WHERE block_id = $1 AND status = 'active'
	`

	var row models.FileMetadataRow
	err := r.db.QueryRowContext(ctx, query, blockID).Scan(
		&row.ID,
		&row.UserID,
		&row.DocumentID,
		&row.BlockID,
		&row.FileKey,
		&row.BucketName,
		&row.OriginalName,
		&row.FileSize,
		&row.MimeType,
		&row.FileType,
		&row.Width,
		&row.Height,
		&row.UploadedAt,
		&row.Status,
		&row.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("file metadata not found: blockID=%d", blockID)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get file metadata: %w", err)
	}

	return row.ToFileMetadata(), nil
}

// ListByUserID は ユーザーIDでファイルメタデータのリストを取得します
func (r *FileRepository) ListByUserID(ctx context.Context, userID int) ([]*models.FileMetadata, error) {
	query := `
		SELECT id, user_id, document_id, block_id, file_key, bucket_name,
		       original_name, file_size, mime_type, file_type, width, height,
		       uploaded_at, status, deleted_at
		FROM file_metadata
		WHERE user_id = $1 AND status = 'active'
		ORDER BY uploaded_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list file metadata: %w", err)
	}
	defer rows.Close()

	var files []*models.FileMetadata
	for rows.Next() {
		var row models.FileMetadataRow
		err := rows.Scan(
			&row.ID,
			&row.UserID,
			&row.DocumentID,
			&row.BlockID,
			&row.FileKey,
			&row.BucketName,
			&row.OriginalName,
			&row.FileSize,
			&row.MimeType,
			&row.FileType,
			&row.Width,
			&row.Height,
			&row.UploadedAt,
			&row.Status,
			&row.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file metadata: %w", err)
		}

		files = append(files, row.ToFileMetadata())
	}

	return files, nil
}

// UpdateStatus は ファイルのステータスを更新します
func (r *FileRepository) UpdateStatus(ctx context.Context, id int, status string) error {
	query := `
		UPDATE file_metadata
		SET status = $1
		WHERE id = $2
	`

	result, err := r.db.ExecContext(ctx, query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update file status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("file metadata not found: id=%d", id)
	}

	return nil
}

// MarkAsDeleted は ファイルを削除済みとしてマークします（ソフトデリート）
func (r *FileRepository) MarkAsDeleted(ctx context.Context, id int) error {
	query := `
		UPDATE file_metadata
		SET status = 'deleted', deleted_at = NOW()
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to mark file as deleted: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("file metadata not found: id=%d", id)
	}

	return nil
}

// GetOrphanedFiles は 孤立したファイルのリストを取得します
func (r *FileRepository) GetOrphanedFiles(ctx context.Context) ([]*models.FileMetadata, error) {
	query := `
		SELECT id, user_id, document_id, block_id, file_key, bucket_name,
		       original_name, file_size, mime_type, file_type, width, height,
		       uploaded_at, status, deleted_at
		FROM orphaned_files
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get orphaned files: %w", err)
	}
	defer rows.Close()

	var files []*models.FileMetadata
	for rows.Next() {
		var row models.FileMetadataRow
		err := rows.Scan(
			&row.ID,
			&row.UserID,
			&row.DocumentID,
			&row.BlockID,
			&row.FileKey,
			&row.BucketName,
			&row.OriginalName,
			&row.FileSize,
			&row.MimeType,
			&row.FileType,
			&row.Width,
			&row.Height,
			&row.UploadedAt,
			&row.Status,
			&row.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan orphaned file: %w", err)
		}

		files = append(files, row.ToFileMetadata())
	}

	return files, nil
}

// GetUserStorageUsage は ユーザーのストレージ使用量を取得します
func (r *FileRepository) GetUserStorageUsage(ctx context.Context, userID int) (*models.UserStorageUsage, error) {
	query := `
		SELECT user_id, file_count, total_bytes, total_mb
		FROM user_storage_usage
		WHERE user_id = $1
	`

	var usage models.UserStorageUsage
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&usage.UserID,
		&usage.FileCount,
		&usage.TotalBytes,
		&usage.TotalMB,
	)

	if err == sql.ErrNoRows {
		// ユーザーがファイルをアップロードしていない場合はゼロを返す
		return &models.UserStorageUsage{
			UserID:     userID,
			FileCount:  0,
			TotalBytes: 0,
			TotalMB:    0,
		}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user storage usage: %w", err)
	}

	return &usage, nil
}

// UpdateBlockID は ファイルメタデータのblock_idを更新します
func (r *FileRepository) UpdateBlockID(ctx context.Context, fileID int, blockID int) error {
	query := `
		UPDATE file_metadata
		SET block_id = $1
		WHERE id = $2
	`

	result, err := r.db.ExecContext(ctx, query, blockID, fileID)
	if err != nil {
		return fmt.Errorf("failed to update block_id: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("file metadata not found: id=%d", fileID)
	}

	return nil
}
