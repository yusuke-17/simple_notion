package app

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/handlers"
	"simple-notion-backend/internal/handlers/document"
	"simple-notion-backend/internal/handlers/upload"
	"simple-notion-backend/internal/middleware"
)

// Router は、アプリケーションのHTTPルーターを管理する構造体です
type Router struct {
	router        *mux.Router
	authHandler   *handlers.AuthHandler
	docHandler    *document.DocumentHandler
	uploadHandler *upload.UploadHandler
	jwtSecret     []byte
	metrics       *Metrics
}

// NewRouter は、新しいRouterインスタンスを作成します
func NewRouter(
	authHandler *handlers.AuthHandler,
	docHandler *document.DocumentHandler,
	uploadHandler *upload.UploadHandler,
	jwtSecret []byte,
) *Router {
	return &Router{
		router:        mux.NewRouter(),
		authHandler:   authHandler,
		docHandler:    docHandler,
		uploadHandler: uploadHandler,
		jwtSecret:     jwtSecret,
	}
}

// NewRouterFromDependencies は、Dependenciesから新しいRouterインスタンスを作成します
func NewRouterFromDependencies(deps *Dependencies) *Router {
	return &Router{
		router:        mux.NewRouter(),
		authHandler:   deps.AuthHandler,
		docHandler:    deps.DocumentHandler,
		uploadHandler: deps.UploadHandler,
		jwtSecret:     deps.GetJWTSecret(),
	}
}

// NewRouterWithMetrics は、DependenciesとMetricsから新しいRouterインスタンスを作成します
func NewRouterWithMetrics(deps *Dependencies, metrics *Metrics) *Router {
	return &Router{
		router:        mux.NewRouter(),
		authHandler:   deps.AuthHandler,
		docHandler:    deps.DocumentHandler,
		uploadHandler: deps.UploadHandler,
		jwtSecret:     deps.GetJWTSecret(),
		metrics:       metrics,
	}
}

// SetupRoutes は、全てのエンドポイントを設定します
func (r *Router) SetupRoutes() {
	// ヘルスチェックエンドポイント
	r.setupHealthCheck()

	// メトリクスエンドポイント
	r.setupMetricsEndpoints()

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

// setupMetricsEndpoints は、メトリクスエンドポイントを設定します
func (r *Router) setupMetricsEndpoints() {
	if r.metrics == nil {
		return
	}

	r.router.HandleFunc("/metrics", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		snapshot := r.metrics.GetSnapshot()
		if data, err := json.Marshal(snapshot); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(`{"error":"failed to marshal metrics"}`))
		} else {
			w.WriteHeader(http.StatusOK)
			w.Write(data)
		}
	}).Methods("GET")
}

// setupPublicRoutes は、認証不要エンドポイントを設定します
func (r *Router) setupPublicRoutes() {
	r.router.HandleFunc("/api/auth/login", r.authHandler.Login).Methods("POST")
	r.router.HandleFunc("/api/auth/register", r.authHandler.Register).Methods("POST")
	r.router.HandleFunc("/api/auth/logout", r.authHandler.Logout).Methods("POST")

	// 静的ファイル配信（MinIO経由）
	r.router.HandleFunc("/api/uploads/{filename}", r.uploadHandler.ServeFile).Methods("GET")
}

// setupProtectedRoutes は、認証必要エンドポイントを設定します
func (r *Router) setupProtectedRoutes() {
	// 認証が必要なAPIのサブルーター
	api := r.router.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware(r.jwtSecret))

	// 認証関連
	api.HandleFunc("/auth/me", r.authHandler.Me).Methods("GET")

	// ファイルアップロード関連（画像のみサポート）
	api.HandleFunc("/upload/image", r.uploadHandler.UploadImage).Methods("POST", "OPTIONS")
	api.HandleFunc("/files/{id:[0-9]+}/url", r.uploadHandler.GetPresignedURL).Methods("GET")
	api.HandleFunc("/storage/usage", r.uploadHandler.GetStorageUsage).Methods("GET")

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
