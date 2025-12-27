package routes

import (
	auth "auth-service/src/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(router *gin.Engine, authController *auth.AuthController) {
	authRoutes := router.Group("/auth")
	{
		authRoutes.POST("/register", authController.Register)
		authRoutes.POST("/login", authController.Login)
	}
}
