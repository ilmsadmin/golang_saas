package main

import (
	"fmt"
	"log"
	"golang_saas/config"
	"golang_saas/models"
	"gorm.io/gorm"
)

func main() {
	// Initialize database
	config.LoadConfig()
	config.InitDatabase()

	log.Println("Creating tenant-specific schema migrations...")

	// Get all tenants
	var tenants []models.Tenant
	if err := config.DB.Find(&tenants).Error; err != nil {
		log.Fatalf("Failed to get tenants: %v", err)
	}

	log.Printf("Found %d tenants to migrate", len(tenants))

	for _, tenant := range tenants {
		log.Printf("Processing tenant: %s (ID: %s)", tenant.Name, tenant.ID.String())
		
		// Create tenant schema
		schemaName := fmt.Sprintf("tenant_%s", tenant.ID.String())
		if err := createTenantSchema(schemaName); err != nil {
			log.Printf("Failed to create schema for tenant %s: %v", tenant.Name, err)
			continue
		}
		
		// Get tenant database connection
		tenantDB := config.GetTenantDB(tenant.ID.String())
		if tenantDB == nil {
			log.Printf("Failed to get tenant DB for %s", tenant.Name)
			continue
		}
		
		// Migrate tenant-specific models
		if err := migrateTenantModels(tenantDB); err != nil {
			log.Printf("Failed to migrate models for tenant %s: %v", tenant.Name, err)
			continue
		}
		
		log.Printf("Successfully migrated tenant: %s", tenant.Name)
	}
	
	log.Println("Tenant schema migration completed")
}

func createTenantSchema(schemaName string) error {
	// Create schema if it doesn't exist
	sql := fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)
	if err := config.DB.Exec(sql).Error; err != nil {
		return fmt.Errorf("failed to create schema %s: %v", schemaName, err)
	}
	
	log.Printf("Created schema: %s", schemaName)
	return nil
}

func migrateTenantModels(tenantDB *gorm.DB) error {
	// Define tenant-specific models that should be in tenant schemas
	// Note: This is optional - the current implementation works fine with shared schema
	tenantModels := []interface{}{
		&models.UserSession{},
		&models.Notification{},
		&models.UserNotification{},
		&models.AuditLog{},
		// Add other tenant-specific models here if needed
	}
	
	// Migrate the models
	if err := tenantDB.AutoMigrate(tenantModels...); err != nil {
		return fmt.Errorf("failed to migrate tenant models: %v", err)
	}
	
	return nil
}