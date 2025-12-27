package auth

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	ua "github.com/mssola/user_agent"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"auth-service/src/config"
	generated "auth-service/src/db/generated"
	jwt "auth-service/src/utils"
)

var googleOauthConfig *oauth2.Config

// Initialize once at startup
func InitGoogleOAuth() {
	cfg := config.LoadGoogleConfig()
	googleOauthConfig = &oauth2.Config{
		RedirectURL:  cfg.RedirectURL,
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
	log.Println("[InitGoogleOAuth] Google OAuth Config initialized")
}

// Generate random state for CSRF
func randToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

// GET /auth/google/login
func (ac *AuthController) GoogleLogin(c *gin.Context) {
	state := randToken()
	log.Println("[GoogleLogin] Generated state:", state)

	c.SetCookie("oauth_state", state, 3600, "/", "", false, true)

	url := googleOauthConfig.AuthCodeURL(state)
	log.Println("[GoogleLogin] Redirecting to Google OAuth URL:", url)

	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GET /auth/google/callback
func (ac *AuthController) GoogleCallback(c *gin.Context) {
	ctx := c.Request.Context()
	log.Println("[GoogleCallback] Callback hit")

	if googleOauthConfig == nil {
		log.Fatal("[GoogleCallback] Google OAuth config not initialized")
	}

	// 1. STATE VALIDATION (CSRF)
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil {
		log.Println("[GoogleCallback] Missing state cookie:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing OAuth state"})
		return
	}

	stateQuery := c.Query("state")
	if stateQuery == "" || stateQuery != stateCookie {
		log.Println("[GoogleCallback] State mismatch. Cookie:", stateCookie, "Query:", stateQuery)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OAuth state"})
		return
	}

	log.Println("[GoogleCallback] State validated")
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	// 2. AUTHORIZATION CODE
	code := c.Query("code")
	if code == "" {
		log.Println("[GoogleCallback] No code in callback")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No code in callback"})
		return
	}

	log.Println("[GoogleCallback] Received code:", code)

	// 3. TOKEN EXCHANGE
	token, err := googleOauthConfig.Exchange(ctx, code)
	if err != nil {
		log.Println("[GoogleCallback] Token exchange failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
		return
	}

	log.Println("[GoogleCallback] Token exchange successful")

	// 4. FETCH GOOGLE USER
	client := googleOauthConfig.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil || resp.StatusCode != http.StatusOK {
		log.Println("[GoogleCallback] Failed to fetch user info:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		log.Println("[GoogleCallback] Failed to parse user info:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user info"})
		return
	}

	log.Println("[GoogleCallback] Parsed user info:", googleUser.Email)

	if !googleUser.VerifiedEmail {
		log.Println("[GoogleCallback] Unverified email:", googleUser.Email)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unverified Google email"})
		return
	}

	// 5. FIND OR CREATE USER – FIXED FOR pgx
	user, err := ac.db.FindUserByOauthProvider(ctx, generated.FindUserByOauthProviderParams{
		OauthProvider:   pgtype.Text{String: "google", Valid: true},
		OauthProviderID: pgtype.Text{String: googleUser.ID, Valid: true},
	})

	if errors.Is(err, pgx.ErrNoRows) {
		// First-time login → CREATE NEW USER
		log.Println("[GoogleCallback] No user found. Creating new user:", googleUser.Email)

		user, err = ac.db.CreateUser(ctx, generated.CreateUserParams{
			Email:           googleUser.Email,
			PasswordHash:    pgtype.Text{Valid: false},
			OauthProvider:   pgtype.Text{String: "google", Valid: true},
			OauthProviderID: pgtype.Text{String: googleUser.ID, Valid: true},
			MfaEnabled:      pgtype.Bool{Bool: false, Valid: true},
		})

		if err != nil {
			log.Println("[GoogleCallback] Failed to create user:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		log.Println("[GoogleCallback] User created with ID:", user.ID)

		// ROLE ASSIGNMENT – ALSO FIXED FOR pgx
		var roleID pgtype.UUID

		role, err := ac.db.FindRoleByName(ctx, "user")
		if errors.Is(err, pgx.ErrNoRows) {
			// Default role doesn't exist → create it
			newRole, err := ac.db.CreateRole(ctx, generated.CreateRoleParams{
				Name:        "user",
				Description: pgtype.Text{String: "Default user role", Valid: true},
			})
			if err != nil {
				log.Println("[GoogleCallback] Failed to create default role:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create default role"})
				return
			}
			roleID = newRole.ID
			log.Println("[GoogleCallback] Default role created with ID:", roleID)
		} else if err != nil {
			log.Println("[GoogleCallback] Role lookup failed:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Role lookup failed"})
			return
		} else {
			roleID = role.ID
		}

		_, err = ac.db.CreateUserRole(ctx, generated.CreateUserRoleParams{
			UserID: user.ID,
			RoleID: roleID,
		})
		if err != nil {
			log.Println("[GoogleCallback] Failed to assign role:", err)
			// Not fatal
		} else {
			log.Println("[GoogleCallback] Role 'user' assigned successfully")
		}

	} else if err != nil {
		// Real database error (not just "no rows")
		log.Println("[GoogleCallback] Database error during user lookup:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error during user lookup"})
		return
	} else {
		// User already exists → just log in
		log.Println("[GoogleCallback] Found existing user:", user.Email)
	}

	// 6. JWT GENERATION
	accessToken, err := jwt.GenerateAccessToken(user.ID, user.Email)
	if err != nil {
		log.Println("[GoogleCallback] Failed to generate access token:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken, err := jwt.GenerateRefreshToken(user.ID, user.Email)
	if err != nil {
		log.Println("[GoogleCallback] Failed to generate refresh token:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	log.Println("[GoogleCallback] JWTs generated")

	// 7. SESSION STORAGE
	expiresAt := time.Now().Add(7 * 24 * time.Hour)
	_, err = ac.db.CreateSession(ctx, generated.CreateSessionParams{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    pgtype.Timestamp{Time: expiresAt, Valid: true},
	})
	if err != nil {
		log.Println("[GoogleCallback] Failed to store session:", err)
	}

	// 8. DEVICE TRACKING
	clientIP := c.ClientIP()
	rawUserAgent := c.Request.UserAgent()

	agent := ua.New(rawUserAgent)
	deviceType := "desktop"
	if agent.Mobile() {
		deviceType = "mobile"
	}

	osInfo := strings.TrimSpace(agent.OS())
	browserName, browserVersion := agent.Browser()

	deviceName := "Unknown Device"
	if osInfo != "" && browserName != "" {
		deviceName = fmt.Sprintf("%s – %s %s", osInfo, browserName, browserVersion)
	}

	existingDevice, err := ac.db.FindDeviceByUserAndIP(ctx, generated.FindDeviceByUserAndIPParams{
		UserID:    user.ID,
		IpAddress: pgtype.Text{String: clientIP, Valid: true},
	})

	if errors.Is(err, pgx.ErrNoRows) {
		// No device yet → create one
		_, err = ac.db.CreateDevice(ctx, generated.CreateDeviceParams{
			UserID:     user.ID,
			DeviceName: pgtype.Text{String: deviceName, Valid: true},
			DeviceType: pgtype.Text{String: deviceType, Valid: true},
			IpAddress:  pgtype.Text{String: clientIP, Valid: true},
			LastSeen:   pgtype.Timestamp{Time: time.Now(), Valid: true},
		})
		if err != nil {
			log.Println("[GoogleCallback] Failed to create device:", err)
		}
	} else if err != nil {
		log.Println("[GoogleCallback] Device lookup failed:", err)
	} else if existingDevice.Valid {
		// Update last seen
		err = ac.db.UpdateDeviceLastSeen(ctx, generated.UpdateDeviceLastSeenParams{
			ID:       existingDevice,
			LastSeen: pgtype.Timestamp{Time: time.Now(), Valid: true},
		})
		if err != nil {
			log.Println("[GoogleCallback] Failed to update device last seen:", err)
		}
	}

	// 9. COOKIES + RESPONSE
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("access_token", accessToken, 15*60, "/", "", false, true)        // 15 minutes
	c.SetCookie("refresh_token", refreshToken, 7*24*60*60, "/", "", false, true) // 7 days

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged in with Google successfully",
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"name":       googleUser.Name,
			"picture":    googleUser.Picture,
			"created_at": user.CreatedAt,
		},
	})
}
