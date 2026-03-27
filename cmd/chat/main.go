package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"o7m2/internal/chat"
	"o7m2/internal/repository/mysql"
	redisrepo "o7m2/internal/repository/redis"
	"o7m2/internal/service"
	"o7m2/pkg/config"
)

func main() {
	cfg := config.Load()

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

	rdb, err := redisrepo.NewRedis(cfg.Redis.Host, cfg.Redis.Port, cfg.Redis.Password, cfg.Redis.DB)
	if err != nil {
		log.Fatalf("Failed to connect to redis: %v", err)
	}

	userRepo := mysql.NewUserRepository(db)
	accountRepo := mysql.NewAccountRepository(db)
	charRepo := mysql.NewCharacterRepository(db)
	orderRepo := mysql.NewOrderRepository(db)

	authSvc := service.NewAuthService(userRepo, accountRepo, cfg.JWT.Secret)

	chatServer, err := chat.NewServer(chat.ServerDeps{
		Auth:    authSvc,
		Redis:   rdb.Client,
		Chars:   charRepo,
		Orders:  orderRepo,
		Clock:   chat.RealClock{},
		Options: chat.LoadOptionsFromEnv(),
	})
	if err != nil {
		log.Fatalf("Failed to init chat server: %v", err)
	}

	r := gin.Default()
	r.Use(chat.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "chat"})
	})

	r.GET("/ws/chat", chatServer.HandleWebSocket)
	r.POST("/api/chat", chatServer.HandleHTTPChat)

	log.Printf("Chat server starting on port %s", cfg.Server.ChatPort)
	r.Run(":" + cfg.Server.ChatPort)
}
