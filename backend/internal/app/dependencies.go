package app

import (
	"database/sql"
	"fmt"

	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/handlers"
	"simple-notion-backend/internal/handlers/document"
	"simple-notion-backend/internal/handlers/upload"
	"simple-notion-backend/internal/repository"
	"simple-notion-backend/internal/services"
	"simple-notion-backend/internal/storage"
)

// Dependencies は、アプリケーションの全ての依存関係を管理する構造体です
type Dependencies struct {
	Config   *config.Config
	Database *sql.DB

	// Repositories
	UserRepository         *repository.UserRepository
	DocumentCoreRepository *repository.DocumentCoreRepository
	BlockRepository        *repository.BlockRepository
	TreeRepository         *repository.DocumentTreeRepository
	TrashRepository        *repository.DocumentTrashRepository
	FileRepository         *repository.FileRepository

	// Services
	DocumentService *services.DocumentService
	FileService     *services.FileService

	// Storage
	S3Client *storage.S3Client

	// Handlers
	AuthHandler     *handlers.AuthHandler
	DocumentHandler *document.DocumentHandler
	UploadHandler   *upload.UploadHandler
}

// NewDependencies は、データベース接続から全ての依存関係を初期化します
func NewDependencies(cfg *config.Config, db *sql.DB) (*Dependencies, error) {
	deps := &Dependencies{
		Config:   cfg,
		Database: db,
	}

	// Repository層の初期化
	if err := deps.initRepositories(); err != nil {
		return nil, fmt.Errorf("failed to initialize repositories: %w", err)
	}

	// Service層の初期化
	if err := deps.initServices(); err != nil {
		return nil, fmt.Errorf("failed to initialize services: %w", err)
	}

	// Handler層の初期化
	if err := deps.initHandlers(); err != nil {
		return nil, fmt.Errorf("failed to initialize handlers: %w", err)
	}

	return deps, nil
}

// initRepositories は、全てのRepositoryを初期化します
func (d *Dependencies) initRepositories() error {
	var err error

	// User Repository
	d.UserRepository, err = repository.NewUserRepository(d.Database)
	if err != nil {
		return fmt.Errorf("failed to create user repository: %w", err)
	}

	// Document Core Repository
	d.DocumentCoreRepository, err = repository.NewDocumentCoreRepository(d.Database)
	if err != nil {
		return fmt.Errorf("failed to create document core repository: %w", err)
	}

	// Block Repository
	d.BlockRepository, err = repository.NewBlockRepository(d.Database)
	if err != nil {
		return fmt.Errorf("failed to create block repository: %w", err)
	}

	// Document Tree Repository
	d.TreeRepository, err = repository.NewDocumentTreeRepository(d.Database)
	if err != nil {
		return fmt.Errorf("failed to create document tree repository: %w", err)
	}

	// Document Trash Repository
	d.TrashRepository, err = repository.NewDocumentTrashRepository(d.Database)
	if err != nil {
		return fmt.Errorf("failed to create document trash repository: %w", err)
	}

	// File Repository
	d.FileRepository = repository.NewFileRepository(d.Database)

	return nil
}

// initServices は、全てのServiceを初期化します
func (d *Dependencies) initServices() error {
	// S3Clientの初期化
	var err error
	d.S3Client, err = storage.NewS3Client(
		d.Config.S3Endpoint,
		d.Config.S3AccessKey,
		d.Config.S3SecretKey,
		d.Config.S3BucketName,
		d.Config.S3Region,
		d.Config.S3UseSSL,
	)
	if err != nil {
		return fmt.Errorf("failed to create s3 client: %w", err)
	}

	// Document Service
	d.DocumentService = services.NewDocumentService(
		d.DocumentCoreRepository,
		d.BlockRepository,
		d.TreeRepository,
		d.TrashRepository,
	)

	// File Service
	d.FileService = services.NewFileService(
		d.FileRepository,
		d.S3Client,
		d.Config.MaxFileSize,
		d.Config.S3PresignExpiry,
	)

	return nil
}

// initHandlers は、全てのHandlerを初期化します
func (d *Dependencies) initHandlers() error {
	// Auth Handler
	d.AuthHandler = handlers.NewAuthHandler(
		d.UserRepository,
		[]byte(d.Config.JWTSecret),
		d.Config,
	)

	// Document Handler
	d.DocumentHandler = document.NewDocumentHandler(d.DocumentService)

	// Upload Handler
	d.UploadHandler = upload.NewUploadHandler(d.FileService, d.Config.UserStorageQuota)

	return nil
}

// GetJWTSecret は、JWT秘密鍵をバイトスライスとして返します
func (d *Dependencies) GetJWTSecret() []byte {
	return []byte(d.Config.JWTSecret)
}

// Close は、データベース接続を安全に閉じます
func (d *Dependencies) Close() error {
	if d.Database != nil {
		return d.Database.Close()
	}
	return nil
}
