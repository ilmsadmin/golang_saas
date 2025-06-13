package main

import (
	"log"
	"golang_saas/config"
	"golang_saas/models"
	"golang_saas/services"
	"golang_saas/utils"
)

func main() {
	// Initialize database
	config.LoadConfig()
	config.InitDatabase()

	// Initialize RBAC
	rbacService := services.NewRBACService(config.DB)
	
	log.Println("Initializing RBAC system...")
	err := rbacService.InitializeSystemRoles()
	if err != nil {
		log.Fatalf("Failed to initialize RBAC: %v", err)
	}

	// Create super admin user
	err = createSuperAdmin()
	if err != nil {
		log.Fatalf("Failed to create super admin: %v", err)
	}

	log.Println("RBAC system initialized successfully!")
}

func createSuperAdmin() error {
	// Check if super admin already exists
	var existingUser models.User
	err := config.DB.Where("email = ?", "admin@system.local").First(&existingUser).Error
	if err == nil {
		log.Println("Super admin already exists, skipping...")
		return nil
	}

	// Get super admin role
	var superAdminRole models.Role
	err = config.DB.Where("name = ? AND tenant_id IS NULL", "SUPER_ADMIN").First(&superAdminRole).Error
	if err != nil {
		return err
	}

	// Hash password
	hashedPassword, err := utils.HashPassword("admin123")
	if err != nil {
		return err
	}

	// Create super admin user
	superAdmin := models.User{
		Email:     "admin@system.local",
		FirstName: "Super",
		LastName:  "Admin",
		Password:  hashedPassword,
		IsActive:  true,
		TenantID:  nil, // System user
		RoleID:    superAdminRole.ID,
	}

	err = config.DB.Create(&superAdmin).Error
	if err != nil {
		return err
	}

	log.Printf("Created super admin user: %s", superAdmin.Email)
	return nil
}
