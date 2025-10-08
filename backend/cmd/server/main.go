package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"

	"simple-notion-backend/internal/app"
	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/handlers"
	"simple-notion-backend/internal/handlers/document"
	"simple-notion-backend/internal/repository"
	"simple-notion-backend/internal/services"
)

func main() {
	// ヘルスチェックフラグの処理
	if len(os.Args) > 1 && os.Args[1] == "--health" {
		if err := healthCheck(); err != nil {
			fmt.Fprintf(os.Stderr, "Health check failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Health check passed")
		os.Exit(0)
	}

	cfg := config.Load()

	// データベース接続
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	// リポジトリ初期化
	userRepo, err := repository.NewUserRepository(db)
	if err != nil {
		log.Fatal("Failed to create user repository:", err)
	}

	// 新しいRepository群を初期化
	documentCoreRepo, err := repository.NewDocumentCoreRepository(db)
	if err != nil {
		log.Fatal("Failed to create document core repository:", err)
	}

	blockRepo, err := repository.NewBlockRepository(db)
	if err != nil {
		log.Fatal("Failed to create block repository:", err)
	}

	treeRepo, err := repository.NewDocumentTreeRepository(db)
	if err != nil {
		log.Fatal("Failed to create document tree repository:", err)
	}

	trashRepo, err := repository.NewDocumentTrashRepository(db)
	if err != nil {
		log.Fatal("Failed to create document trash repository:", err)
	}

	// サービス層を初期化
	documentService := services.NewDocumentService(documentCoreRepo, blockRepo, treeRepo, trashRepo)

	// ハンドラー初期化
	authHandler := handlers.NewAuthHandler(userRepo, []byte(cfg.JWTSecret), cfg)
	docHandler := document.NewDocumentHandler(documentService)

	// ルーター設定
	router := app.NewRouter(authHandler, docHandler, []byte(cfg.JWTSecret))
	router.SetupRoutes()

	handler := router.GetHandler(cfg)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, handler))
}

// healthCheck はデータベース接続を確認するシンプルなヘルスチェックを実行します
func healthCheck() error {
	cfg := config.Load()

	// データベース接続確認
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	return nil
}
