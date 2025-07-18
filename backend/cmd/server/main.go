package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"github.com/rs/cors"

	"simple-notion-backend/internal/config"
	"simple-notion-backend/internal/handlers"
	"simple-notion-backend/internal/middleware"
	"simple-notion-backend/internal/repository"
)

func main() {
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

	docRepo, err := repository.NewDocumentRepository(db)
	if err != nil {
		log.Fatal("Failed to create document repository:", err)
	}

	// ハンドラー初期化
	authHandler := handlers.NewAuthHandler(userRepo, []byte(cfg.JWTSecret))
	docHandler := handlers.NewDocumentHandler(docRepo)

	// ルーター設定
	r := mux.NewRouter()

	// ヘルスチェックエンドポイント
	r.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}).Methods("GET")

	// 認証不要エンドポイント
	r.HandleFunc("/api/auth/login", authHandler.Login).Methods("POST")
	r.HandleFunc("/api/auth/register", authHandler.Register).Methods("POST")
	r.HandleFunc("/api/auth/logout", authHandler.Logout).Methods("POST")

	// 認証必要エンドポイント
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware([]byte(cfg.JWTSecret)))

	api.HandleFunc("/auth/me", authHandler.Me).Methods("GET")
	api.HandleFunc("/documents", docHandler.GetDocuments).Methods("GET")
	api.HandleFunc("/documents", docHandler.CreateDocument).Methods("POST")
	api.HandleFunc("/documents/tree", docHandler.GetDocumentTree).Methods("GET")
	api.HandleFunc("/documents/{id:[0-9]+}", docHandler.GetDocument).Methods("GET")
	api.HandleFunc("/documents/{id:[0-9]+}", docHandler.UpdateDocument).Methods("PUT")
	api.HandleFunc("/documents/{id:[0-9]+}", docHandler.DeleteDocument).Methods("DELETE")
	api.HandleFunc("/documents/{id:[0-9]+}/restore", docHandler.RestoreDocument).Methods("PUT")
	api.HandleFunc("/documents/{id:[0-9]+}/move", docHandler.MoveDocument).Methods("PUT")

	// CORS設定
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	log.Printf("Server starting on port %s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, handler))
}
