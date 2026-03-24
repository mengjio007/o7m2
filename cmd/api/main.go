package main

import (
	"log"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"o7m2/internal/domain"
	"o7m2/internal/repository/mysql"
	"o7m2/internal/service"
	"o7m2/pkg/config"
)

var (
	db               *mysql.DB
	authService      *service.AuthService
	characterService *service.CharacterService
	accountService   *service.AccountService
	miningService    *service.MiningService
	tradingService   *service.TradingService
)

func main() {
	cfg := config.Load()

	// Initialize database
	var err error
	db, err = mysql.NewMySQL(
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
	orderRepo := mysql.NewOrderRepository(db)

	// Initialize services
	authService = service.NewAuthService(userRepo, accountRepo, cfg.JWT.Secret)
	characterService = service.NewCharacterService(charRepo)
	accountService = service.NewAccountService(accountRepo)
	miningService = service.NewMiningService(accountRepo)
	tradingService = service.NewTradingService(orderRepo, accountRepo, charRepo)

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
		public.GET("/characters/:id/orderbook", handleGetOrderBook)
		public.GET("/characters/:id/trades", handleGetTrades)
		public.GET("/characters/:id/klines", handleGetKLines)
	}

	// Authenticated routes
	auth := r.Group("/api", AuthMiddleware())
	{
		auth.GET("/auth/me", handleGetMe)
		auth.POST("/auth/refresh", handleRefreshToken)
		auth.GET("/account", handleGetAccount)
		auth.POST("/account/daily-login", handleDailyLogin)
		auth.GET("/holdings", handleGetHoldings)

		// Trading
		auth.POST("/orders", handleCreateOrder)
		auth.GET("/orders", handleGetOrders)
		auth.DELETE("/orders/:id", handleCancelOrder)
		auth.GET("/positions", handleGetPositions)
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

	// 为每个角色添加咖位评级
	rankConfig := getRankConfig()
	for _, char := range characters {
		rank := domain.GetRank(char.CurrentPrice, rankConfig)
		char.Rank = &rank
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

	// 添加咖位评级
	rankConfig := getRankConfig()
	rank := domain.GetRank(character.CurrentPrice, rankConfig)
	character.Rank = &rank

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

func handleCreateOrder(c *gin.Context) {
	userID := c.GetString("userID")

	var req service.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid_request", "message": err.Error()})
		return
	}

	order, err := tradingService.CreateOrder(userID, &req)
	if err != nil {
		c.JSON(400, gin.H{"error": "order_failed", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"order": order})
}

func handleGetOrders(c *gin.Context) {
	userID := c.GetString("userID")

	orders, err := tradingService.GetUserOrders(userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"orders": orders})
}

func handleCancelOrder(c *gin.Context) {
	userID := c.GetString("userID")
	orderID := c.Param("id")

	err := tradingService.CancelOrder(userID, orderID)
	if err != nil {
		c.JSON(400, gin.H{"error": "cancel_failed", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "order cancelled"})
}

func handleGetPositions(c *gin.Context) {
	userID := c.GetString("userID")

	positions, err := tradingService.GetUserPositions(userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"positions": positions})
}

func handleGetOrderBook(c *gin.Context) {
	characterID := c.Param("id")
	limit := 20

	// Get pending orders for this character
	orders, err := tradingService.GetOrderBook(characterID)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	// Split into asks and bids
	var asks, bids []gin.H
	for _, o := range orders {
		if o.Side == "sell" {
			asks = append(asks, gin.H{"price": o.Price, "quantity": o.Quantity - o.FilledQty})
		} else {
			bids = append(bids, gin.H{"price": o.Price, "quantity": o.Quantity - o.FilledQty})
		}
		if len(asks) >= limit && len(bids) >= limit {
			break
		}
	}

	// Get last trade for last price
	lastPrice := int64(0)
	if len(asks) > 0 {
		if p, ok := asks[0]["price"].(int64); ok {
			lastPrice = p
		}
	} else if len(bids) > 0 {
		if p, ok := bids[0]["price"].(int64); ok {
			lastPrice = p
		}
	}

	c.JSON(200, gin.H{
		"asks":       asks,
		"bids":       bids,
		"lastPrice":  lastPrice,
		"changeRate": 0.0,
	})
}

func handleGetTrades(c *gin.Context) {
	characterID := c.Param("id")
	limit := 20

	trades, err := tradingService.GetTradesByCharacter(characterID, limit)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"trades": trades})
}

func handleGetKLines(c *gin.Context) {
	characterID := c.Param("id")
	period := c.DefaultQuery("period", "1m")
	limit := 100

	klines, err := tradingService.GetKLines(characterID, period, limit)
	if err != nil {
		c.JSON(500, gin.H{"error": "internal_error", "message": err.Error()})
		return
	}

	c.JSON(200, gin.H{"klines": klines})
}

func getRankConfig() *domain.RankConfig {
	// 默认值
	config := &domain.RankConfig{
		La:   1000,
		NPC:  5000,
		Ren:  15000,
		Ding: 50000,
	}

	// 从数据库读取配置（简化版）
	rows, err := db.Query("SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'rank_%'")
	if err != nil {
		return config
	}
	defer rows.Close()

	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			continue
		}
		intVal, _ := strconv.ParseInt(value, 10, 64)
		switch key {
		case "rank_la":
			config.La = intVal
		case "rank_npc":
			config.NPC = intVal
		case "rank_ren":
			config.Ren = intVal
		case "rank_ding":
			config.Ding = intVal
		}
	}

	return config
}
