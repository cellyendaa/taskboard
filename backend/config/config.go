package config

import "os"

type Config struct {
	Port          string
	JWTSecret     string
	DBPath        string
	AllowedOrigin string
}

func Load() Config {
	return Config{
		Port:          getEnv("PORT", "8080"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-me"),
		DBPath:        getEnv("DB_PATH", "taskboard.db"),
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}