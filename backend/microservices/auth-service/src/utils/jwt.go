package jwt

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Load secret from environment (recommended)
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

const (
	AccessTokenDuration  = 15 * time.Minute
	RefreshTokenDuration = 7 * 24 * time.Hour
)

type Claims struct {
	UserID pgtype.UUID `json:"user_id"`
	Email  string      `json:"email"`
	Type   string      `json:"type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

func init() {
	if len(jwtSecret) == 0 {
		// Fallback for local dev — NEVER use this in production!
		jwtSecret = []byte("dev-secret-change-me-in-production")
	}
}

// GenerateAccessToken creates a short-lived access token
func GenerateAccessToken(userID pgtype.UUID, email string) (string, error) {
	return generateToken(userID, email, "access", AccessTokenDuration)
}

// GenerateRefreshToken creates a long-lived refresh token
func GenerateRefreshToken(userID pgtype.UUID, email string) (string, error) {
	return generateToken(userID, email, "refresh", RefreshTokenDuration)
}

func generateToken(userID pgtype.UUID, email, tokenType string, duration time.Duration) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Type:   tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "auth-service",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ValidateToken parses and validates a JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
