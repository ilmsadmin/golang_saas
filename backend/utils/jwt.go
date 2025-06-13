package utils

import (
	"errors"
	"time"

	"golang_saas/config"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

type Claims struct {
	UserID      string   `json:"user_id"`   // UUID as string
	TenantID    string   `json:"tenant_id"` // UUID as string
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	IsSystem    bool     `json:"is_system"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID, tenantID uuid.UUID, role string, permissions []string, isSystem bool) (string, error) {
	expirationTime := time.Now().Add(time.Duration(config.AppConfig.JWTExpireHours) * time.Hour)

	var tenantIDStr string
	if tenantID != uuid.Nil {
		tenantIDStr = tenantID.String()
	}

	claims := &Claims{
		UserID:      userID.String(),
		TenantID:    tenantIDStr,
		Role:        role,
		Permissions: permissions,
		IsSystem:    isSystem,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    config.AppConfig.AppName,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

func GenerateRefreshJWT(userID, tenantID uuid.UUID) (string, error) {
	expirationTime := time.Now().Add(time.Duration(config.AppConfig.JWTRefreshExpireHours) * time.Hour)

	var tenantIDStr string
	if tenantID != uuid.Nil {
		tenantIDStr = tenantID.String()
	}

	claims := &Claims{
		UserID:   userID.String(),
		TenantID: tenantIDStr,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    config.AppConfig.AppName,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

func ValidateJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func RefreshJWT(refreshToken string) (string, string, error) {
	claims, err := ValidateJWT(refreshToken)
	if err != nil {
		return "", "", err
	}

	// Parse UUIDs from claims
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return "", "", errors.New("invalid user ID in token")
	}

	var tenantID uuid.UUID
	if claims.TenantID != "" {
		tenantID, err = uuid.Parse(claims.TenantID)
		if err != nil {
			return "", "", errors.New("invalid tenant ID in token")
		}
	}

	// Generate new access token
	accessToken, err := GenerateJWT(userID, tenantID, claims.Role, claims.Permissions, claims.IsSystem)
	if err != nil {
		return "", "", err
	}

	// Generate new refresh token
	newRefreshToken, err := GenerateRefreshJWT(userID, tenantID)
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}
