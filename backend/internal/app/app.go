package app

import (
	"context"
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"

	"simple-notion-backend/internal/config"
)

// Application は、アプリケーション全体を管理する構造体です
type Application struct {
	config       *config.Config
	database     *sql.DB
	dependencies *Dependencies
	server       *Server
	logger       *Logger
	metrics      *Metrics
	lifecycle    *LifecycleManager
}

// New は、新しいApplicationインスタンスを作成します
func New() (*Application, error) {
	app := &Application{}

	// 設定の読み込み
	if err := app.loadConfig(); err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	// メトリクスの初期化
	if err := app.initializeMetrics(); err != nil {
		return nil, fmt.Errorf("failed to initialize metrics: %w", err)
	}

	// ログの初期化
	if err := app.initializeLogger(); err != nil {
		return nil, fmt.Errorf("failed to initialize logger: %w", err)
	}

	// ライフサイクル管理の初期化
	if err := app.initializeLifecycle(); err != nil {
		return nil, fmt.Errorf("failed to initialize lifecycle: %w", err)
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
	return nil
}

// initializeMetrics は、メトリクスを初期化します
func (a *Application) initializeMetrics() error {
	a.metrics = NewMetrics(a.config)
	return nil
}

// initializeLogger は、ログを初期化します
func (a *Application) initializeLogger() error {
	a.logger = NewLogger("APP", a.config, a.metrics)
	a.logger.Info("Application logger initialized", map[string]interface{}{
		"environment": a.config.Environment,
	})
	return nil
}

// initializeLifecycle は、ライフサイクル管理を初期化します
func (a *Application) initializeLifecycle() error {
	a.lifecycle = NewLifecycleManager(a.logger)

	// データベース接続のシャットダウンフックを追加
	a.lifecycle.AddShutdownHook(func(ctx context.Context) error {
		a.logger.Info("Closing database connection")
		if a.database != nil {
			return a.database.Close()
		}
		return nil
	})

	// サーバーのシャットダウンフックを追加
	a.lifecycle.AddShutdownHook(func(ctx context.Context) error {
		a.logger.Info("Shutting down HTTP server")
		if a.server != nil {
			return a.server.Shutdown(ctx)
		}
		return nil
	})

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

	// メトリクス更新
	a.metrics.SetDatabaseConnections(1)

	a.logger.Info("Database connection established", map[string]interface{}{
		"database_url": a.config.DatabaseURL,
	})
	return nil
}

// initializeDependencies は、依存関係を初期化します
func (a *Application) initializeDependencies() error {
	var err error
	a.dependencies, err = NewDependencies(a.config, a.database)
	if err != nil {
		return fmt.Errorf("failed to create dependencies: %w", err)
	}

	a.logger.Info("Dependencies initialized")
	return nil
}

// initializeServer は、HTTPサーバーを初期化します
func (a *Application) initializeServer() error {
	var err error
	a.server, err = NewServer(a.config, a.dependencies, a.metrics, a.logger)
	if err != nil {
		return fmt.Errorf("failed to create server: %w", err)
	}

	a.logger.Info("HTTP server initialized", map[string]interface{}{
		"port": a.config.Port,
	})
	return nil
}

// Run は、アプリケーションを起動し、グレースフルシャットダウンを待機します
func (a *Application) Run() error {
	// ライフサイクル管理を開始
	a.lifecycle.Start()

	// サーバーをバックグラウンドで起動
	serverErr := make(chan error, 1)
	go func() {
		a.logger.Info("Starting HTTP server", map[string]interface{}{
			"port": a.config.Port,
		})
		if err := a.server.Start(); err != nil {
			serverErr <- fmt.Errorf("server startup failed: %w", err)
		}
	}()

	// サーバー起動エラーまたはライフサイクル終了を待機
	select {
	case err := <-serverErr:
		a.logger.Error("Server startup failed", err)
		return err
	default:
		// ライフサイクル管理にシャットダウンを委任
		a.lifecycle.Wait()
		return nil
	}
}

// HealthCheck は、アプリケーションのヘルスチェックを実行します
func (a *Application) HealthCheck() error {
	// データベース接続の確認
	if err := a.database.Ping(); err != nil {
		return fmt.Errorf("database health check failed: %w", err)
	}

	// メトリクスによる健全性チェック
	if a.metrics != nil {
		if healthy, issues := a.metrics.IsHealthy(); !healthy {
			return fmt.Errorf("health check failed: %v", issues)
		}
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
