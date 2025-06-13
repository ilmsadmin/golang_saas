package services

import (
	"errors"
	"time"

	"golang_saas/config"
	"golang_saas/models"
	"golang_saas/utils"

	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService() *AuthService {
	return &AuthService{
		db: config.DB,
	}
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token        string      `json:"token"`
	RefreshToken string      `json:"refresh_token"`
	User         interface{} `json:"user"`
	Permissions  []string    `json:"permissions"`
}

func (s *AuthService) SystemLogin(req LoginRequest) (*LoginResponse, error) {
	var user models.SystemUser
	err := s.db.Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	// Check password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	// Update last login
	user.LastLoginAt = &time.Time{}
	*user.LastLoginAt = time.Now()
	s.db.Save(&user)

	// Generate permissions based on role
	permissions := s.getSystemPermissions(user.Role)

	// Generate JWT tokens
	token, err := utils.GenerateJWT(user.ID, 0, user.Role, permissions, true)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshJWT(user.ID, 0)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
		Permissions:  permissions,
	}, nil
}

func (s *AuthService) TenantLogin(req LoginRequest, tenantID uint) (*LoginResponse, error) {
	tenantDB := config.GetTenantDB(tenantID)
	
	var user models.User
	err := tenantDB.Where("email = ? AND is_active = ?", req.Email, true).
		Preload("Role").
		First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	// Check password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	// Update last login
	user.LastLoginAt = &time.Time{}
	*user.LastLoginAt = time.Now()
	tenantDB.Save(&user)

	// Get user permissions
	permissions := user.GetPermissions()

	// Generate JWT tokens
	token, err := utils.GenerateJWT(user.ID, tenantID, user.Role.Name, permissions, false)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshJWT(user.ID, tenantID)
	if err != nil {
		return nil, err
	}

	// Create user session
	session := models.UserSession{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(config.AppConfig.JWTRefreshExpireHours) * time.Hour),
	}
	tenantDB.Create(&session)

	return &LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
		Permissions:  permissions,
	}, nil
}

func (s *AuthService) RefreshToken(refreshToken string) (*LoginResponse, error) {
	claims, err := utils.ValidateJWT(refreshToken)
	if err != nil {
		return nil, err
	}

	if claims.IsSystem {
		// System user refresh
		var user models.SystemUser
		err := s.db.Where("id = ? AND is_active = ?", claims.UserID, true).First(&user).Error
		if err != nil {
			return nil, errors.New("user not found")
		}

		permissions := s.getSystemPermissions(user.Role)
		
		token, err := utils.GenerateJWT(user.ID, 0, user.Role, permissions, true)
		if err != nil {
			return nil, err
		}

		newRefreshToken, err := utils.GenerateRefreshJWT(user.ID, 0)
		if err != nil {
			return nil, err
		}

		return &LoginResponse{
			Token:        token,
			RefreshToken: newRefreshToken,
			User:         user,
			Permissions:  permissions,
		}, nil
	} else {
		// Tenant user refresh
		tenantDB := config.GetTenantDB(claims.TenantID)
		
		// Check if refresh token exists and is valid
		var session models.UserSession
		err := tenantDB.Where("refresh_token = ? AND expires_at > ? AND revoked_at IS NULL", 
			refreshToken, time.Now()).First(&session).Error
		if err != nil {
			return nil, errors.New("invalid refresh token")
		}

		var user models.User
		err = tenantDB.Where("id = ? AND is_active = ?", claims.UserID, true).
			Preload("Role").
			First(&user).Error
		if err != nil {
			return nil, errors.New("user not found")
		}

		permissions := user.GetPermissions()
		
		token, err := utils.GenerateJWT(user.ID, claims.TenantID, user.Role.Name, permissions, false)
		if err != nil {
			return nil, err
		}

		newRefreshToken, err := utils.GenerateRefreshJWT(user.ID, claims.TenantID)
		if err != nil {
			return nil, err
		}

		// Update session
		session.RefreshToken = newRefreshToken
		session.ExpiresAt = time.Now().Add(time.Duration(config.AppConfig.JWTRefreshExpireHours) * time.Hour)
		tenantDB.Save(&session)

		return &LoginResponse{
			Token:        token,
			RefreshToken: newRefreshToken,
			User:         user,
			Permissions:  permissions,
		}, nil
	}
}

func (s *AuthService) Logout(refreshToken string) error {
	claims, err := utils.ValidateJWT(refreshToken)
	if err != nil {
		return err
	}

	if !claims.IsSystem {
		// Revoke tenant user session
		tenantDB := config.GetTenantDB(claims.TenantID)
		now := time.Now()
		tenantDB.Model(&models.UserSession{}).
			Where("refresh_token = ?", refreshToken).
			Update("revoked_at", &now)
	}

	return nil
}

func (s *AuthService) getSystemPermissions(role string) []string {
	switch role {
	case "super_admin":
		return []string{"*:*"}
	case "super_manager":
		return []string{
			"tenants:*",
			"plans:*",
			"modules:*",
			"system:read",
		}
	default:
		return []string{}
	}
}