package utils

import (
	"errors"
	"time"

	"golang_saas/config"

	"github.com/golang-jwt/jwt/v4"
)

type Claims struct {
	UserID      uint     `json:"user_id"`
	TenantID    uint     `json:"tenant_id"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	IsSystem    bool     `json:"is_system"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID, tenantID uint, role string, permissions []string, isSystem bool) (string, error) {
	expirationTime := time.Now().Add(time.Duration(config.AppConfig.JWTExpireHours) * time.Hour)
	
	claims := &Claims{
		UserID:      userID,
		TenantID:    tenantID,
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

func GenerateRefreshJWT(userID, tenantID uint) (string, error) {
	expirationTime := time.Now().Add(time.Duration(config.AppConfig.JWTRefreshExpireHours) * time.Hour)
	
	claims := &Claims{
		UserID:   userID,
		TenantID: tenantID,
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

	// Generate new access token
	accessToken, err := GenerateJWT(claims.UserID, claims.TenantID, claims.Role, claims.Permissions, claims.IsSystem)
	if err != nil {
		return "", "", err
	}

	// Generate new refresh token
	newRefreshToken, err := GenerateRefreshJWT(claims.UserID, claims.TenantID)
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}