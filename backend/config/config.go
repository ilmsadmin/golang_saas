package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	// Database configuration
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Redis configuration
	RedisHost     string
	RedisPort     string
	RedisPassword string

	// JWT configuration
	JWTSecret            string
	JWTExpireHours       int
	JWTRefreshExpireHours int

	// Application configuration
	AppEnv    string
	AppPort   string
	AppDomain string
	AppName   string

	// Email configuration
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string

	// Upload configuration
	UploadMaxSize      int64
	UploadAllowedTypes string

	// Rate limiting
	RateLimitRequests int
	RateLimitWindow   int

	// Security
	BCryptCost int

	// CORS
	CORSAllowedOrigins string
}

var AppConfig *Config

func LoadConfig() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	AppConfig = &Config{
		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "password"),
		DBName:     getEnv("DB_NAME", "golang_saas_dev"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		// Redis
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		// JWT
		JWTSecret:            getEnv("JWT_SECRET", "your-super-secret-jwt-key"),
		JWTExpireHours:       getEnvAsInt("JWT_EXPIRE_HOURS", 24),
		JWTRefreshExpireHours: getEnvAsInt("JWT_REFRESH_EXPIRE_HOURS", 168),

		// Application
		AppEnv:    getEnv("APP_ENV", "development"),
		AppPort:   getEnv("APP_PORT", "3000"),
		AppDomain: getEnv("APP_DOMAIN", "localhost:3000"),
		AppName:   getEnv("APP_NAME", "GoLang SaaS Platform"),

		// Email
		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@zplus.vn"),
		FromName:     getEnv("FROM_NAME", "ZPlus Platform"),

		// Upload
		UploadMaxSize:      getEnvAsInt64("UPLOAD_MAX_SIZE", 10485760), // 10MB
		UploadAllowedTypes: getEnv("UPLOAD_ALLOWED_TYPES", "jpg,jpeg,png,gif,pdf,doc,docx"),

		// Rate limiting
		RateLimitRequests: getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   getEnvAsInt("RATE_LIMIT_WINDOW", 3600),

		// Security
		BCryptCost: getEnvAsInt("BCRYPT_COST", 12),

		// CORS
		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3001,http://localhost:3000"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	if valueStr := os.Getenv(key); valueStr != "" {
		if value, err := strconv.ParseInt(valueStr, 10, 64); err == nil {
			return value
		}
	}
	return defaultValue
}