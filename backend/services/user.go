package services

import (
	"errors"

	"golang_saas/config"
	"golang_saas/models"
	"golang_saas/utils"

	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService() *UserService {
	return &UserService{
		db: config.DB,
	}
}

type CreateUserRequest struct {
	Email         string `json:"email" validate:"required,email"`
	Password      string `json:"password" validate:"required,min=8"`
	FirstName     string `json:"first_name" validate:"required"`
	LastName      string `json:"last_name" validate:"required"`
	RoleID        uint   `json:"role_id" validate:"required"`
	Phone         string `json:"phone"`
	SendInvitation bool  `json:"send_invitation"`
}

type UpdateUserRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	RoleID    uint   `json:"role_id"`
}

func (s *UserService) GetUsers(tenantID uint, page, limit int, roleFilter, statusFilter, search string) ([]models.User, int64, error) {
	tenantDB := config.GetTenantDB(tenantID)
	
	var users []models.User
	var total int64

	query := tenantDB.Model(&models.User{}).Preload("Role")

	// Apply filters
	if roleFilter != "" {
		query = query.Joins("JOIN roles ON users.role_id = roles.id").Where("roles.name = ?", roleFilter)
	}
	if statusFilter != "" {
		if statusFilter == "active" {
			query = query.Where("is_active = ?", true)
		} else if statusFilter == "inactive" {
			query = query.Where("is_active = ?", false)
		}
	}
	if search != "" {
		query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?", 
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (s *UserService) GetUser(tenantID, userID uint) (*models.User, error) {
	tenantDB := config.GetTenantDB(tenantID)
	
	var user models.User
	err := tenantDB.Preload("Role").First(&user, userID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (s *UserService) CreateUser(tenantID uint, req CreateUserRequest) (*models.User, error) {
	tenantDB := config.GetTenantDB(tenantID)

	// Check if email already exists
	var existingUser models.User
	if err := tenantDB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("email already exists")
	}

	// Check if role exists
	var role models.Role
	if err := tenantDB.First(&role, req.RoleID).Error; err != nil {
		return nil, errors.New("role not found")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := models.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		RoleID:       req.RoleID,
		IsActive:     true,
	}

	if err := tenantDB.Create(&user).Error; err != nil {
		return nil, err
	}

	// Load user with role
	tenantDB.Preload("Role").First(&user, user.ID)

	// TODO: Send invitation email if requested
	if req.SendInvitation {
		// Implement email sending logic
	}

	return &user, nil
}

func (s *UserService) UpdateUser(tenantID, userID uint, req UpdateUserRequest) (*models.User, error) {
	tenantDB := config.GetTenantDB(tenantID)

	var user models.User
	if err := tenantDB.First(&user, userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	// Check if role exists (if being updated)
	if req.RoleID != 0 {
		var role models.Role
		if err := tenantDB.First(&role, req.RoleID).Error; err != nil {
			return nil, errors.New("role not found")
		}
	}

	// Update user
	updates := map[string]interface{}{}
	if req.FirstName != "" {
		updates["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		updates["last_name"] = req.LastName
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.RoleID != 0 {
		updates["role_id"] = req.RoleID
	}

	if err := tenantDB.Model(&user).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Reload user with role
	tenantDB.Preload("Role").First(&user, userID)
	return &user, nil
}

func (s *UserService) ActivateUser(tenantID, userID uint) error {
	return s.updateUserStatus(tenantID, userID, true)
}

func (s *UserService) DeactivateUser(tenantID, userID uint) error {
	return s.updateUserStatus(tenantID, userID, false)
}

func (s *UserService) DeleteUser(tenantID, userID uint) error {
	tenantDB := config.GetTenantDB(tenantID)

	var user models.User
	if err := tenantDB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	// Soft delete user
	if err := tenantDB.Delete(&user).Error; err != nil {
		return err
	}

	return nil
}

func (s *UserService) ChangePassword(tenantID, userID uint, oldPassword, newPassword string) error {
	tenantDB := config.GetTenantDB(tenantID)

	var user models.User
	if err := tenantDB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	// Verify old password
	if !utils.CheckPasswordHash(oldPassword, user.PasswordHash) {
		return errors.New("invalid current password")
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Update password
	user.PasswordHash = hashedPassword
	if err := tenantDB.Save(&user).Error; err != nil {
		return err
	}

	return nil
}

func (s *UserService) updateUserStatus(tenantID, userID uint, isActive bool) error {
	tenantDB := config.GetTenantDB(tenantID)

	var user models.User
	if err := tenantDB.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	user.IsActive = isActive
	if err := tenantDB.Save(&user).Error; err != nil {
		return err
	}

	return nil
}