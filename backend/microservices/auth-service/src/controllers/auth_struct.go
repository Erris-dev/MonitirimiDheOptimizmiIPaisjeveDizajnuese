package auth

import generated "auth-service/src/db/generated"

type AuthController struct {
	db *generated.Queries
}

func NewAuthController(db *generated.Queries) *AuthController {
	return &AuthController{db: db}
}
