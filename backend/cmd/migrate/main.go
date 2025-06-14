package main

import (
	"encoding/json"
	"log"
	"golang_saas/config"
	"golang_saas/models"
	"golang_saas/services"
	"gorm.io/datatypes"
)

func main() {
	// Initialize database
	config.LoadConfig()
	config.InitDatabase()

	// Auto migrate all models
	err := config.DB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.Tenant{},
		&models.Subscription{},
		&models.Plan{},
		&models.SystemSettings{},
		&models.SystemUser{},
		&models.SystemAuditLog{},
		&models.TenantUser{},
		&models.TenantSettings{},
		&models.TenantModule{},
		&models.Module{},
		&models.DomainMapping{},
		&models.AuditLog{},
		&models.UserSession{},
		&models.Notification{},
		&models.UserNotification{},
		&models.CustomerProfile{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database migration completed successfully")

	// Initialize RBAC system
	rbacService := services.NewRBACService(config.DB)
	
	log.Println("Initializing system roles and permissions...")
	err = rbacService.InitializeSystemRoles()
	if err != nil {
		log.Fatalf("Failed to initialize system roles: %v", err)
	}

	log.Println("RBAC system initialized successfully")

	// Create system plans
	err = createSystemPlans()
	if err != nil {
		log.Fatalf("Failed to create system plans: %v", err)
	}

	log.Println("System plans created successfully")

	log.Println("Database setup completed!")
}

func createSystemPlans() error {
	// Check if plans already exist
	var count int64
	config.DB.Model(&models.Plan{}).Count(&count)
	if count > 0 {
		log.Println("Plans already exist, skipping...")
		return nil
	}

	// Helper function to convert map to JSON
	toJSON := func(data map[string]interface{}) datatypes.JSON {
		jsonData, _ := json.Marshal(data)
		return datatypes.JSON(jsonData)
	}

	plans := []models.Plan{
		{
			Name:         "Starter",
			Slug:         "starter",
			Description:  stringPtr("Basic plan for small businesses"),
			Price:        9.99,
			BillingCycle: "monthly",
			Features: toJSON(map[string]interface{}{
				"max_users":     5,
				"storage_gb":    1,
				"api_calls":     1000,
				"support":       "email",
				"custom_domain": false,
			}),
			Limits: toJSON(map[string]interface{}{
				"api_calls_per_hour": 100,
				"storage_gb":         1,
				"integrations":       3,
			}),
			IsActive:  true,
			SortOrder: 1,
			MaxUsers:  5,
		},
		{
			Name:         "Professional",
			Slug:         "professional",
			Description:  stringPtr("Advanced plan for growing businesses"),
			Price:        29.99,
			BillingCycle: "monthly",
			Features: toJSON(map[string]interface{}{
				"max_users":     25,
				"storage_gb":    10,
				"api_calls":     10000,
				"support":       "priority",
				"custom_domain": true,
			}),
			Limits: toJSON(map[string]interface{}{
				"api_calls_per_hour": 1000,
				"storage_gb":         10,
				"integrations":       20,
			}),
			IsActive:  true,
			SortOrder: 2,
			MaxUsers:  25,
		},
		{
			Name:         "Enterprise",
			Slug:         "enterprise",
			Description:  stringPtr("Full-featured plan for large organizations"),
			Price:        99.99,
			BillingCycle: "monthly",
			Features: toJSON(map[string]interface{}{
				"max_users":     -1, // unlimited
				"storage_gb":    100,
				"api_calls":     100000,
				"support":       "dedicated",
				"custom_domain": true,
				"sso":           true,
			}),
			Limits: toJSON(map[string]interface{}{
				"api_calls_per_hour": 10000,
				"storage_gb":         100,
				"integrations":       -1, // unlimited
			}),
			IsActive:  true,
			SortOrder: 3,
			MaxUsers:  1000,
		},
	}

	for _, plan := range plans {
		var existingPlan models.Plan
		if err := config.DB.Where("slug = ?", plan.Slug).First(&existingPlan).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				err := config.DB.Create(&plan).Error
				if err != nil {
					return err
				}
				log.Printf("Created plan: %s", plan.Name)
			}
		} else {
			log.Printf("Plan %s already exists, skipping...", plan.Name)
		}
	}

	return nil
}

func stringPtr(s string) *string {
	return &s
}
