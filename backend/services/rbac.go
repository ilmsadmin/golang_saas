package services

import (
	"errors"
	"fmt"
	"golang_saas/models"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RBACService struct {
	db *gorm.DB
}

func NewRBACService(db *gorm.DB) *RBACService {
	return &RBACService{db: db}
}

// InitializeSystemRoles creates default system roles and permissions
func (s *RBACService) InitializeSystemRoles() error {
	// Create system permissions
	systemPermissions := models.GetSystemPermissions()
	for _, sysPerm := range systemPermissions {
		var existingPerm models.Permission
		err := s.db.Where("name = ?", sysPerm.Name).First(&existingPerm).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new permission
			perm := models.Permission{
				Name:               sysPerm.Name,
				Resource:           string(sysPerm.Resource),
				Action:             string(sysPerm.Action),
				Description:        &sysPerm.Description,
				IsSystemPermission: sysPerm.IsSystem,
			}
			if err := s.db.Create(&perm).Error; err != nil {
				return fmt.Errorf("failed to create permission %s: %w", sysPerm.Name, err)
			}
		}
	}

	// Create system roles with permissions
	rolePermissions := models.GetRolePermissions()
	for _, rp := range rolePermissions {
		var existingRole models.Role
		err := s.db.Where("name = ? AND tenant_id IS NULL", string(rp.Role)).First(&existingRole).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new role
			desc := s.getRoleDescription(rp.Role)
			role := models.Role{
				Name:         string(rp.Role),
				Description:  &desc,
				IsSystemRole: s.isSystemRole(rp.Role),
				TenantID:     nil, // System role
			}
			if err := s.db.Create(&role).Error; err != nil {
				return fmt.Errorf("failed to create role %s: %w", rp.Role, err)
			}

			// Assign permissions to role
			if err := s.AssignPermissionsToRole(role.ID, rp.Permissions); err != nil {
				return fmt.Errorf("failed to assign permissions to role %s: %w", rp.Role, err)
			}
		}
	}

	return nil
}

// InitializeTenantRoles creates default tenant roles for a specific tenant
func (s *RBACService) InitializeTenantRoles(tenantID uuid.UUID) error {
	tenantRoles := []models.SystemRole{
		models.TenantRoleAdmin,
		models.TenantRoleManager,
		models.TenantRoleUser,
		models.TenantRoleCustomer,
	}

	rolePermissions := models.GetRolePermissions()

	for _, role := range tenantRoles {
		var existingRole models.Role
		err := s.db.Where("name = ? AND tenant_id = ?", string(role), tenantID).First(&existingRole).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create tenant role
			desc := s.getRoleDescription(role)
			newRole := models.Role{
				Name:         string(role),
				Description:  &desc,
				IsSystemRole: false,
				TenantID:     &tenantID,
			}
			if err := s.db.Create(&newRole).Error; err != nil {
				return fmt.Errorf("failed to create tenant role %s: %w", role, err)
			}

			// Find permissions for this role
			for _, rp := range rolePermissions {
				if rp.Role == role {
					if err := s.AssignPermissionsToRole(newRole.ID, rp.Permissions); err != nil {
						return fmt.Errorf("failed to assign permissions to tenant role %s: %w", role, err)
					}
					break
				}
			}
		}
	}

	return nil
}

// AssignPermissionsToRole assigns permissions to a role
func (s *RBACService) AssignPermissionsToRole(roleID uuid.UUID, permissionNames []string) error {
	var permissions []models.Permission
	if err := s.db.Where("name IN ?", permissionNames).Find(&permissions).Error; err != nil {
		return fmt.Errorf("failed to find permissions: %w", err)
	}

	var role models.Role
	if err := s.db.First(&role, "id = ?", roleID).Error; err != nil {
		return fmt.Errorf("failed to find role: %w", err)
	}

	// Clear existing permissions
	if err := s.db.Model(&role).Association("Permissions").Clear(); err != nil {
		return fmt.Errorf("failed to clear existing permissions: %w", err)
	}

	// Assign new permissions
	if err := s.db.Model(&role).Association("Permissions").Replace(permissions); err != nil {
		return fmt.Errorf("failed to assign permissions: %w", err)
	}

	return nil
}

// CheckUserPermission checks if a user has a specific permission
func (s *RBACService) CheckUserPermission(userID uuid.UUID, permission string, tenantID *uuid.UUID) (bool, error) {
	var user models.User
	err := s.db.Preload("Role").Preload("Role.Permissions").Preload("Permissions").First(&user, "id = ?", userID).Error
	if err != nil {
		return false, fmt.Errorf("failed to find user: %w", err)
	}

	// Check if user has permission through role
	for _, perm := range user.Role.Permissions {
		if perm.Name == permission {
			// If it's a system permission, check if user is system admin
			if perm.IsSystemPermission && user.TenantID == nil {
				return true, nil
			}
			// If it's a tenant permission, check if user belongs to the tenant
			if !perm.IsSystemPermission && user.TenantID != nil && tenantID != nil && *user.TenantID == *tenantID {
				return true, nil
			}
		}
	}

	// Check if user has direct permission assignment
	for _, perm := range user.Permissions {
		if perm.Name == permission {
			if perm.IsSystemPermission && user.TenantID == nil {
				return true, nil
			}
			if !perm.IsSystemPermission && user.TenantID != nil && tenantID != nil && *user.TenantID == *tenantID {
				return true, nil
			}
		}
	}

	return false, nil
}

// GetUserPermissions returns all permissions for a user
func (s *RBACService) GetUserPermissions(userID uuid.UUID) ([]string, error) {
	var user models.User
	err := s.db.Preload("Role").Preload("Role.Permissions").Preload("Permissions").First(&user, "id = ?", userID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	permissionSet := make(map[string]bool)

	// Add role permissions
	for _, perm := range user.Role.Permissions {
		permissionSet[perm.Name] = true
	}

	// Add direct permissions
	for _, perm := range user.Permissions {
		permissionSet[perm.Name] = true
	}

	// Convert to slice
	permissions := make([]string, 0, len(permissionSet))
	for perm := range permissionSet {
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// CreateCustomRole creates a new custom role for a tenant
func (s *RBACService) CreateCustomRole(tenantID *uuid.UUID, name, description string, permissionNames []string) (*models.Role, error) {
	// Validate permissions exist
	var permissions []models.Permission
	if err := s.db.Where("name IN ?", permissionNames).Find(&permissions).Error; err != nil {
		return nil, fmt.Errorf("failed to find permissions: %w", err)
	}

	if len(permissions) != len(permissionNames) {
		return nil, errors.New("some permissions not found")
	}

	// Create role
	role := models.Role{
		Name:         name,
		Description:  &description,
		IsSystemRole: false,
		TenantID:     tenantID,
	}

	if err := s.db.Create(&role).Error; err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}

	// Assign permissions
	if err := s.db.Model(&role).Association("Permissions").Replace(permissions); err != nil {
		return nil, fmt.Errorf("failed to assign permissions: %w", err)
	}

	return &role, nil
}

// AssignRoleToUser assigns a role to a user
func (s *RBACService) AssignRoleToUser(userID, roleID uuid.UUID) error {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to find user: %w", err)
	}

	var role models.Role
	if err := s.db.First(&role, "id = ?", roleID).Error; err != nil {
		return fmt.Errorf("failed to find role: %w", err)
	}

	// Validate tenant assignment
	if user.TenantID != nil && role.TenantID != nil && *user.TenantID != *role.TenantID {
		return errors.New("cannot assign role from different tenant")
	}

	if user.TenantID == nil && role.TenantID != nil {
		return errors.New("cannot assign tenant role to system user")
	}

	if user.TenantID != nil && role.TenantID == nil && !role.IsSystemRole {
		return errors.New("cannot assign non-system role to tenant user")
	}

	// Update user role
	user.RoleID = roleID
	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}

	return nil
}

// GetRolesByTenant returns all roles for a specific tenant
func (s *RBACService) GetRolesByTenant(tenantID *uuid.UUID) ([]models.Role, error) {
	var roles []models.Role
	query := s.db.Preload("Permissions")

	if tenantID == nil {
		// System roles
		query = query.Where("tenant_id IS NULL")
	} else {
		// Tenant roles
		query = query.Where("tenant_id = ?", *tenantID)
	}

	if err := query.Find(&roles).Error; err != nil {
		return nil, fmt.Errorf("failed to find roles: %w", err)
	}

	return roles, nil
}

// Helper functions
func (s *RBACService) isSystemRole(role models.SystemRole) bool {
	systemRoles := []models.SystemRole{
		models.SystemRoleSuperAdmin,
		models.SystemRoleAdmin,
		models.SystemRoleManager,
		models.SystemRoleSupport,
	}

	for _, sysRole := range systemRoles {
		if role == sysRole {
			return true
		}
	}
	return false
}

func (s *RBACService) getRoleDescription(role models.SystemRole) string {
	descriptions := map[models.SystemRole]string{
		models.SystemRoleSuperAdmin: "Super Administrator with full system access",
		models.SystemRoleAdmin:      "System Administrator with broad system management capabilities",
		models.SystemRoleManager:    "System Manager with limited system access",
		models.SystemRoleSupport:    "System Support with read-only access for customer support",
		models.TenantRoleAdmin:      "Tenant Administrator with full tenant management capabilities",
		models.TenantRoleManager:    "Tenant Manager with limited tenant management access",
		models.TenantRoleUser:       "Regular tenant user with basic access",
		models.TenantRoleCustomer:   "End customer with minimal access",
	}

	return descriptions[role]
}

// Permission validation helpers
func (s *RBACService) ValidateSystemPermission(permission string) bool {
	systemPermissions := models.GetSystemPermissions()
	for _, perm := range systemPermissions {
		if perm.Name == permission && perm.IsSystem {
			return true
		}
	}
	return false
}

func (s *RBACService) ValidateTenantPermission(permission string) bool {
	systemPermissions := models.GetSystemPermissions()
	for _, perm := range systemPermissions {
		if perm.Name == permission && !perm.IsSystem {
			return true
		}
	}
	return false
}

// Resource and action helpers
func (s *RBACService) BuildPermissionName(resource models.ResourceType, action models.ActionType) string {
	return fmt.Sprintf("%s.%s", resource, action)
}

func (s *RBACService) ParsePermissionName(permission string) (models.ResourceType, models.ActionType, error) {
	parts := strings.Split(permission, ".")
	if len(parts) != 2 {
		return "", "", errors.New("invalid permission format")
	}
	return models.ResourceType(parts[0]), models.ActionType(parts[1]), nil
}
