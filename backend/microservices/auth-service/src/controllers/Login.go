package auth

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"

	generated "auth-service/src/db/generated"
	jwt "auth-service/src/utils"

	ua "github.com/mssola/user_agent"
)

// src/controllers/auth_controller.go  (or wherever your AuthController is)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginResponse struct {
	ID        pgtype.UUID      `json:"id"`
	Email     string           `json:"email"`
	CreatedAt pgtype.Timestamp `json:"created_at"`
}

func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := c.Request.Context()

	// 1. Find user by email
	user, err := ac.db.FindUserByEmail(ctx, req.Email)
	if err == sql.ErrNoRows {
		// Don't reveal if email exists or not (security best practice)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	if err != nil {
		log.Printf("DATABASE ERROR in FindUserByEmail during login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}

	// 2. Verify password
	if !user.PasswordHash.Valid || user.PasswordHash.String == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash.String), []byte(req.Password))
	if err != nil {
		// Wrong password
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// 3. Generate tokens
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken, err := jwt.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	// 4. Store refresh token in sessions table
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	_, err = ac.db.CreateSession(ctx, generated.CreateSessionParams{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    pgtype.Timestamp{Time: expiresAt, Valid: true},
	})
	if err != nil {
		log.Printf("Failed to store session during login: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store session"})
		return
	}

	// 5. Register/update current device (same as register)
	clientIP := c.ClientIP()
	rawUserAgent := c.Request.UserAgent()

	agent := ua.New(rawUserAgent)
	isMobile := agent.Mobile()

	var deviceType string
	if isMobile {
		deviceType = "mobile"
	} else {
		deviceType = "desktop"
	}

	osInfo := strings.TrimSpace(agent.OS())
	browserName, browserVersion := agent.Browser()
	browserName = strings.TrimSpace(browserName)

	var deviceName string
	if osInfo != "" && browserName != "" {
		if browserVersion != "" && browserVersion != "0" {
			deviceName = fmt.Sprintf("%s – %s %s", osInfo, browserName, browserVersion)
		} else {
			deviceName = fmt.Sprintf("%s – %s", osInfo, browserName)
		}
	} else if osInfo != "" {
		deviceName = osInfo
	} else if browserName != "" {
		if browserVersion != "" && browserVersion != "0" {
			deviceName = fmt.Sprintf("%s %s", browserName, browserVersion)
		} else {
			deviceName = browserName
		}
	} else {
		deviceName = "Unknown Device"
	}

	if deviceName == "Unknown Device" && strings.Contains(strings.ToLower(rawUserAgent), "bot") {
		deviceName = "Bot/Crawler"
	}

	// Upsert device: update last_seen if exists, else create new
	existingDevice, err := ac.db.FindDeviceByUserAndIP(ctx, generated.FindDeviceByUserAndIPParams{
		UserID:    user.ID,
		IpAddress: pgtype.Text{String: clientIP, Valid: true},
	})

	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error checking existing device: %v", err)
		// non-critical, continue
	}

	if err == nil && existingDevice.Valid {
		// Update existing device
		err = ac.db.UpdateDeviceLastSeen(ctx, generated.UpdateDeviceLastSeenParams{
			ID:       existingDevice,
			LastSeen: pgtype.Timestamp{Time: time.Now(), Valid: true},
		})
		if err != nil {
			log.Printf("Failed to update device last_seen: %v", err)
		}
	} else {
		// Create new device
		_, err = ac.db.CreateDevice(ctx, generated.CreateDeviceParams{
			UserID:     user.ID,
			DeviceName: pgtype.Text{String: deviceName, Valid: true},
			DeviceType: pgtype.Text{String: deviceType, Valid: true},
			IpAddress:  pgtype.Text{String: clientIP, Valid: true},
			LastSeen:   pgtype.Timestamp{Time: time.Now(), Valid: true},
		})
		if err != nil {
			log.Printf("Failed to create device during login: %v", err)
			// non-critical
		}
	}

	// 6. Set cookies and respond
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("access_token", accessToken, 15*60, "/", "", true, true)        // 15 minutes
	c.SetCookie("refresh_token", refreshToken, 7*24*60*60, "/", "", true, true) // 7 days

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged in successfully",
		"user": LoginResponse{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
	})
}
