package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"

	// Replace these with the actual paths in your project
	jwt "auth-service/src/utils"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Get token from cookie
		tokenString, err := c.Cookie("access_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		// 2. Parse & Validate
		// claims should contain the UserID (string)
		claims, err := jwt.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// 3. Convert string ID back to pgtype.UUID
		// This format is required for pgx to handle the binary UUID correctly
		var userUUID pgtype.UUID
		err = userUUID.UnmarshalJSON([]byte(fmt.Sprintf("\"%s\"", claims.UserID)))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal ID mapping error"})
			c.Abort()
			return
		}

		// 4. Save to context for the controller to find
		c.Set("user_id", userUUID)
		c.Next()
	}
}
