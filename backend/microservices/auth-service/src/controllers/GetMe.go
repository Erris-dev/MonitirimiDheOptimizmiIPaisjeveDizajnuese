package auth

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

func (ac *AuthController) GetMe(c *gin.Context) {
	// 1. Get the UUID from your Auth Middleware
	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := val.(pgtype.UUID)

	// 2. Fetch joined data from DB
	// This calls the sqlc-generated function
	data, err := ac.db.GetUserWithLatestDevice(c.Request.Context(), userID)
	if err != nil {
		log.Println("Error fetching profile:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not fetch profile"})
		return
	}

	// 3. Return the combined object
	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":    data.UserID,
			"email": data.Email,
		},
		"device": gin.H{
			"name":      data.DeviceName.String,
			"last_seen": data.LastSeen.Time,
		},
	})
}
