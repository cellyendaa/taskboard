package config

import "os"

type Config struct {
	Port          string
	JWTSecret     string
	DatabaseURL   string
	AllowedOrigin string
}

func Load() Config {
	return Config{
		Port:      getEnv("PORT", "8080"),
		JWTSecret: getEnv("JWT_SECRET", "dev-secret-change-me"),
		DatabaseURL: getEnv("DATABASE_URL",
			"host=localhost user=taskboard password=taskboard dbname=taskboard port=5432 sslmode=disable TimeZone=Asia/Jakarta"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}