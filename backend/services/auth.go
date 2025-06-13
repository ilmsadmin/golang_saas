package services

import (
	"errors"

	"golang_saas/config"
	"golang_saas/models"
	"golang_saas/utils"

	"github.com/google/uuid"
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

type RegisterRequest struct {
	Email     string     `json:"email" validate:"required,email"`
	Password  string     `json:"password" validate:"required,min=8"`
	FirstName string     `json:"first_name" validate:"required"`
	LastName  string     `json:"last_name" validate:"required"`
	TenantID  *uuid.UUID `json:"tenant_id,omitempty"`
}

type AuthResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refresh_token"`
	User         *models.User `json:"user"`
	Permissions  []string     `json:"permissions"`
}

func (s *AuthService) Login(req LoginRequest, tenantID *uuid.UUID) (*AuthResponse, error) {
	var user models.User

	query := s.db.Preload("Role").Preload("Role.Permissions").Preload("Permissions").Where("email = ? AND is_active = ?", req.Email, true)

	if tenantID != nil {
		query = query.Where("tenant_id = ?", *tenantID)
	} else {
		// For system login, look for system users (no tenant)
		query = query.Where("tenant_id IS NULL")
	}

	err := query.First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	// Check password
	if !utils.CheckPasswordHash(req.Password, user.Password) {
		return nil, errors.New("invalid credentials")
	}

	// Get all permissions (role + direct permissions)
	rbacService := NewRBACService(s.db)
	permissions, err := rbacService.GetUserPermissions(user.ID)
	if err != nil {
		return nil, err
	}

	// Generate JWT tokens
	var tenantUUID uuid.UUID
	if user.TenantID != nil {
		tenantUUID = *user.TenantID
	}

	// Determine if system user (no tenant)
	isSystem := user.TenantID == nil

	token, err := utils.GenerateJWT(user.ID, tenantUUID, user.Role.Name, permissions, isSystem)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshJWT(user.ID, tenantUUID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         &user,
		Permissions:  permissions,
	}, nil
}

func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	// Check if user exists
	var existingUser models.User
	err := s.db.Where("email = ?", req.Email).First(&existingUser).Error
	if err == nil {
		return nil, errors.New("user already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Get default role based on tenant
	var defaultRole models.Role
	var roleName string
	if req.TenantID != nil {
		// Tenant user gets TENANT_USER role
		roleName = string(models.TenantRoleUser)
		err = s.db.Where("name = ? AND tenant_id = ?", roleName, *req.TenantID).First(&defaultRole).Error
	} else {
		// System user gets SYSTEM_SUPPORT role by default (lowest privilege)
		roleName = string(models.SystemRoleSupport)
		err = s.db.Where("name = ? AND tenant_id IS NULL", roleName).First(&defaultRole).Error
	}
	
	if err != nil {
		return nil, errors.New("default role not found")
	}

	// Create user
	user := models.User{
		Email:     req.Email,
		Password:  hashedPassword,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		IsActive:  true,
		TenantID:  req.TenantID,
		RoleID:    defaultRole.ID,
	}

	err = s.db.Create(&user).Error
	if err != nil {
		return nil, err
	}

	// Load relationships
	err = s.db.Preload("Role").Preload("Role.Permissions").Preload("Permissions").First(&user, user.ID).Error
	if err != nil {
		return nil, err
	}

	// Get all permissions
	rbacService := NewRBACService(s.db)
	permissions, err := rbacService.GetUserPermissions(user.ID)
	if err != nil {
		return nil, err
	}

	// Generate JWT tokens
	var tenantUUID uuid.UUID
	if user.TenantID != nil {
		tenantUUID = *user.TenantID
	}

	isSystem := user.TenantID == nil

	token, err := utils.GenerateJWT(user.ID, tenantUUID, user.Role.Name, permissions, isSystem)
	if err != nil {
		return nil, err
	}

	refreshToken, err := utils.GenerateRefreshJWT(user.ID, tenantUUID)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         &user,
		Permissions:  permissions,
	}, nil
}

func (s *AuthService) RefreshToken(refreshToken string) (*AuthResponse, error) {
	accessToken, newRefreshToken, err := utils.RefreshJWT(refreshToken)
	if err != nil {
		return nil, err
	}

	// Validate the new token to get user info
	claims, err := utils.ValidateJWT(accessToken)
	if err != nil {
		return nil, err
	}

	// Get user from database
	var user models.User
	userUUID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, err
	}

	err = s.db.Preload("Role").Preload("Role.Permissions").First(&user, "id = ?", userUUID).Error
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        accessToken,
		RefreshToken: newRefreshToken,
		User:         &user,
		Permissions:  claims.Permissions,
	}, nil
}
