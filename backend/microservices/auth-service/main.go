package main

import (
	"log"

	"auth-service/src/config"
	auth "auth-service/src/controllers"
	generated "auth-service/src/db/generated"
	"auth-service/src/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	gin.SetMode(gin.DebugMode)

	dbPool, err := config.InitDB()
	auth.InitGoogleOAuth()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer dbPool.Close()

	queries := generated.New(dbPool)

	authController := auth.NewAuthController(queries)

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "Auth service is healthyyyyyyy"})
	})

	routes.RegisterAuthRoutes(router, authController)

	log.Println("Starting auth service :8001")
	if err := router.Run(":8001"); err != nil {
		log.Fatalf("Failed to start server: %v", err.Error())
	}
}
