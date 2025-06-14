package services

import (
	"context"
	"errors"
	"fmt"

	"golang_saas/graph/model"
	"golang_saas/models"
	"golang_saas/utils"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

// CreateUser creates a new user
func (s *UserService) CreateUser(ctx context.Context, input model.CreateUserInput) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	err := s.db.Where("email = ?", input.Email).First(&existingUser).Error
	if err == nil {
		return nil, errors.New("user with this email already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check existing user: %v", err)
	}

	// Get role
	roleUUID, err := uuid.Parse(input.RoleID)
	if err != nil {
		return nil, fmt.Errorf("invalid role ID: %v", err)
	}

	var role models.Role
	err = s.db.First(&role, "id = ?", roleUUID).Error
	if err != nil {
		return nil, errors.New("role not found")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	// Create user
	user := models.User{
		Email:     input.Email,
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Password:  hashedPassword,
		IsActive:  true,
		RoleID:    roleUUID,
		TenantID:  role.TenantID, // Inherit tenant from role
	}

	err = s.db.Create(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	// Load relationships
	err = s.db.Preload("Role").Preload("Role.Permissions").Preload("Permissions").Preload("Tenant").First(&user, user.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load user relationships: %v", err)
	}

	return &user, nil
}

// UpdateUser updates an existing user
func (s *UserService) UpdateUser(ctx context.Context, id string, input model.UpdateUserInput) (*models.User, error) {
	userUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	var user models.User
	err = s.db.First(&user, "id = ?", userUUID).Error
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	// Update fields
	if input.FirstName != nil {
		user.FirstName = *input.FirstName
	}
	if input.LastName != nil {
		user.LastName = *input.LastName
	}
	if input.IsActive != nil {
		user.IsActive = *input.IsActive
	}
	if input.RoleID != nil {
		roleUUID, err := uuid.Parse(*input.RoleID)
		if err != nil {
			return nil, fmt.Errorf("invalid role ID: %v", err)
		}
		
		// Validate role exists
		var role models.Role
		err = s.db.First(&role, "id = ?", roleUUID).Error
		if err != nil {
			return nil, errors.New("role not found")
		}

		user.RoleID = roleUUID
	}

	err = s.db.Save(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %v", err)
	}

	// Load relationships
	err = s.db.Preload("Role").Preload("Role.Permissions").Preload("Permissions").Preload("Tenant").First(&user, user.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load user relationships: %v", err)
	}

	return &user, nil
}

// DeleteUser soft deletes a user
func (s *UserService) DeleteUser(ctx context.Context, id string) (bool, error) {
	userUUID, err := uuid.Parse(id)
	if err != nil {
		return false, fmt.Errorf("invalid user ID: %v", err)
	}

	err = s.db.Delete(&models.User{}, "id = ?", userUUID).Error
	if err != nil {
		return false, fmt.Errorf("failed to delete user: %v", err)
	}

	return true, nil
}

// GetUser gets a user by ID
func (s *UserService) GetUser(ctx context.Context, id string) (*models.User, error) {
	userUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	var user models.User
	err = s.db.Preload("Role").Preload("Role.Permissions").Preload("Permissions").Preload("Tenant").First(&user, "id = ?", userUUID).Error
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	return &user, nil
}

// ListUsers lists users with filtering and pagination
func (s *UserService) ListUsers(ctx context.Context, filter *model.UserFilter, pagination *model.PaginationInput) (*model.PaginatedUsers, error) {
	query := s.db.Model(&models.User{})

	// Apply filters
	if filter != nil {
		if filter.Email != nil {
			query = query.Where("email ILIKE ?", "%"+*filter.Email+"%")
		}
		if filter.IsActive != nil {
			query = query.Where("is_active = ?", *filter.IsActive)
		}
		if filter.RoleID != nil {
			roleUUID, err := uuid.Parse(*filter.RoleID)
			if err != nil {
				return nil, fmt.Errorf("invalid role ID: %v", err)
			}
			query = query.Where("role_id = ?", roleUUID)
		}
		if filter.TenantID != nil {
			tenantUUID, err := uuid.Parse(*filter.TenantID)
			if err != nil {
				return nil, fmt.Errorf("invalid tenant ID: %v", err)
			}
			query = query.Where("tenant_id = ?", tenantUUID)
		}
	}

	// Count total
	var total int64
	err := query.Count(&total).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count users: %v", err)
	}

	// Apply pagination
	page := int32(1)
	limit := int32(10)
	if pagination != nil {
		if pagination.Page != nil {
			page = *pagination.Page
		}
		if pagination.Limit != nil {
			limit = *pagination.Limit
		}
	}

	offset := (page - 1) * limit
	query = query.Offset(int(offset)).Limit(int(limit))

	// Load users
	var users []models.User
	err = query.Preload("Role").Preload("Role.Permissions").Preload("Permissions").Preload("Tenant").Find(&users).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load users: %v", err)
	}

	// Convert to pointers
	var userPtrs []*models.User
	for i := range users {
		userPtrs = append(userPtrs, &users[i])
	}

	totalPages := int32((total + int64(limit) - 1) / int64(limit))

	return &model.PaginatedUsers{
		Users:      userPtrs,
		Total:      int32(total),
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// GetCurrentUser gets the current authenticated user from context
func (s *UserService) GetCurrentUser(ctx context.Context) (*models.User, error) {
	userID := ctx.Value("userID")
	if userID == nil {
		return nil, errors.New("user not authenticated")
	}

	userUUIDStr, ok := userID.(string)
	if !ok {
		return nil, errors.New("invalid user ID in context")
	}

	return s.GetUser(ctx, userUUIDStr)
}

// GetUserPermissions gets all permissions for a user
func (s *UserService) GetUserPermissions(ctx context.Context, userID string) ([]string, error) {
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	rbacService := NewRBACService(s.db)
	return rbacService.GetUserPermissions(userUUID)
}

// AssignRole assigns a role to a user
func (s *UserService) AssignRole(ctx context.Context, input model.AssignRoleInput) (*models.User, error) {
	userUUID, err := uuid.Parse(input.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	roleUUID, err := uuid.Parse(input.RoleID)
	if err != nil {
		return nil, fmt.Errorf("invalid role ID: %v", err)
	}

	rbacService := NewRBACService(s.db)
	err = rbacService.AssignRoleToUser(userUUID, roleUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to assign role: %v", err)
	}

	return s.GetUser(ctx, input.UserID)
}

// AssignPermissions assigns direct permissions to a user
func (s *UserService) AssignPermissions(ctx context.Context, input model.AssignPermissionInput) (*models.User, error) {
	userUUID, err := uuid.Parse(input.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	var user models.User
	err = s.db.First(&user, "id = ?", userUUID).Error
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	// Get permissions
	var permissionUUIDs []uuid.UUID
	for _, permID := range input.PermissionIds {
		permUUID, err := uuid.Parse(permID)
		if err != nil {
			return nil, fmt.Errorf("invalid permission ID %s: %v", permID, err)
		}
		permissionUUIDs = append(permissionUUIDs, permUUID)
	}

	var permissions []models.Permission
	err = s.db.Where("id IN ?", permissionUUIDs).Find(&permissions).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find permissions: %v", err)
	}

	if len(permissions) != len(permissionUUIDs) {
		return nil, errors.New("some permissions not found")
	}

	// Assign permissions
	err = s.db.Model(&user).Association("Permissions").Replace(permissions)
	if err != nil {
		return nil, fmt.Errorf("failed to assign permissions: %v", err)
	}

	return s.GetUser(ctx, input.UserID)
}

// RevokePermissions removes direct permissions from a user
func (s *UserService) RevokePermissions(ctx context.Context, input model.AssignPermissionInput) (*models.User, error) {
	userUUID, err := uuid.Parse(input.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	var user models.User
	err = s.db.First(&user, "id = ?", userUUID).Error
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	// Get permissions to revoke
	var permissionUUIDs []uuid.UUID
	for _, permID := range input.PermissionIds {
		permUUID, err := uuid.Parse(permID)
		if err != nil {
			return nil, fmt.Errorf("invalid permission ID %s: %v", permID, err)
		}
		permissionUUIDs = append(permissionUUIDs, permUUID)
	}

	var permissions []models.Permission
	err = s.db.Where("id IN ?", permissionUUIDs).Find(&permissions).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find permissions: %v", err)
	}

	// Remove permissions
	err = s.db.Model(&user).Association("Permissions").Delete(permissions)
	if err != nil {
		return nil, fmt.Errorf("failed to revoke permissions: %v", err)
	}

	return s.GetUser(ctx, input.UserID)
}