package app

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"simple-notion-backend/internal/config"
)

// Server は、HTTPサーバーを管理する構造体です
type Server struct {
	httpServer   *http.Server
	router       *Router
	config       *config.Config
	dependencies *Dependencies
	logger       *log.Logger
}

// NewServer は、新しいServerインスタンスを作成します
func NewServer(cfg *config.Config, deps *Dependencies) (*Server, error) {
	server := &Server{
		config:       cfg,
		dependencies: deps,
		logger:       log.New(os.Stdout, "[SERVER] ", log.LstdFlags|log.Lshortfile),
	}

	// ルーターの設定
	if err := server.setupRouter(); err != nil {
		return nil, fmt.Errorf("failed to setup router: %w", err)
	}

	// HTTPサーバーの設定
	if err := server.setupHTTPServer(); err != nil {
		return nil, fmt.Errorf("failed to setup HTTP server: %w", err)
	}

	return server, nil
}

// setupRouter は、ルーターを設定します
func (s *Server) setupRouter() error {
	s.router = NewRouterFromDependencies(s.dependencies)
	s.router.SetupRoutes()

	s.logger.Println("Router configured with all endpoints")
	return nil
}

// setupHTTPServer は、HTTPサーバーを設定します
func (s *Server) setupHTTPServer() error {
	handler := s.router.GetHandler(s.config)

	s.httpServer = &http.Server{
		Addr:    ":" + s.config.Port,
		Handler: handler,

		// タイムアウト設定
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,

		// ログ設定
		ErrorLog: s.logger,
	}

	s.logger.Printf("HTTP server configured on port %s", s.config.Port)
	return nil
}

// Start は、HTTPサーバーを起動します
func (s *Server) Start() error {
	s.logger.Printf("Starting HTTP server on :%s", s.config.Port)

	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("HTTP server startup failed: %w", err)
	}

	return nil
}

// Shutdown は、HTTPサーバーをグレースフルにシャットダウンします
func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Println("Shutting down HTTP server...")

	if err := s.httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("HTTP server shutdown failed: %w", err)
	}

	s.logger.Println("HTTP server shutdown completed")
	return nil
}

// GetAddr は、サーバーのアドレスを返します
func (s *Server) GetAddr() string {
	if s.httpServer != nil {
		return s.httpServer.Addr
	}
	return ":" + s.config.Port
}
