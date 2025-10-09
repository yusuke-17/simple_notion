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

	// 依存関係の初期化
	deps, err := app.NewDependencies(cfg, db)
	if err != nil {
		log.Fatal("Failed to initialize dependencies:", err)
	}
	defer deps.Close()

	// ルーター設定
	router := app.NewRouterFromDependencies(deps)
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
