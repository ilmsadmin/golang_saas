package config

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"golang_saas/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	DB        *gorm.DB
	TenantDBs map[uint]*gorm.DB
	dbMutex   sync.RWMutex
)

func InitDatabase() {
	var err error
	
	// Create database connection
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		AppConfig.DBHost,
		AppConfig.DBPort,
		AppConfig.DBUser,
		AppConfig.DBPassword,
		AppConfig.DBName,
		AppConfig.DBSSLMode,
	)

	// Set logging level based on environment
	var logLevel logger.LogLevel
	if AppConfig.AppEnv == "development" {
		logLevel = logger.Info
	} else {
		logLevel = logger.Error
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Initialize tenant database map
	TenantDBs = make(map[uint]*gorm.DB)

	log.Println("Database connection established")
}

func MigrateSystem() error {
	log.Println("Running system migrations...")
	
	// Migrate system-wide models in public schema
	err := DB.AutoMigrate(
		&models.Tenant{},
		&models.Plan{},
		&models.Module{},
		&models.TenantModule{},
		&models.SystemUser{},
		&models.DomainMapping{},
		&models.SystemAuditLog{},
	)
	
	if err != nil {
		return fmt.Errorf("failed to migrate system tables: %w", err)
	}

	// Initialize default data
	if err := seedSystemData(); err != nil {
		return fmt.Errorf("failed to seed system data: %w", err)
	}

	log.Println("System migrations completed")
	return nil
}

func MigrateTenant(tenantID uint) error {
	log.Printf("Running tenant migrations for tenant ID: %d", tenantID)

	schemaName := fmt.Sprintf("tenant_%d", tenantID)
	
	// Create schema if it doesn't exist
	if err := DB.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)).Error; err != nil {
		return fmt.Errorf("failed to create tenant schema: %w", err)
	}

	// Get or create tenant-specific database connection
	tenantDB := GetTenantDB(tenantID)
	
	// Set search path to tenant schema
	if err := tenantDB.Exec(fmt.Sprintf("SET search_path TO %s", schemaName)).Error; err != nil {
		return fmt.Errorf("failed to set search path: %w", err)
	}

	// Run migrations
	err := tenantDB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.UserSession{},
		&models.Subscription{},
		&models.Notification{},
		&models.UserNotification{},
		&models.AuditLog{},
		&models.CustomerProfile{},
	)
	
	if err != nil {
		return fmt.Errorf("failed to migrate tenant tables: %w", err)
	}

	// Initialize default tenant data
	if err := seedTenantData(tenantDB, tenantID); err != nil {
		return fmt.Errorf("failed to seed tenant data: %w", err)
	}

	log.Printf("Tenant migrations completed for tenant ID: %d", tenantID)
	return nil
}

func GetTenantDB(tenantID uint) *gorm.DB {
	dbMutex.RLock()
	db, exists := TenantDBs[tenantID]
	dbMutex.RUnlock()

	if exists {
		return db
	}

	// Create new tenant database connection
	dbMutex.Lock()
	defer dbMutex.Unlock()

	// Double-check after acquiring write lock
	if db, exists := TenantDBs[tenantID]; exists {
		return db
	}

	// Create new dedicated session for this tenant
	db = DB.Session(&gorm.Session{})
	schemaName := fmt.Sprintf("tenant_%d", tenantID)
	
	// Set search path for this session only
	db.Exec(fmt.Sprintf("SET search_path TO %s", schemaName))

	TenantDBs[tenantID] = db
	return db
}

func seedSystemData() error {
	// Create default plans
	plans := []models.Plan{
		{
			Name:         "Starter",
			Price:        29.99,
			BillingCycle: "monthly",
			MaxUsers:     10,
			StorageGB:    5,
			IsActive:     true,
		},
		{
			Name:         "Pro",
			Price:        99.99,
			BillingCycle: "monthly",
			MaxUsers:     100,
			StorageGB:    50,
			IsActive:     true,
		},
		{
			Name:         "Enterprise",
			Price:        299.99,
			BillingCycle: "monthly",
			MaxUsers:     -1, // Unlimited
			StorageGB:    500,
			IsActive:     true,
		},
	}

	for _, plan := range plans {
		var existingPlan models.Plan
		if err := DB.Where("name = ?", plan.Name).First(&existingPlan).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := DB.Create(&plan).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}

	// Create default modules
	modules := []models.Module{
		{
			ID:          "user_management",
			Name:        "User Management",
			Description: "Basic user and role management",
			Version:     "1.0.0",
			IsActive:    true,
		},
		{
			ID:          "qr_checkin",
			Name:        "QR Check-in",
			Description: "Event attendance tracking with QR codes",
			Version:     "1.0.0",
			IsActive:    true,
		},
		{
			ID:          "lms",
			Name:        "Learning Management System",
			Description: "Complete LMS solution",
			Version:     "1.0.0",
			IsActive:    true,
		},
		{
			ID:          "crm",
			Name:        "Customer Relationship Management",
			Description: "CRM system",
			Version:     "1.0.0",
			IsActive:    true,
		},
		{
			ID:          "analytics",
			Name:        "Analytics Dashboard",
			Description: "Advanced analytics and reporting",
			Version:     "1.0.0",
			IsActive:    true,
		},
	}

	for _, module := range modules {
		var existingModule models.Module
		if err := DB.Where("id = ?", module.ID).First(&existingModule).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := DB.Create(&module).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}

	// Create default system user if not exists
	var systemUser models.SystemUser
	if err := DB.Where("email = ?", "admin@zplus.vn").First(&systemUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// You'll need to implement password hashing
			hashedPassword := "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUNrRAa7W5EG6T6" // "password"
			systemUser = models.SystemUser{
				Email:        "admin@zplus.vn",
				PasswordHash: hashedPassword,
				FirstName:    "System",
				LastName:     "Admin",
				Role:         "super_admin",
				IsActive:     true,
			}
			if err := DB.Create(&systemUser).Error; err != nil {
				return err
			}
		} else {
			return err
		}
	}

	return nil
}

func seedTenantData(tenantDB *gorm.DB, tenantID uint) error {
	// Create default roles with proper permissions
	roles := []models.Role{
		{
			Name:        "tenant_admin",
			DisplayName: "Administrator",
			IsDefault:   true,
			IsSystem:    true,
		},
		{
			Name:        "tenant_manager",
			DisplayName: "Manager",
			IsSystem:    true,
		},
		{
			Name:        "staff",
			DisplayName: "Staff",
			IsSystem:    true,
		},
		{
			Name:        "customer",
			DisplayName: "Customer",
			IsDefault:   true,
			IsSystem:    true,
		},
	}

	for _, role := range roles {
		var existingRole models.Role
		if err := tenantDB.Where("name = ?", role.Name).First(&existingRole).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Set permissions based on role
				var permissions []string
				switch role.Name {
				case "tenant_admin":
					permissions = []string{"*:*"}
				case "tenant_manager":
					permissions = []string{"users:read", "users:create", "users:update", "settings:read"}
				case "staff":
					permissions = []string{"users:read", "settings:read"}
				case "customer":
					permissions = []string{"profile:read", "profile:update"}
				}
				
				permissionsJSON, _ := json.Marshal(permissions)
				role.Permissions = permissionsJSON
				
				if err := tenantDB.Create(&role).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}

	// Create default permissions
	permissions := []models.Permission{
		{Name: "users:create", DisplayName: "Create Users", Resource: "users", Action: "create"},
		{Name: "users:read", DisplayName: "Read Users", Resource: "users", Action: "read"},
		{Name: "users:update", DisplayName: "Update Users", Resource: "users", Action: "update"},
		{Name: "users:delete", DisplayName: "Delete Users", Resource: "users", Action: "delete"},
		{Name: "roles:create", DisplayName: "Create Roles", Resource: "roles", Action: "create"},
		{Name: "roles:read", DisplayName: "Read Roles", Resource: "roles", Action: "read"},
		{Name: "roles:update", DisplayName: "Update Roles", Resource: "roles", Action: "update"},
		{Name: "roles:delete", DisplayName: "Delete Roles", Resource: "roles", Action: "delete"},
		{Name: "settings:read", DisplayName: "Read Settings", Resource: "settings", Action: "read"},
		{Name: "settings:update", DisplayName: "Update Settings", Resource: "settings", Action: "update"},
		{Name: "profile:read", DisplayName: "Read Profile", Resource: "profile", Action: "read"},
		{Name: "profile:update", DisplayName: "Update Profile", Resource: "profile", Action: "update"},
	}

	for _, permission := range permissions {
		var existingPermission models.Permission
		if err := tenantDB.Where("name = ?", permission.Name).First(&existingPermission).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := tenantDB.Create(&permission).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}

	return nil
}