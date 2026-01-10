package main

import (
	"auth-service/src/config"
	auth "auth-service/src/controllers"
	generated "auth-service/src/db/generated"
	"auth-service/src/routes"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// 1. Define custom metrics
var (
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "auth_service_http_requests_total",
			Help: "Total number of HTTP requests to the auth service",
		},
		[]string{"path"},
	)
)

func init() {
	// 2. Register metrics with Prometheus
	prometheus.MustRegister(httpRequestsTotal)
}

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

	// 3. Expose the /metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// 4. Middleware to count requests
	router.Use(func(c *gin.Context) {
		httpRequestsTotal.WithLabelValues(c.FullPath()).Inc()
		c.Next()
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "Auth service is healthyyyyyyy"})
	})

	routes.RegisterAuthRoutes(router, authController)

	log.Println("Starting auth service :8001")
	if err := router.Run(":8001"); err != nil {
		log.Fatalf("Failed to start server: %v", err.Error())
	}
}
