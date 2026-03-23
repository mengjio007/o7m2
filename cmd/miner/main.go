package main

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"

	"o7m2/internal/repository/mysql"
	"o7m2/internal/service"
	"o7m2/pkg/config"
)

var (
	miningService *service.MiningService
	authService   *service.AuthService
)

func main() {
	cfg := config.Load()

	// Initialize database
	db, err := mysql.NewMySQL(
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
	)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := mysql.NewUserRepository(db)
	accountRepo := mysql.NewAccountRepository(db)

	// Initialize services
	miningService = service.NewMiningService(accountRepo)
	authService = service.NewAuthService(userRepo, accountRepo, cfg.JWT.Secret)

	// Initialize Gin
	r := gin.Default()
	r.Use(CORS())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "miner"})
	})

	// Mining routes (authenticated)
	mining := r.Group("/api/mining", AuthMiddleware())
	{
		mining.POST("/session", handleCreateSession)
		mining.POST("/submit", handleSubmitNonce)
		mining.GET("/stats", handleGetMiningStats)
	}

	log.Printf("Miner server starting on port %s", cfg.Server.MinerPort)
	r.Run(":" + cfg.Server.MinerPort)
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized", "message": "请先登录才能挖矿"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(401, gin.H{"error": "invalid_token", "message": "无效的令牌格式"})
			return
		}

		user, err := authService.ValidateToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "invalid_token", "message": "令牌已过期或无效"})
			return
		}

		c.Set("userID", user.ID)
		c.Next()
	}
}

func handleCreateSession(c *gin.Context) {
	userID := c.GetString("userID")

	var req struct {
		CharacterID string `json:"character_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}

	session, err := miningService.CreateSession(userID, req.CharacterID)
	if err != nil {
		c.JSON(400, gin.H{"error": "session_failed", "message": err.Error()})
		return
	}

	c.JSON(200, session)
}

func handleSubmitNonce(c *gin.Context) {
	userID := c.GetString("userID")

	var req service.SubmitNonceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}

	result, err := miningService.SubmitNonce(userID, &req)
	if err != nil {
		c.JSON(400, gin.H{"error": "submit_failed", "message": err.Error()})
		return
	}

	c.JSON(200, result)
}

func handleGetMiningStats(c *gin.Context) {
	c.JSON(200, gin.H{
		"difficulty": 4,
		"hash_rate":  0,
		"rewards":    0,
	})
}
