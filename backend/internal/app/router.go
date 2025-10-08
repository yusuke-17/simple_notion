package app

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/handlers"
	"simple-notion-backend/internal/handlers/document"
	"simple-notion-backend/internal/middleware"
)

// Router は、アプリケーションのHTTPルーターを管理する構造体です
type Router struct {
	router      *mux.Router
	authHandler *handlers.AuthHandler
	docHandler  *document.DocumentHandler
	jwtSecret   []byte
}

// NewRouter は、新しいRouterインスタンスを作成します
func NewRouter(
	authHandler *handlers.AuthHandler,
	docHandler *document.DocumentHandler,
	jwtSecret []byte,
) *Router {
	return &Router{
		router:      mux.NewRouter(),
		authHandler: authHandler,
		docHandler:  docHandler,
		jwtSecret:   jwtSecret,
	}
}

// SetupRoutes は、全てのエンドポイントを設定します
func (r *Router) SetupRoutes() {
	// ヘルスチェックエンドポイント
	r.setupHealthCheck()

	// 認証不要エンドポイント
	r.setupPublicRoutes()

	// 認証必要エンドポイント
	r.setupProtectedRoutes()
}

// setupHealthCheck は、ヘルスチェックエンドポイントを設定します
func (r *Router) setupHealthCheck() {
	r.router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")
}

// setupPublicRoutes は、認証不要エンドポイントを設定します
func (r *Router) setupPublicRoutes() {
	r.router.HandleFunc("/api/auth/login", r.authHandler.Login).Methods("POST")
	r.router.HandleFunc("/api/auth/register", r.authHandler.Register).Methods("POST")
	r.router.HandleFunc("/api/auth/logout", r.authHandler.Logout).Methods("POST")
}

// setupProtectedRoutes は、認証必要エンドポイントを設定します
func (r *Router) setupProtectedRoutes() {
	// 認証が必要なAPIのサブルーター
	api := r.router.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware(r.jwtSecret))

	// 認証関連
	api.HandleFunc("/auth/me", r.authHandler.Me).Methods("GET")

	// ドキュメント関連
	api.HandleFunc("/documents", r.docHandler.GetDocuments).Methods("GET")
	api.HandleFunc("/documents", r.docHandler.CreateDocument).Methods("POST")
	api.HandleFunc("/documents/tree", r.docHandler.GetDocumentTree).Methods("GET")
	api.HandleFunc("/documents/{id:[0-9]+}", r.docHandler.GetDocument).Methods("GET")
	api.HandleFunc("/documents/{id:[0-9]+}", r.docHandler.UpdateDocument).Methods("PUT")
	api.HandleFunc("/documents/{id:[0-9]+}", r.docHandler.DeleteDocument).Methods("DELETE")
	api.HandleFunc("/documents/{id:[0-9]+}/restore", r.docHandler.RestoreDocument).Methods("PUT")
	api.HandleFunc("/documents/{id:[0-9]+}/permanent", r.docHandler.PermanentDeleteDocument).Methods("DELETE")
	api.HandleFunc("/documents/{id:[0-9]+}/move", r.docHandler.MoveDocument).Methods("PUT")
}

// GetHandler は、CORS設定を適用したHTTPハンドラーを返します
func (r *Router) GetHandler(cfg *config.Config) http.Handler {
	// CORS設定
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173", // Vite開発サーバー
			"http://localhost:3000", // 本番フロントエンド
			"http://frontend:8080",  // Dockerコンテナ間通信
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	return c.Handler(r.router)
}
