package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"golang_saas/graph/model"
	"golang_saas/models"
	"golang_saas/utils"
	"strings"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type TenantService struct {
	db     *gorm.DB
	rbac   *RBACService
	utils  *utils.TenantResolver
}

func NewTenantService(db *gorm.DB) *TenantService {
	return &TenantService{
		db:    db,
		rbac:  NewRBACService(db),
		utils: utils.NewTenantResolver(),
	}
}

// CreateTenant creates a new tenant with admin user
func (s *TenantService) CreateTenant(ctx context.Context, input model.CreateTenantInput) (*models.Tenant, error) {
	// Validate input
	if err := s.validateCreateInput(input); err != nil {
		return nil, err
	}

	// Check if subdomain/slug already exists
	if err := s.checkUniqueness(input.Slug, input.Subdomain); err != nil {
		return nil, err
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create tenant
	tenant := &models.Tenant{
		Name:      input.Name,
		Slug:      input.Slug,
		Subdomain: input.Subdomain,
		Domain:    input.Domain,
		Status:    models.TenantStatusActive,
	}

	if err := tx.Create(tenant).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	// Initialize tenant roles
	if err := s.rbac.InitializeTenantRoles(tenant.ID); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to initialize tenant roles: %w", err)
	}

	// Create admin user
	adminUser, err := s.createAdminUser(ctx, tx, tenant.ID, input)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create admin user: %w", err)
	}

	// Clear tenant cache
	s.utils.ClearTenantCache(tenant.ID.String())

	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Reload tenant with relations
	tenant.Users = []models.User{*adminUser}
	return tenant, nil
}

// UpdateTenant updates an existing tenant
func (s *TenantService) UpdateTenant(ctx context.Context, id uuid.UUID, input model.UpdateTenantInput) (*models.Tenant, error) {
	// Find existing tenant
	var tenant models.Tenant
	if err := s.db.First(&tenant, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("tenant not found")
		}
		return nil, fmt.Errorf("failed to find tenant: %w", err)
	}

	// Update fields
	if input.Name != nil {
		tenant.Name = *input.Name
	}
	if input.Domain != nil {
		tenant.Domain = input.Domain
	}
	if input.Status != nil {
		tenant.Status = *input.Status
	}
	if input.Settings != nil {
		settingsBytes, err := json.Marshal(input.Settings)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal settings: %w", err)
		}
		tenant.Settings = datatypes.JSON(settingsBytes)
	}

	// Save changes
	if err := s.db.Save(&tenant).Error; err != nil {
		return nil, fmt.Errorf("failed to update tenant: %w", err)
	}

	// Clear tenant cache
	s.utils.ClearTenantCache(tenant.ID.String())

	// Reload with relations
	if err := s.db.Preload("Users").Preload("Roles").Preload("Subscription.Plan").First(&tenant, "id = ?", id).Error; err != nil {
		return nil, fmt.Errorf("failed to reload tenant: %w", err)
	}

	return &tenant, nil
}

// DeleteTenant soft deletes a tenant
func (s *TenantService) DeleteTenant(ctx context.Context, id uuid.UUID) error {
	// Find existing tenant
	var tenant models.Tenant
	if err := s.db.First(&tenant, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("tenant not found")
		}
		return fmt.Errorf("failed to find tenant: %w", err)
	}

	// Soft delete
	if err := s.db.Delete(&tenant).Error; err != nil {
		return fmt.Errorf("failed to delete tenant: %w", err)
	}

	// Clear tenant cache
	s.utils.ClearTenantCache(tenant.ID.String())

	return nil
}

// GetTenant retrieves a tenant by ID
func (s *TenantService) GetTenant(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	var tenant models.Tenant
	if err := s.db.Preload("Users").Preload("Roles").Preload("Subscription.Plan").First(&tenant, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("tenant not found")
		}
		return nil, fmt.Errorf("failed to find tenant: %w", err)
	}

	return &tenant, nil
}

// GetTenantBySlug retrieves a tenant by slug
func (s *TenantService) GetTenantBySlug(ctx context.Context, slug string) (*models.Tenant, error) {
	var tenant models.Tenant
	if err := s.db.Preload("Users").Preload("Roles").Preload("Subscription.Plan").First(&tenant, "slug = ?", slug).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("tenant not found")
		}
		return nil, fmt.Errorf("failed to find tenant: %w", err)
	}

	return &tenant, nil
}

// ListTenants retrieves paginated tenants with filters
func (s *TenantService) ListTenants(ctx context.Context, filter model.TenantFilter, pagination model.PaginationInput) (*model.PaginatedTenants, error) {
	var tenants []models.Tenant
	var total int64

	// Build query
	query := s.db.Model(&models.Tenant{})

	// Apply filters
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.Name != nil && *filter.Name != "" {
		query = query.Where("name ILIKE ?", "%"+*filter.Name+"%")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count tenants: %w", err)
	}

	// Apply pagination
	offset := int((*pagination.Page - 1) * *pagination.Limit)
	query = query.Offset(offset).Limit(int(*pagination.Limit))

	// Load tenants with preloads
	if err := query.Preload("Users").Preload("Roles").Preload("Subscription.Plan").Find(&tenants).Error; err != nil {
		return nil, fmt.Errorf("failed to find tenants: %w", err)
	}

	totalPages := int32((total + int64(*pagination.Limit) - 1) / int64(*pagination.Limit))

	// Convert to model format
	var tenantPtrs []*models.Tenant
	for i := range tenants {
		tenantPtrs = append(tenantPtrs, &tenants[i])
	}

	return &model.PaginatedTenants{
		Tenants:    tenantPtrs,
		Total:      int32(total),
		Page:       *pagination.Page,
		Limit:      *pagination.Limit,
		TotalPages: totalPages,
	}, nil
}

// validateCreateInput validates the create tenant input
func (s *TenantService) validateCreateInput(input model.CreateTenantInput) error {
	if input.Name == "" {
		return fmt.Errorf("tenant name is required")
	}
	if input.Slug == "" {
		return fmt.Errorf("tenant slug is required")
	}
	if input.Subdomain == "" {
		return fmt.Errorf("tenant subdomain is required")
	}
	if input.AdminEmail == "" {
		return fmt.Errorf("admin email is required")
	}
	if input.AdminPassword == "" {
		return fmt.Errorf("admin password is required")
	}
	if input.AdminFirstName == "" {
		return fmt.Errorf("admin first name is required")
	}
	if input.AdminLastName == "" {
		return fmt.Errorf("admin last name is required")
	}
	if input.PlanID == "" {
		return fmt.Errorf("plan ID is required")
	}

	// Validate slug format
	if !isValidSlug(input.Slug) {
		return fmt.Errorf("invalid slug format")
	}

	// Validate subdomain format
	if !isValidSubdomain(input.Subdomain) {
		return fmt.Errorf("invalid subdomain format")
	}

	return nil
}

// checkUniqueness checks if slug and subdomain are unique
func (s *TenantService) checkUniqueness(slug, subdomain string) error {
	var count int64

	// Check slug uniqueness
	if err := s.db.Model(&models.Tenant{}).Where("slug = ?", slug).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check slug uniqueness: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("slug already exists")
	}

	// Check subdomain uniqueness
	if err := s.db.Model(&models.Tenant{}).Where("subdomain = ?", subdomain).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check subdomain uniqueness: %w", err)
	}
	if count > 0 {
		return fmt.Errorf("subdomain already exists")
	}

	return nil
}

// createAdminUser creates the admin user for the tenant
func (s *TenantService) createAdminUser(ctx context.Context, tx *gorm.DB, tenantID uuid.UUID, input model.CreateTenantInput) (*models.User, error) {
	// Get tenant admin role
	var adminRole models.Role
	if err := tx.Where("name = ? AND tenant_id = ?", "tenant_admin", tenantID).First(&adminRole).Error; err != nil {
		return nil, fmt.Errorf("failed to find tenant admin role: %w", err)
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(input.AdminPassword)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create admin user
	adminUser := &models.User{
		Email:     input.AdminEmail,
		FirstName: input.AdminFirstName,
		LastName:  input.AdminLastName,
		Password:  hashedPassword,
		IsActive:  true,
		RoleID:    adminRole.ID,
		TenantID:  &tenantID,
	}

	if err := tx.Create(adminUser).Error; err != nil {
		return nil, fmt.Errorf("failed to create admin user: %w", err)
	}

	return adminUser, nil
}

// isValidSlug checks if slug is valid
func isValidSlug(slug string) bool {
	if len(slug) < 3 || len(slug) > 63 {
		return false
	}
	for _, char := range slug {
		if !((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-') {
			return false
		}
	}
	return !strings.HasPrefix(slug, "-") && !strings.HasSuffix(slug, "-")
}

// isValidSubdomain checks if subdomain is valid
func isValidSubdomain(subdomain string) bool {
	return isValidSlug(subdomain) // Same validation as slug for now
}