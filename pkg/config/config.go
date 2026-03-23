package config

import (
	"os"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	APIPort   string
	MatchPort string
	MinerPort string
	AdminPort string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret     string
	ExpireHour int
}

func Load() *Config {
	return &Config{
		Server: ServerConfig{
			APIPort:   getEnv("API_PORT", "8080"),
			MatchPort: getEnv("MATCH_PORT", "8081"),
			MinerPort: getEnv("MINER_PORT", "8082"),
			AdminPort: getEnv("ADMIN_PORT", "8083"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", "root"),
			DBName:   getEnv("DB_NAME", "o7m2"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       0,
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "o7m2-secret-key-change-in-production"),
			ExpireHour: 24,
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
