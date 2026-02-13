package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// LogoutHandler clears the authentication cookie
func LogoutHandler(c *gin.Context) {
	// Clear access token
	c.SetCookie(
		"access_token",
		"",
		-1,
		"/",
		"",
		false,
		true,
	)

	// Clear refresh token
	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}
