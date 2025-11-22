package models

import (
	"database/sql"
	"time"
)

// FileMetadata は MinIO/S3 に保存されたファイルのメタデータを表します
type FileMetadata struct {
	ID         int  `json:"id"`
	UserID     int  `json:"userId"`
	DocumentID *int `json:"documentId,omitempty"`
	BlockID    *int `json:"blockId,omitempty"`

	FileKey    string `json:"fileKey"`
	BucketName string `json:"bucketName"`

	OriginalName string `json:"originalName"`
	FileSize     int64  `json:"fileSize"`
	MimeType     string `json:"mimeType"`
	FileType     string `json:"fileType"` // "image" or "file"

	Width  *int `json:"width,omitempty"`
	Height *int `json:"height,omitempty"`

	UploadedAt time.Time  `json:"uploadedAt"`
	Status     string     `json:"status"` // "active", "deleted", "orphaned"
	DeletedAt  *time.Time `json:"deletedAt,omitempty"`

	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// FileMetadataRow は データベースから取得した生のデータを表します
type FileMetadataRow struct {
	ID           int
	UserID       int
	DocumentID   sql.NullInt64
	BlockID      sql.NullInt64
	FileKey      string
	BucketName   string
	OriginalName string
	FileSize     int64
	MimeType     string
	FileType     string
	Width        sql.NullInt64
	Height       sql.NullInt64
	UploadedAt   time.Time
	Status       string
	DeletedAt    sql.NullTime
}

// ToFileMetadata は FileMetadataRow を FileMetadata に変換します
func (r *FileMetadataRow) ToFileMetadata() *FileMetadata {
	fm := &FileMetadata{
		ID:           r.ID,
		UserID:       r.UserID,
		FileKey:      r.FileKey,
		BucketName:   r.BucketName,
		OriginalName: r.OriginalName,
		FileSize:     r.FileSize,
		MimeType:     r.MimeType,
		FileType:     r.FileType,
		UploadedAt:   r.UploadedAt,
		Status:       r.Status,
	}

	if r.DocumentID.Valid {
		docID := int(r.DocumentID.Int64)
		fm.DocumentID = &docID
	}

	if r.BlockID.Valid {
		blockID := int(r.BlockID.Int64)
		fm.BlockID = &blockID
	}

	if r.Width.Valid {
		width := int(r.Width.Int64)
		fm.Width = &width
	}

	if r.Height.Valid {
		height := int(r.Height.Int64)
		fm.Height = &height
	}

	if r.DeletedAt.Valid {
		fm.DeletedAt = &r.DeletedAt.Time
	}

	return fm
}

// UserStorageUsage は ユーザーのストレージ使用量を表します
type UserStorageUsage struct {
	UserID     int     `json:"userId"`
	FileCount  int     `json:"fileCount"`
	TotalBytes int64   `json:"totalBytes"`
	TotalMB    float64 `json:"totalMb"`
}
