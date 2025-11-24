package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	Port           string
	Environment    string // "development" or "production"
	CookieSecure   bool   // HTTPSが必要かどうか
	CookieSameSite string // "strict", "lax", "none"
	CookieDomain   string // Cookie のドメイン

	// MinIO/S3 設定
	S3Endpoint      string
	S3AccessKey     string
	S3SecretKey     string
	S3BucketName    string
	S3Region        string
	S3UseSSL        bool
	S3PresignExpiry int // 署名付きURLの有効期限（秒）

	// ファイルアップロード制限
	MaxFileSize      int64 // 単一ファイルの最大サイズ（バイト）
	UserStorageQuota int64 // ユーザーあたりのストレージクォータ（バイト）
}

func Load() *Config {
	env := getEnv("ENVIRONMENT", "development")

	config := &Config{
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/notion_app?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		Port:         getEnv("PORT", "8080"),
		Environment:  env,
		CookieDomain: getEnv("COOKIE_DOMAIN", ""),

		// MinIO/S3 設定
		S3Endpoint:      getEnv("S3_ENDPOINT", "minio:9000"),
		S3AccessKey:     getEnv("S3_ACCESS_KEY", "minioadmin"),
		S3SecretKey:     getEnv("S3_SECRET_KEY", "minioadmin"),
		S3BucketName:    getEnv("S3_BUCKET_NAME", "simple-notion-files"),
		S3Region:        getEnv("S3_REGION", "us-east-1"),
		S3UseSSL:        getBoolEnv("S3_USE_SSL", false),
		S3PresignExpiry: getIntEnv("S3_PRESIGN_EXPIRY", 86400), // デフォルト24時間

		// ファイルアップロード制限
		MaxFileSize:      getInt64Env("MAX_FILE_SIZE", 10485760),       // デフォルト10MB
		UserStorageQuota: getInt64Env("USER_STORAGE_QUOTA", 104857600), // デフォルト100MB
	}

	// 環境に応じたセキュリティ設定
	if env == "production" {
		config.CookieSecure = getBoolEnv("COOKIE_SECURE", true)
		config.CookieSameSite = getEnv("COOKIE_SAMESITE", "strict")
	} else {
		config.CookieSecure = getBoolEnv("COOKIE_SECURE", false)
		config.CookieSameSite = getEnv("COOKIE_SAMESITE", "lax")
	}

	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value == "true" || value == "1" || value == "yes"
}

func getIntEnv(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return intValue
}

func getInt64Env(key string, defaultValue int64) int64 {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	int64Value, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return defaultValue
	}
	return int64Value
}
