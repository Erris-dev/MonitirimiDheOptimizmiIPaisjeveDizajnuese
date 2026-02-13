package routes

import (
	auth "auth-service/src/controllers"
	"auth-service/src/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(router *gin.Engine, authController *auth.AuthController) {
	authRoutes := router.Group("/")
	{
		authRoutes.POST("/register", authController.Register)
		authRoutes.POST("/login", authController.Login)
		authRoutes.GET("/google/login", authController.GoogleLogin)
		authRoutes.GET("/google/callback", authController.GoogleCallback)
		authRoutes.POST("/logout", auth.LogoutHandler)
		authRoutes.GET("/me", middleware.AuthMiddleware(), authController.GetMe)
	}
}
