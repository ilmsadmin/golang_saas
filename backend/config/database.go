package config

import (
	"fmt"
	"log"
	"sync"

	"golang_saas/models"

	"gorm.io/datatypes"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	DB        *gorm.DB
	TenantDBs map[string]*gorm.DB // UUID string keys for tenant IDs
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
	TenantDBs = make(map[string]*gorm.DB)

	// Enable UUID extension
	if err := DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
		log.Printf("Warning: Could not create UUID extension: %v", err)
	}

	// Auto-migrate system models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.Tenant{},
		&models.Subscription{},
		&models.Plan{},
		&models.SystemSettings{},
		&models.TenantUser{},
		&models.TenantSettings{},
		&models.TenantModule{},
		&models.Module{},
		&models.DomainMapping{},
		&models.AuditLog{},
	)
	if err != nil {
		log.Fatal("Failed to auto-migrate models:", err)
	}

	log.Println("Database connected and migrated successfully")

	// Seed initial data
	seedInitialData()
}

// MigrateSystem performs database migration (for backward compatibility)
func MigrateSystem() error {
	// Migration is now integrated into InitDatabase
	// This function exists for compatibility with existing code
	log.Println("Migration completed successfully - migrations are now integrated into InitDatabase")
	return nil
}

func GetTenantDB(tenantID string) *gorm.DB {
	dbMutex.RLock()
	db, exists := TenantDBs[tenantID]
	dbMutex.RUnlock()

	if exists {
		return db
	}

	// Create new tenant database connection with schema
	dbMutex.Lock()
	defer dbMutex.Unlock()

	// Double-check after acquiring write lock
	if db, exists := TenantDBs[tenantID]; exists {
		return db
	}

	// Create schema for tenant
	schemaName := fmt.Sprintf("tenant_%s", tenantID)
	if err := DB.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)).Error; err != nil {
		log.Printf("Failed to create schema for tenant %s: %v", tenantID, err)
		return DB // Return main DB as fallback
	}

	// Create connection with schema search path
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s search_path=%s",
		AppConfig.DBHost,
		AppConfig.DBPort,
		AppConfig.DBUser,
		AppConfig.DBPassword,
		AppConfig.DBName,
		AppConfig.DBSSLMode,
		schemaName,
	)

	tenantDB, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Printf("Failed to create tenant DB for %s: %v", tenantID, err)
		return DB // Return main DB as fallback
	}

	TenantDBs[tenantID] = tenantDB
	return tenantDB
}

func seedInitialData() {
	// Create default plans
	plans := []models.Plan{
		{
			Name:        "Starter",
			Description: StringPtr("Perfect for small teams"),
			Price:       29.99,
			Features: datatypes.JSON([]byte(`{
				"users": 10,
				"storage": "5GB",
				"support": "email",
				"integrations": 3
			}`)),
			MaxUsers: 10,
		},
		{
			Name:        "Professional",
			Description: StringPtr("Great for growing businesses"),
			Price:       99.99,
			Features: datatypes.JSON([]byte(`{
				"users": 100,
				"storage": "50GB",
				"support": "priority",
				"integrations": 20,
				"analytics": true
			}`)),
			MaxUsers: 100,
		},
		{
			Name:        "Enterprise",
			Description: StringPtr("For large organizations"),
			Price:       299.99,
			Features: datatypes.JSON([]byte(`{
				"users": -1,
				"storage": "500GB",
				"support": "dedicated",
				"integrations": -1,
				"analytics": true,
				"sso": true,
				"custom_domain": true
			}`)),
			MaxUsers: -1, // Unlimited
		},
	}

	for _, plan := range plans {
		var existingPlan models.Plan
		if err := DB.Where("name = ?", plan.Name).First(&existingPlan).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := DB.Create(&plan).Error; err != nil {
					log.Printf("Failed to create plan %s: %v", plan.Name, err)
				}
			}
		}
	}

	// Create system roles
	systemRoles := []models.Role{
		{
			Name:         "system_admin",
			Description:  StringPtr("System Administrator"),
			IsSystemRole: true,
		},
		{
			Name:         "tenant_admin",
			Description:  StringPtr("Tenant Administrator"),
			IsSystemRole: false,
		},
		{
			Name:         "tenant_user",
			Description:  StringPtr("Tenant User"),
			IsSystemRole: false,
		},
		{
			Name:         "customer",
			Description:  StringPtr("Customer"),
			IsSystemRole: false,
		},
	}

	for _, role := range systemRoles {
		var existingRole models.Role
		if err := DB.Where("name = ? AND is_system_role = ?", role.Name, role.IsSystemRole).First(&existingRole).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := DB.Create(&role).Error; err != nil {
					log.Printf("Failed to create role %s: %v", role.Name, err)
				}
			}
		}
	}

	// Create system permissions
	permissions := []models.Permission{
		{Name: "users:create", Resource: "users", Action: "create", IsSystemPermission: true},
		{Name: "users:read", Resource: "users", Action: "read", IsSystemPermission: true},
		{Name: "users:update", Resource: "users", Action: "update", IsSystemPermission: true},
		{Name: "users:delete", Resource: "users", Action: "delete", IsSystemPermission: true},
		{Name: "roles:create", Resource: "roles", Action: "create", IsSystemPermission: true},
		{Name: "roles:read", Resource: "roles", Action: "read", IsSystemPermission: true},
		{Name: "roles:update", Resource: "roles", Action: "update", IsSystemPermission: true},
		{Name: "roles:delete", Resource: "roles", Action: "delete", IsSystemPermission: true},
		{Name: "tenants:create", Resource: "tenants", Action: "create", IsSystemPermission: true},
		{Name: "tenants:read", Resource: "tenants", Action: "read", IsSystemPermission: true},
		{Name: "tenants:update", Resource: "tenants", Action: "update", IsSystemPermission: true},
		{Name: "tenants:delete", Resource: "tenants", Action: "delete", IsSystemPermission: true},
		{Name: "settings:read", Resource: "settings", Action: "read", IsSystemPermission: false},
		{Name: "settings:update", Resource: "settings", Action: "update", IsSystemPermission: false},
		{Name: "profile:read", Resource: "profile", Action: "read", IsSystemPermission: false},
		{Name: "profile:update", Resource: "profile", Action: "update", IsSystemPermission: false},
	}

	for _, permission := range permissions {
		var existingPermission models.Permission
		if err := DB.Where("name = ?", permission.Name).First(&existingPermission).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := DB.Create(&permission).Error; err != nil {
					log.Printf("Failed to create permission %s: %v", permission.Name, err)
				}
			}
		}
	}

	log.Println("Initial data seeded successfully")
}

// Helper function to create string pointers
func StringPtr(s string) *string {
	return &s
}

func CloseDatabases() {
	// Close tenant databases
	dbMutex.Lock()
	defer dbMutex.Unlock()

	for tenantID, db := range TenantDBs {
		if sqlDB, err := db.DB(); err == nil {
			sqlDB.Close()
		}
		delete(TenantDBs, tenantID)
	}

	// Close main database
	if sqlDB, err := DB.DB(); err == nil {
		sqlDB.Close()
	}
}
