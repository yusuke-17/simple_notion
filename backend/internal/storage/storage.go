package storage

import (
	"context"
	"io"
	"time"
)

// ObjectStorage は オブジェクトストレージ操作の抽象インターフェースです
// S3互換ストレージ（MinIO、RustFS、AWS S3等）の実装を切り替え可能にします
type ObjectStorage interface {
	// UploadFile は ファイルをストレージにアップロードします
	// fileKey: ストレージ内でのファイルパス（例: "images/1/uuid_filename.jpg"）
	// reader: ファイルの内容を読み取るReader
	// size: ファイルサイズ（バイト）
	// contentType: MIMEタイプ（例: "image/jpeg"）
	UploadFile(ctx context.Context, fileKey string, reader io.Reader, size int64, contentType string) error

	// GetObject は ストレージからファイルを取得します
	// 戻り値のio.ReadCloserは呼び出し側でCloseする必要があります
	GetObject(ctx context.Context, fileKey string) (io.ReadCloser, error)

	// DeleteFile は ストレージからファイルを削除します
	DeleteFile(ctx context.Context, fileKey string) error

	// GetPresignedURL は 署名付きURLを生成します
	// 戻り値はブラウザからアクセス可能なURLである必要があります
	// expires: URLの有効期限
	GetPresignedURL(ctx context.Context, fileKey string, expires time.Duration) (string, error)

	// GetBucketName は バケット名を返します
	// FileMetadata保存時にバケット名を記録するために使用します
	GetBucketName() string

	// EnsureBucket は バケットの存在を確認し、存在しない場合は作成します
	// 初期化時に呼び出されます
	EnsureBucket(ctx context.Context) error
}
