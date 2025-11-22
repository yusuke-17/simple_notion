package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// S3Client は MinIO/S3 クライアントをラップした構造体です
type S3Client struct {
	client     *minio.Client
	bucketName string
	region     string
}

// NewS3Client は 新しい S3Client インスタンスを作成します
func NewS3Client(endpoint, accessKey, secretKey, bucketName, region string, useSSL bool) (*S3Client, error) {
	// MinIOクライアントの初期化
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	s3Client := &S3Client{
		client:     minioClient,
		bucketName: bucketName,
		region:     region,
	}

	// バケットの存在確認と作成
	if err := s3Client.EnsureBucket(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ensure bucket: %w", err)
	}

	log.Printf("S3 Client initialized successfully (bucket: %s, endpoint: %s)", bucketName, endpoint)

	return s3Client, nil
}

// EnsureBucket は バケットが存在することを確認し、存在しない場合は作成します
func (s *S3Client) EnsureBucket(ctx context.Context) error {
	// バケットの存在確認
	exists, err := s.client.BucketExists(ctx, s.bucketName)
	if err != nil {
		return fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if exists {
		log.Printf("Bucket '%s' already exists", s.bucketName)
		return nil
	}

	// バケットの作成
	err = s.client.MakeBucket(ctx, s.bucketName, minio.MakeBucketOptions{
		Region: s.region,
	})
	if err != nil {
		return fmt.Errorf("failed to create bucket: %w", err)
	}

	log.Printf("Bucket '%s' created successfully", s.bucketName)
	return nil
}

// UploadFile は ファイルを MinIO/S3 にアップロードします
func (s *S3Client) UploadFile(ctx context.Context, fileKey string, reader io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucketName, fileKey, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to upload file: %w", err)
	}

	log.Printf("File uploaded successfully: %s (size: %d bytes)", fileKey, size)
	return nil
}

// GetObject は MinIO/S3 からファイルを取得します
func (s *S3Client) GetObject(ctx context.Context, fileKey string) (*minio.Object, error) {
	object, err := s.client.GetObject(ctx, s.bucketName, fileKey, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}

	return object, nil
}

// DeleteFile は MinIO/S3 からファイルを削除します
func (s *S3Client) DeleteFile(ctx context.Context, fileKey string) error {
	err := s.client.RemoveObject(ctx, s.bucketName, fileKey, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	log.Printf("File deleted successfully: %s", fileKey)
	return nil
}

// GetPresignedURL は 署名付きURLを生成します
// expires: URLの有効期限（例: 24 * time.Hour）
func (s *S3Client) GetPresignedURL(ctx context.Context, fileKey string, expires time.Duration) (string, error) {
	// 署名付きURLの生成
	reqParams := make(url.Values)
	presignedURL, err := s.client.PresignedGetObject(ctx, s.bucketName, fileKey, expires, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}

// StatObject は ファイルの情報を取得します
func (s *S3Client) StatObject(ctx context.Context, fileKey string) (*minio.ObjectInfo, error) {
	info, err := s.client.StatObject(ctx, s.bucketName, fileKey, minio.StatObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to stat object: %w", err)
	}

	return &info, nil
}

// ListObjects は バケット内のファイル一覧を取得します
func (s *S3Client) ListObjects(ctx context.Context, prefix string) <-chan minio.ObjectInfo {
	objectCh := s.client.ListObjects(ctx, s.bucketName, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	})

	return objectCh
}

// GetBucketName は バケット名を返します
func (s *S3Client) GetBucketName() string {
	return s.bucketName
}
