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
		c.JSON(200, gin.H{"status": "ok", "service": "miner"})
	})

	// Mining routes (authenticated)
	mining := r.Group("/api/mining", AuthMiddleware())
	{
		mining.POST("/session", handleCreateSession)
		mining.POST("/submit", handleSubmitNonce)
		mining.GET("/stats", handleGetMiningStats)
		mining.GET("/history", handleGetMiningHistory)
	}

	// WebSocket for real-time updates
	r.GET("/ws/mining", handleMiningWebSocket)

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

func handleCreateSession(c *gin.Context) {
	c.JSON(200, gin.H{"message": "create mining session"})
}

func handleSubmitNonce(c *gin.Context) {
	c.JSON(200, gin.H{"message": "submit nonce"})
}

func handleGetMiningStats(c *gin.Context) {
	c.JSON(200, gin.H{
		"difficulty": 4,
		"hash_rate":  0,
		"rewards":    0,
	})
}

func handleGetMiningHistory(c *gin.Context) {
	c.JSON(200, gin.H{"history": []interface{}{}})
}

func handleMiningWebSocket(c *gin.Context) {
	c.JSON(200, gin.H{"message": "websocket"})
}
