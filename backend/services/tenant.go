package services

import (
	"errors"
	"fmt"

	"golang_saas/config"
	"golang_saas/models"
	"golang_saas/utils"

	"gorm.io/gorm"
)

type TenantService struct {
	db *gorm.DB
}

func NewTenantService() *TenantService {
	return &TenantService{
		db: config.DB,
	}
}

type CreateTenantRequest struct {
	Name          string `json:"name" validate:"required"`
	Subdomain     string `json:"subdomain" validate:"required,min=3,max=63"`
	PlanID        uint   `json:"plan_id" validate:"required"`
	AdminEmail    string `json:"admin_email" validate:"required,email"`
	AdminPassword string `json:"admin_password" validate:"required,min=8"`
	AdminFirstName string `json:"admin_first_name"`
	AdminLastName  string `json:"admin_last_name"`
}

type CreateTenantResponse struct {
	Tenant    models.Tenant `json:"tenant"`
	AdminUser interface{}   `json:"admin_user"`
}

func (s *TenantService) CreateTenant(req CreateTenantRequest) (*CreateTenantResponse, error) {
	// Validate subdomain availability
	if err := s.validateSubdomain(req.Subdomain); err != nil {
		return nil, err
	}

	// Check if plan exists
	var plan models.Plan
	if err := s.db.Where("id = ? AND is_active = ?", req.PlanID, true).First(&plan).Error; err != nil {
		return nil, errors.New("invalid plan")
	}

	// Start transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Create tenant record
	tenant := models.Tenant{
		Name:      req.Name,
		Subdomain: req.Subdomain,
		PlanID:    req.PlanID,
		Status:    "provisioning",
	}

	if err := tx.Create(&tenant).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	// Create tenant schema and migrate
	if err := config.MigrateTenant(tenant.ID); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create tenant schema: %w", err)
	}

	// Create tenant admin user
	adminUser, err := s.createTenantAdmin(tenant.ID, req)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create admin user: %w", err)
	}

	// Enable default modules
	if err := s.enableDefaultModules(tx, tenant.ID); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to enable default modules: %w", err)
	}

	// Update tenant status to active
	tenant.Status = "active"
	if err := tx.Save(&tenant).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to activate tenant: %w", err)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load tenant with plan
	s.db.Preload("Plan").First(&tenant, tenant.ID)

	return &CreateTenantResponse{
		Tenant:    tenant,
		AdminUser: adminUser,
	}, nil
}

func (s *TenantService) GetTenants(page, limit int, status, search string) ([]models.Tenant, int64, error) {
	var tenants []models.Tenant
	var total int64

	query := s.db.Model(&models.Tenant{}).Preload("Plan")

	// Apply filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		query = query.Where("name ILIKE ? OR subdomain ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&tenants).Error; err != nil {
		return nil, 0, err
	}

	return tenants, total, nil
}

func (s *TenantService) GetTenant(id uint) (*models.Tenant, error) {
	var tenant models.Tenant
	err := s.db.Preload("Plan").First(&tenant, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("tenant not found")
		}
		return nil, err
	}
	return &tenant, nil
}

func (s *TenantService) UpdateTenant(id uint, updates map[string]interface{}) (*models.Tenant, error) {
	var tenant models.Tenant
	if err := s.db.First(&tenant, id).Error; err != nil {
		return nil, errors.New("tenant not found")
	}

	// Validate subdomain if being updated
	if subdomain, ok := updates["subdomain"]; ok {
		if err := s.validateSubdomainForUpdate(subdomain.(string), id); err != nil {
			return nil, err
		}
	}

	if err := s.db.Model(&tenant).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Clear tenant cache
	tenantResolver := utils.NewTenantResolver()
	tenantResolver.ClearTenantCache(id)

	// Reload tenant with plan
	s.db.Preload("Plan").First(&tenant, id)
	return &tenant, nil
}

func (s *TenantService) SuspendTenant(id uint) error {
	return s.updateTenantStatus(id, "suspended")
}

func (s *TenantService) ActivateTenant(id uint) error {
	return s.updateTenantStatus(id, "active")
}

func (s *TenantService) DeleteTenant(id uint) error {
	// Soft delete tenant
	if err := s.db.Delete(&models.Tenant{}, id).Error; err != nil {
		return err
	}

	// Clear tenant cache
	tenantResolver := utils.NewTenantResolver()
	tenantResolver.ClearTenantCache(id)

	return nil
}

func (s *TenantService) validateSubdomain(subdomain string) error {
	var count int64
	if err := s.db.Model(&models.Tenant{}).Where("subdomain = ?", subdomain).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("subdomain already exists")
	}
	return nil
}

func (s *TenantService) validateSubdomainForUpdate(subdomain string, tenantID uint) error {
	var count int64
	if err := s.db.Model(&models.Tenant{}).Where("subdomain = ? AND id != ?", subdomain, tenantID).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return errors.New("subdomain already exists")
	}
	return nil
}

func (s *TenantService) createTenantAdmin(tenantID uint, req CreateTenantRequest) (interface{}, error) {
	tenantDB := config.GetTenantDB(tenantID)

	// Hash password
	hashedPassword, err := utils.HashPassword(req.AdminPassword)
	if err != nil {
		return nil, err
	}

	// Get tenant admin role
	var role models.Role
	if err := tenantDB.Where("name = ?", "tenant_admin").First(&role).Error; err != nil {
		return nil, errors.New("tenant admin role not found")
	}

	// Create admin user
	user := models.User{
		Email:        req.AdminEmail,
		PasswordHash: hashedPassword,
		FirstName:    req.AdminFirstName,
		LastName:     req.AdminLastName,
		RoleID:       role.ID,
		IsActive:     true,
		EmailVerified: true,
	}

	if err := tenantDB.Create(&user).Error; err != nil {
		return nil, err
	}

	// Load user with role
	tenantDB.Preload("Role").First(&user, user.ID)
	return user, nil
}

func (s *TenantService) enableDefaultModules(tx *gorm.DB, tenantID uint) error {
	// Enable user_management module by default
	tenantModule := models.TenantModule{
		TenantID:  tenantID,
		ModuleID:  "user_management",
		IsEnabled: true,
	}

	return tx.Create(&tenantModule).Error
}

func (s *TenantService) updateTenantStatus(id uint, status string) error {
	var tenant models.Tenant
	if err := s.db.First(&tenant, id).Error; err != nil {
		return errors.New("tenant not found")
	}

	tenant.Status = status
	if err := s.db.Save(&tenant).Error; err != nil {
		return err
	}

	// Clear tenant cache
	tenantResolver := utils.NewTenantResolver()
	tenantResolver.ClearTenantCache(id)

	return nil
}