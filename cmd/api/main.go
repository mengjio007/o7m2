package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"o7m2/pkg/config"
)

func main() {
	cfg := config.Load()

	r := gin.Default()

	r.Use(gin.Recovery())
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
		auth.POST("/auth/refresh", handleRefreshToken)
		auth.GET("/account", handleGetAccount)
		auth.POST("/account/daily-login", handleDailyLogin)
		auth.POST("/order", handleCreateOrder)
		auth.DELETE("/order/:id", handleCancelOrder)
		auth.GET("/orders", handleListOrders)
		auth.GET("/holdings", handleGetHoldings)
		auth.GET("/trades", handleGetTrades)
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
		token := c.GetHeader("Authorization")
		if token == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
			return
		}
		// TODO: Validate JWT token
		c.Set("userID", "user001")
		c.Next()
	}
}

func handleRegister(c *gin.Context) {
	c.JSON(200, gin.H{"message": "register"})
}

func handleLogin(c *gin.Context) {
	c.JSON(200, gin.H{"message": "login"})
}

func handleRefreshToken(c *gin.Context) {
	c.JSON(200, gin.H{"message": "refresh"})
}

func handleListCharacters(c *gin.Context) {
	c.JSON(200, gin.H{"characters": []interface{}{}})
}

func handleGetCharacter(c *gin.Context) {
	c.JSON(200, gin.H{"character": gin.H{"id": c.Param("id")}})
}

func handleGetAccount(c *gin.Context) {
	c.JSON(200, gin.H{"account": gin.H{}})
}

func handleDailyLogin(c *gin.Context) {
	c.JSON(200, gin.H{"message": "daily login"})
}

func handleCreateOrder(c *gin.Context) {
	c.JSON(200, gin.H{"message": "create order"})
}

func handleCancelOrder(c *gin.Context) {
	c.JSON(200, gin.H{"message": "cancel order"})
}

func handleListOrders(c *gin.Context) {
	c.JSON(200, gin.H{"orders": []interface{}{}})
}

func handleGetHoldings(c *gin.Context) {
	c.JSON(200, gin.H{"holdings": []interface{}{}})
}

func handleGetTrades(c *gin.Context) {
	c.JSON(200, gin.H{"trades": []interface{}{}})
}
