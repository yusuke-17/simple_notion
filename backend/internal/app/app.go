package app

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"

	"simple-notion-backend/internal/config"
)

// Application は、アプリケーション全体を管理する構造体です
type Application struct {
	config       *config.Config
	database     *sql.DB
	dependencies *Dependencies
	server       *Server
	logger       *log.Logger
}

// New は、新しいApplicationインスタンスを作成します
func New() (*Application, error) {
	app := &Application{
		logger: log.New(os.Stdout, "[APP] ", log.LstdFlags|log.Lshortfile),
	}

	// 設定の読み込み
	if err := app.loadConfig(); err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	// データベース接続
	if err := app.connectDatabase(); err != nil {
		return nil, fmt.Errorf("failed to connect database: %w", err)
	}

	// 依存関係の初期化
	if err := app.initializeDependencies(); err != nil {
		return nil, fmt.Errorf("failed to initialize dependencies: %w", err)
	}

	// サーバーの初期化
	if err := app.initializeServer(); err != nil {
		return nil, fmt.Errorf("failed to initialize server: %w", err)
	}

	return app, nil
}

// loadConfig は、設定を読み込みます
func (a *Application) loadConfig() error {
	a.config = config.Load()
	a.logger.Printf("Configuration loaded for environment: %s", a.config.Environment)
	return nil
}

// connectDatabase は、データベースに接続します
func (a *Application) connectDatabase() error {
	var err error
	a.database, err = sql.Open("postgres", a.config.DatabaseURL)
	if err != nil {
		return fmt.Errorf("failed to open database connection: %w", err)
	}

	// 接続の確認
	if err := a.database.Ping(); err != nil {
		a.database.Close()
		return fmt.Errorf("failed to ping database: %w", err)
	}

	a.logger.Println("Database connection established")
	return nil
}

// initializeDependencies は、依存関係を初期化します
func (a *Application) initializeDependencies() error {
	var err error
	a.dependencies, err = NewDependencies(a.config, a.database)
	if err != nil {
		return fmt.Errorf("failed to create dependencies: %w", err)
	}

	a.logger.Println("Dependencies initialized")
	return nil
}

// initializeServer は、HTTPサーバーを初期化します
func (a *Application) initializeServer() error {
	var err error
	a.server, err = NewServer(a.config, a.dependencies)
	if err != nil {
		return fmt.Errorf("failed to create server: %w", err)
	}

	a.logger.Printf("HTTP server initialized on port %s", a.config.Port)
	return nil
}

// Run は、アプリケーションを起動し、グレースフルシャットダウンを待機します
func (a *Application) Run() error {
	// シグナルチャネルの設定
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// サーバーをバックグラウンドで起動
	serverErr := make(chan error, 1)
	go func() {
		a.logger.Printf("Starting server on port %s", a.config.Port)
		if err := a.server.Start(); err != nil && err != http.ErrServerClosed {
			serverErr <- fmt.Errorf("server startup failed: %w", err)
		}
	}()

	// シグナルまたはエラーを待機
	select {
	case err := <-serverErr:
		a.logger.Printf("Server error: %v", err)
		return err
	case sig := <-quit:
		a.logger.Printf("Received signal: %v. Starting graceful shutdown...", sig)
		return a.Shutdown()
	}
}

// Shutdown は、アプリケーションをグレースフルにシャットダウンします
func (a *Application) Shutdown() error {
	a.logger.Println("Starting graceful shutdown")

	// シャットダウンのタイムアウト設定（30秒）
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// HTTPサーバーの停止
	if a.server != nil {
		a.logger.Println("Shutting down HTTP server...")
		if err := a.server.Shutdown(ctx); err != nil {
			a.logger.Printf("HTTP server shutdown error: %v", err)
			return fmt.Errorf("failed to shutdown HTTP server: %w", err)
		}
		a.logger.Println("HTTP server stopped")
	}

	// 依存関係のクリーンアップ
	if a.dependencies != nil {
		a.logger.Println("Cleaning up dependencies...")
		if err := a.dependencies.Close(); err != nil {
			a.logger.Printf("Dependencies cleanup error: %v", err)
		}
	}

	// データベース接続の閉鎖
	if a.database != nil {
		a.logger.Println("Closing database connection...")
		if err := a.database.Close(); err != nil {
			a.logger.Printf("Database close error: %v", err)
		}
	}

	a.logger.Println("Graceful shutdown completed")
	return nil
}

// HealthCheck は、アプリケーションのヘルスチェックを実行します
func (a *Application) HealthCheck() error {
	// データベース接続の確認
	if err := a.database.Ping(); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	return nil
}

// RunHealthCheck は、ヘルスチェックのみを実行する静的メソッドです
func RunHealthCheck() int {
	cfg := config.Load()

	// データベース接続確認
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Health check failed - database connection: %v\n", err)
		return 1
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		fmt.Fprintf(os.Stderr, "Health check failed - database ping: %v\n", err)
		return 1
	}

	fmt.Println("Health check passed")
	return 0
}
