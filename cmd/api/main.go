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
	authService      *service.AuthService
	characterService *service.CharacterService
	accountService   *service.AccountService
	miningService    *service.MiningService
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
	charRepo := mysql.NewCharacterRepository(db)
	accountRepo := mysql.NewAccountRepository(db)

	// Initialize services
	authService = service.NewAuthService(userRepo, accountRepo, cfg.JWT.Secret)
	characterService = service.NewCharacterService(charRepo)
	accountService = service.NewAccountService(accountRepo)
	miningService = service.NewMiningService(accountRepo)

	// Initialize Gin
	r := gin.Default()
	r.Use(CORS())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "api"})
	})

	// Public routes
	public := r.Group("/api")
	{
		public.POST("/auth/register", handleRegister)
		public.POST("/auth/login", handleLogin)
		public.GET("/characters", handleListCharacters)
		public.GET("/characters/:id", handleGetCharacter)
	}

	// Authenticated routes
	auth := r.Group("/api", AuthMiddleware())
	{
		auth.GET("/auth/me", handleGetMe)
		auth.POST("/auth/refresh", handleRefreshToken)
		auth.GET("/account", handleGetAccount)
		auth.POST("/account/daily-login", handleDailyLogin)
		auth.GET("/holdings", handleGetHoldings)
	}

	log.Printf("API server starting on port %s", cfg.Server.APIPort)
	r.Run(":" + cfg.Server.APIPort)
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
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized", "message": "请先登录"})
			return
		}

		// Extract token from "Bearer <token>"
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
		c.Set("user", user)
		c.Next()
	}
}

func handleRegister(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}

	resp, err := authService.Register(&req)
	if err != nil {
		c.JSON(400, gin.H{"error": "register_failed", "message": err.Error()})
		return
	}

	c.JSON(200, resp)
}

func handleLogin(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}

	resp, err := authService.Login(&req)
	if err != nil {
		c.JSON(401, gin.H{"error": "login_failed", "message": err.Error()})
		return
	}

	c.JSON(200, resp)
}

func handleGetMe(c *gin.Context) {
	user, _ := c.Get("user")
	c.JSON(200, gin.H{"user": user})
}

func handleRefreshToken(c *gin.Context) {
	c.JSON(200, gin.H{"message": "refresh"})
}

func handleListCharacters(c *gin.Context) {
	category := c.Query("category")
	status := c.Query("status")

	characters, err := characterService.List(category, status)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"characters": characters})
}

func handleGetCharacter(c *gin.Context) {
	id := c.Param("id")

	character, err := characterService.GetByID(id)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}
	if character == nil {
		c.JSON(404, gin.H{"error": "not_found", "message": "角色不存在"})
		return
	}

	c.JSON(200, gin.H{"character": character})
}

func handleGetAccount(c *gin.Context) {
	userID := c.GetString("userID")

	account, err := accountService.GetAccount(userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}
	if account == nil {
		c.JSON(404, gin.H{"error": "not_found", "message": "账户不存在"})
		return
	}

	c.JSON(200, gin.H{"account": account})
}

func handleDailyLogin(c *gin.Context) {
	userID := c.GetString("userID")

	reward, err := accountService.DailyLogin(userID)
	if err != nil {
		c.JSON(400, gin.H{"error": "daily_login_failed", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"reward": reward, "message": "签到成功"})
}

func handleGetHoldings(c *gin.Context) {
	userID := c.GetString("userID")

	holdings, err := accountService.GetHoldings(userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"holdings": holdings})
}
