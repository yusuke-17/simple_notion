package main

import (
	"log"
	"os"

	"simple-notion-backend/internal/app"
)

func main() {
	// ヘルスチェックフラグの処理
	if len(os.Args) > 1 && os.Args[1] == "--health" {
		os.Exit(app.RunHealthCheck())
	}

	// アプリケーションの作成
	application, err := app.New()
	if err != nil {
		log.Fatalf("Failed to create application: %v", err)
	}

	// アプリケーションの起動（グレースフルシャットダウン対応）
	if err := application.Run(); err != nil {
		log.Fatalf("Application runtime error: %v", err)
	}
}
