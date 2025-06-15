package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"golang_saas/graph/model"
	"golang_saas/models"
	"golang_saas/utils"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type TenantService struct {
	db *gorm.DB
}

func NewTenantService(db *gorm.DB) *TenantService {
	return &TenantService{db: db}
}

// CreateTenant creates a new tenant with admin user
func (s *TenantService) CreateTenant(ctx context.Context, input model.CreateTenantInput) (*models.Tenant, error) {
	// Validate inputs
	if input.Name == "" || input.Subdomain == "" || input.AdminEmail == "" {
		return nil, errors.New("name, subdomain, and admin email are required")
	}

	// Check if subdomain is already taken
	var existingTenant models.Tenant
	err := s.db.Where("subdomain = ? OR slug = ?", input.Subdomain, input.Slug).First(&existingTenant).Error
	if err == nil {
		return nil, errors.New("subdomain or slug already exists")
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	// Get the plan
	planUUID, err := uuid.Parse(input.PlanID)
	if err != nil {
		return nil, fmt.Errorf("invalid plan ID: %v", err)
	}

	var plan models.Plan
	err = s.db.First(&plan, "id = ?", planUUID).Error
	if err != nil {
		return nil, errors.New("plan not found")
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create tenant
	tenant := models.Tenant{
		Name:      input.Name,
		Slug:      input.Slug,
		Subdomain: input.Subdomain,
		Status:    models.TenantStatusActive,
	}

	// Handle custom domain if provided
	if input.Domain != nil && *input.Domain != "" {
		// Add custom domain to CustomDomains JSON field
		customDomains := []string{*input.Domain}
		customDomainsJSON, err := json.Marshal(customDomains)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal custom domains: %v", err)
		}
		tenant.CustomDomains = datatypes.JSON(customDomainsJSON)
	}

	err = tx.Create(&tenant).Error
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create tenant: %v", err)
	}

	// Initialize tenant roles
	rbacService := NewRBACService(tx)
	err = rbacService.InitializeTenantRoles(tenant.ID)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to initialize tenant roles: %v", err)
	}

	// Get tenant admin role
	var adminRole models.Role
	err = tx.Where("name = ? AND tenant_id = ?", string(models.TenantRoleAdmin), tenant.ID).First(&adminRole).Error
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to find tenant admin role: %v", err)
	}

	// Create admin user
	hashedPassword, err := utils.HashPassword(input.AdminPassword)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to hash password: %v", err)
	}

	adminUser := models.User{
		Email:     input.AdminEmail,
		FirstName: input.AdminFirstName,
		LastName:  input.AdminLastName,
		Password:  hashedPassword,
		IsActive:  true,
		TenantID:  &tenant.ID,
		RoleID:    adminRole.ID,
	}

	err = tx.Create(&adminUser).Error
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create admin user: %v", err)
	}

	// Create subscription
	subscription := models.Subscription{
		TenantID: tenant.ID,
		PlanID:   planUUID,
		Status:   models.SubscriptionStatusActive,
	}

	err = tx.Create(&subscription).Error
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create subscription: %v", err)
	}

	// Commit transaction
	err = tx.Commit().Error
	if err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Reload tenant with relationships
	err = s.db.Preload("Users").Preload("Roles").Preload("Subscription").First(&tenant, tenant.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to reload tenant: %v", err)
	}

	return &tenant, nil
}

// UpdateTenant updates an existing tenant
func (s *TenantService) UpdateTenant(ctx context.Context, id string, input model.UpdateTenantInput) (*models.Tenant, error) {
	tenantUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid tenant ID: %v", err)
	}

	var tenant models.Tenant
	err = s.db.First(&tenant, "id = ?", tenantUUID).Error
	if err != nil {
		return nil, fmt.Errorf("tenant not found: %v", err)
	}

	// Update fields
	if input.Name != nil {
		tenant.Name = *input.Name
	}
	if input.Domain != nil && *input.Domain != "" {
		// Handle custom domain by updating CustomDomains JSON field
		customDomains := []string{*input.Domain}
		customDomainsJSON, err := json.Marshal(customDomains)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal custom domains: %v", err)
		}
		tenant.CustomDomains = datatypes.JSON(customDomainsJSON)
	}
	if input.Status != nil {
		tenant.Status = models.TenantStatus(*input.Status)
	}
	if input.Settings != nil {
		// Convert map to JSON
		settingsBytes, err := json.Marshal(input.Settings)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal settings: %v", err)
		}
		tenant.Settings = datatypes.JSON(settingsBytes)
	}

	err = s.db.Save(&tenant).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update tenant: %v", err)
	}

	return &tenant, nil
}

// DeleteTenant soft deletes a tenant
func (s *TenantService) DeleteTenant(ctx context.Context, id string) (bool, error) {
	tenantUUID, err := uuid.Parse(id)
	if err != nil {
		return false, fmt.Errorf("invalid tenant ID: %v", err)
	}

	// Soft delete tenant (GORM will handle this with the DeletedAt field)
	err = s.db.Delete(&models.Tenant{}, "id = ?", tenantUUID).Error
	if err != nil {
		return false, fmt.Errorf("failed to delete tenant: %v", err)
	}

	return true, nil
}

// GetTenant gets a tenant by ID
func (s *TenantService) GetTenant(ctx context.Context, id string) (*models.Tenant, error) {
	tenantUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid tenant ID: %v", err)
	}

	var tenant models.Tenant
	err = s.db.Preload("Users").Preload("Roles").Preload("Subscription").First(&tenant, "id = ?", tenantUUID).Error
	if err != nil {
		return nil, fmt.Errorf("tenant not found: %v", err)
	}

	return &tenant, nil
}

// GetTenantBySlug gets a tenant by slug
func (s *TenantService) GetTenantBySlug(ctx context.Context, slug string) (*models.Tenant, error) {
	var tenant models.Tenant
	err := s.db.Preload("Users").Preload("Roles").Preload("Subscription").Where("slug = ?", slug).First(&tenant).Error
	if err != nil {
		return nil, fmt.Errorf("tenant not found: %v", err)
	}

	return &tenant, nil
}

// ListTenants lists tenants with filtering and pagination
func (s *TenantService) ListTenants(ctx context.Context, filter *model.TenantFilter, pagination *model.PaginationInput) (*model.PaginatedTenants, error) {
	query := s.db.Model(&models.Tenant{})

	// Apply filters
	if filter != nil {
		if filter.Status != nil {
			query = query.Where("status = ?", *filter.Status)
		}
		if filter.Name != nil {
			query = query.Where("name ILIKE ?", "%"+*filter.Name+"%")
		}
	}

	// Count total
	var total int64
	err := query.Count(&total).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count tenants: %v", err)
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

	// Load tenants
	var tenants []models.Tenant
	err = query.Preload("Users").Preload("Roles").Preload("Subscription").Find(&tenants).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load tenants: %v", err)
	}

	// Convert to pointers
	var tenantPtrs []*models.Tenant
	for i := range tenants {
		tenantPtrs = append(tenantPtrs, &tenants[i])
	}

	totalPages := int32((total + int64(limit) - 1) / int64(limit))

	return &model.PaginatedTenants{
		Tenants:    tenantPtrs,
		Total:      int32(total),
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// ValidateSlug validates and normalizes a tenant slug
func (s *TenantService) ValidateSlug(slug string) (string, error) {
	// Convert to lowercase and replace spaces with hyphens
	slug = strings.ToLower(slug)
	slug = strings.ReplaceAll(slug, " ", "-")

	// Check if slug is reserved
	reservedSlugs := []string{"admin", "api", "www", "mail", "ftp", "system", "app", "dashboard"}
	for _, reserved := range reservedSlugs {
		if slug == reserved {
			return "", fmt.Errorf("slug '%s' is reserved", slug)
		}
	}

	// Basic validation (alphanumeric and hyphens only)
	if !isValidSlug(slug) {
		return "", errors.New("slug can only contain lowercase letters, numbers, and hyphens")
	}

	return slug, nil
}

// Helper function to validate slug format
func isValidSlug(slug string) bool {
	if len(slug) == 0 || len(slug) > 63 {
		return false
	}

	for _, char := range slug {
		if !((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-') {
			return false
		}
	}

	// Can't start or end with hyphen
	return slug[0] != '-' && slug[len(slug)-1] != '-'
}
