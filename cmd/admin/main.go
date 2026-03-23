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
		c.JSON(200, gin.H{"status": "ok", "service": "admin"})
	})

	// Admin routes (authenticated + admin role)
	admin := r.Group("/admin", AuthMiddleware(), AdminMiddleware())
	{
		// Character management
		admin.GET("/characters", handleListCharacters)
		admin.POST("/characters", handleCreateCharacter)
		admin.PUT("/characters/:id", handleUpdateCharacter)
		admin.DELETE("/characters/:id", handleDeleteCharacter)

		// User management
		admin.GET("/users", handleListUsers)
		admin.PUT("/users/:id/status", handleUpdateUserStatus)

		// Event management
		admin.GET("/events", handleListEvents)
		admin.POST("/events", handleCreateEvent)
		admin.PUT("/events/:id", handleUpdateEvent)

		// Statistics
		admin.GET("/stats/overview", handleGetOverviewStats)
		admin.GET("/stats/volume", handleGetVolumeStats)

		// System config
		admin.GET("/config", handleGetConfig)
		admin.PUT("/config", handleUpdateConfig)

		// Mining stats (from miner service or Redis)
		admin.GET("/mining/stats", handleGetMiningStats)
		admin.GET("/mining/records", handleGetMiningRecords)
	}

	// Proxy to miner service for mining endpoints
	miningProxy := r.Group("/mining")
	{
		miningProxy.GET("/stats", handleGetMiningStats)
		miningProxy.GET("/records", handleGetMiningRecords)
	}

	// WebSocket for real-time monitoring
	r.GET("/ws/admin", handleAdminWebSocket)

	log.Printf("Admin server starting on port %s", cfg.Server.AdminPort)
	r.Run(":" + cfg.Server.AdminPort)
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
		c.Set("userID", "admin001")
		c.Set("role", "admin")
		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role != "admin" && role != "superadmin" {
			c.AbortWithStatusJSON(403, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

func handleListCharacters(c *gin.Context) {
	c.JSON(200, gin.H{"characters": []interface{}{}})
}

func handleCreateCharacter(c *gin.Context) {
	c.JSON(200, gin.H{"message": "character created"})
}

func handleUpdateCharacter(c *gin.Context) {
	c.JSON(200, gin.H{"message": "character updated"})
}

func handleDeleteCharacter(c *gin.Context) {
	c.JSON(200, gin.H{"message": "character deleted"})
}

func handleListUsers(c *gin.Context) {
	c.JSON(200, gin.H{"users": []interface{}{}})
}

func handleUpdateUserStatus(c *gin.Context) {
	c.JSON(200, gin.H{"message": "user status updated"})
}

func handleListEvents(c *gin.Context) {
	c.JSON(200, gin.H{"events": []interface{}{}})
}

func handleCreateEvent(c *gin.Context) {
	c.JSON(200, gin.H{"message": "event created"})
}

func handleUpdateEvent(c *gin.Context) {
	c.JSON(200, gin.H{"message": "event updated"})
}

func handleGetOverviewStats(c *gin.Context) {
	c.JSON(200, gin.H{
		"total_users":      0,
		"total_characters": 0,
		"total_trades":     0,
		"total_volume":     0,
	})
}

func handleGetVolumeStats(c *gin.Context) {
	c.JSON(200, gin.H{"volumes": []interface{}{}})
}

func handleGetConfig(c *gin.Context) {
	c.JSON(200, gin.H{"config": gin.H{}})
}

func handleUpdateConfig(c *gin.Context) {
	c.JSON(200, gin.H{"message": "config updated"})
}

func handleAdminWebSocket(c *gin.Context) {
	c.JSON(200, gin.H{"message": "websocket"})
}

func handleGetMiningStats(c *gin.Context) {
	c.JSON(200, gin.H{
		"active_miners":      0,
		"total_hash_rate":    0,
		"current_difficulty": 4,
		"hourly_output":      0,
		"hourly_target":      10000,
	})
}

func handleGetMiningRecords(c *gin.Context) {
	c.JSON(200, gin.H{"records": []interface{}{}})
}
