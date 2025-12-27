package auth

import (
	"database/sql"
	"fmt"
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

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type RegisterResponse struct {
	ID        pgtype.UUID      `json:"id"`
	Email     string           `json:"email"`
	CreatedAt pgtype.Timestamp `json:"created_at"`
}

func (rc *AuthController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ctx := c.Request.Context()

	// 1. Check if email already exists
	_, err := rc.db.FindUserByEmail(ctx, req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}
	// 2. Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server error"})
		return
	}

	// 3. Create user
	user, err := rc.db.CreateUser(ctx, generated.CreateUserParams{
		Email:           req.Email,
		PasswordHash:    pgtype.Text{String: string(hash), Valid: true},
		OauthProvider:   pgtype.Text{Valid: false},
		OauthProviderID: pgtype.Text{Valid: false},
		MfaEnabled:      pgtype.Bool{Bool: false, Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// -------------------------------------------------
	// 4. Ensure default "user" role exists and assign it
	// -------------------------------------------------
	var roleID pgtype.UUID

	role, err := rc.db.FindRoleByName(ctx, "user")

	if err == sql.ErrNoRows {
		// Create the default role
		newRole, err := rc.db.CreateRole(ctx, generated.CreateRoleParams{
			Name:        "user",
			Description: pgtype.Text{String: "Default user role", Valid: true},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create default role"})
			return
		}
		roleID = newRole.ID
	} else {
		roleID = role.ID
	}

	// Assign role to user
	_, err = rc.db.CreateUserRole(ctx, generated.CreateUserRoleParams{
		UserID: user.ID,
		RoleID: roleID,
	})
	if err != nil {
		// Non-critical – we still continue, but you might want to log this
		// c.JSON(http.StatusInternalServerError, ...)
	}

	// -------------------------------------------------
	// 5. Generate tokens (auto-login)
	// -------------------------------------------------
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

	// Store refresh token in sessions table
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	_, err = rc.db.CreateSession(ctx, generated.CreateSessionParams{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    pgtype.Timestamp{Time: expiresAt, Valid: true},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store session"})
		return
	}

	// -------------------------------------------------
	// 6. Register current device
	// -------------------------------------------------
	clientIP := c.ClientIP() // or use c.RemoteIP() / X-Forwarded-For if behind proxy
	rawUserAgent := c.Request.UserAgent()

	agent := ua.New(rawUserAgent)

	isMobile := agent.Mobile()

	var deviceType string
	if isMobile {
		deviceType = "mobile"
	} else {
		deviceType = "desktop"
	}

	// Build a nice human-readable device name: "OS + Browser"
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

	// Optional: fallback for very old/bots
	if deviceName == "Unknown Device" && strings.Contains(strings.ToLower(rawUserAgent), "bot") {
		deviceName = "Bot/Crawler"
	}

	_, err = rc.db.CreateDevice(ctx, generated.CreateDeviceParams{
		UserID:     user.ID,
		DeviceName: pgtype.Text{String: deviceName, Valid: true},
		DeviceType: pgtype.Text{String: deviceType, Valid: true},
		IpAddress:  pgtype.Text{String: clientIP, Valid: true},
		LastSeen:   pgtype.Timestamp{Time: time.Now(), Valid: true},
	})
	if err != nil {
		// Non-critical – log in production, continue
	}

	// -------------------------------------------------
	// 7. Set cookies and respond (same as login)
	// -------------------------------------------------
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie("access_token", accessToken, 15*60, "/", "", true, true)        // 15 min
	c.SetCookie("refresh_token", refreshToken, 7*24*60*60, "/", "", true, true) // 7 days

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered and logged in successfully",
		"user": RegisterResponse{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
	})
}
