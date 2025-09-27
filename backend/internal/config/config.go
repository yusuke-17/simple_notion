package config

import "os"

type Config struct {
	DatabaseURL    string
	JWTSecret      string
	Port           string
	Environment    string // "development" or "production"
	CookieSecure   bool   // HTTPSが必要かどうか
	CookieSameSite string // "strict", "lax", "none"
	CookieDomain   string // Cookie のドメイン
}

func Load() *Config {
	env := getEnv("ENVIRONMENT", "development")

	config := &Config{
		DatabaseURL:  getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/notion_app?sslmode=disable"),
		JWTSecret:    getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		Port:         getEnv("PORT", "8080"),
		Environment:  env,
		CookieDomain: getEnv("COOKIE_DOMAIN", ""),
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
