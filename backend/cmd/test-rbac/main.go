package main

import (
	"fmt"
	"log"
	"golang_saas/config"
	"golang_saas/models"
	"golang_saas/services"
	"golang_saas/utils"

	"github.com/google/uuid"
)

func main() {
	// Initialize
	config.LoadConfig()
	config.InitDatabase()

	// Test RBAC System
	testRBACSystem()
}

func testRBACSystem() {
	log.Println("=== Testing RBAC System ===")

	rbacService := services.NewRBACService(config.DB)

	// 1. Test Initialize System Roles
	log.Println("1. Testing Initialize System Roles...")
	err := rbacService.InitializeSystemRoles()
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Println("✓ System roles initialized")
	}

	// 2. Test Create Tenant and Initialize Tenant Roles
	log.Println("2. Testing Create Tenant...")
	tenant := models.Tenant{
		Name:      "Test Company",
		Slug:      "test-company",
		Subdomain: "test-company",
		Status:    models.TenantStatusActive,
	}
	
	err = config.DB.Create(&tenant).Error
	if err != nil {
		log.Printf("Error creating tenant: %v", err)
		return
	}
	log.Printf("✓ Tenant created: %s", tenant.Name)

	err = rbacService.InitializeTenantRoles(tenant.ID)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Println("✓ Tenant roles initialized")
	}

	// 3. Test Create System Admin User
	log.Println("3. Testing Create System Admin User...")
	systemAdmin, err := createTestUser("admin@system.local", "System", "Admin", nil, "SYSTEM_ADMIN")
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}
	log.Printf("✓ System admin created: %s", systemAdmin.Email)

	// 4. Test Create Tenant Admin User
	log.Println("4. Testing Create Tenant Admin User...")
	tenantAdmin, err := createTestUser("admin@test-company.com", "Tenant", "Admin", &tenant.ID, "TENANT_ADMIN")
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}
	log.Printf("✓ Tenant admin created: %s", tenantAdmin.Email)

	// 5. Test Permission Checking
	log.Println("5. Testing Permission Checking...")
	
	// System admin should have system permissions
	hasPermission, err := rbacService.CheckUserPermission(systemAdmin.ID, "tenant.create", nil)
	if err != nil {
		log.Printf("Error: %v", err)
	} else if hasPermission {
		log.Println("✓ System admin has tenant.create permission")
	} else {
		log.Println("✗ System admin should have tenant.create permission")
	}

	// Tenant admin should have tenant permissions
	hasPermission, err = rbacService.CheckUserPermission(tenantAdmin.ID, "tenant_user.create", &tenant.ID)
	if err != nil {
		log.Printf("Error: %v", err)
	} else if hasPermission {
		log.Println("✓ Tenant admin has tenant_user.create permission")
	} else {
		log.Println("✗ Tenant admin should have tenant_user.create permission")
	}

	// Tenant admin should NOT have system permissions
	hasPermission, err = rbacService.CheckUserPermission(tenantAdmin.ID, "tenant.create", nil)
	if err != nil {
		log.Printf("Error: %v", err)
	} else if !hasPermission {
		log.Println("✓ Tenant admin does NOT have tenant.create permission (correct)")
	} else {
		log.Println("✗ Tenant admin should NOT have tenant.create permission")
	}

	// 6. Test Get User Permissions
	log.Println("6. Testing Get User Permissions...")
	permissions, err := rbacService.GetUserPermissions(systemAdmin.ID)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("✓ System admin has %d permissions", len(permissions))
		log.Printf("Sample permissions: %v", permissions[:min(5, len(permissions))])
	}

	permissions, err = rbacService.GetUserPermissions(tenantAdmin.ID)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("✓ Tenant admin has %d permissions", len(permissions))
		log.Printf("Sample permissions: %v", permissions[:min(5, len(permissions))])
	}

	// 7. Test Create Custom Role
	log.Println("7. Testing Create Custom Role...")
	customRole, err := rbacService.CreateCustomRole(
		&tenant.ID, 
		"Custom Manager", 
		"Custom role for testing",
		[]string{"tenant_user.read", "tenant_user.list", "customer.read", "customer.list"},
	)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("✓ Custom role created: %s", customRole.Name)
	}

	// 8. Test Assign Custom Role
	log.Println("8. Testing Assign Custom Role...")
	customUser, err := createTestUser("manager@test-company.com", "Custom", "Manager", &tenant.ID, "TENANT_USER")
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}

	err = rbacService.AssignRoleToUser(customUser.ID, customRole.ID)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Println("✓ Custom role assigned to user")
	}

	// 9. Test Customer Profile
	log.Println("9. Testing Customer Profile...")
	customer := models.CustomerProfile{
		TenantID:  tenant.ID,
		Email:     "customer@example.com",
		FirstName: "John",
		LastName:  "Doe",
		IsActive:  true,
	}
	
	err = config.DB.Create(&customer).Error
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("✓ Customer profile created: %s", customer.Email)
	}

	// 10. Test Get Roles by Tenant
	log.Println("10. Testing Get Roles by Tenant...")
	systemRoles, err := rbacService.GetRolesByTenant(nil)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("✓ Found %d system roles", len(systemRoles))
	}

	tenantRoles, err := rbacService.GetRolesByTenant(&tenant.ID)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		log.Printf("✓ Found %d tenant roles", len(tenantRoles))
	}

	log.Println("=== RBAC Test Completed ===")
}

func createTestUser(email, firstName, lastName string, tenantID *uuid.UUID, roleName string) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	err := config.DB.Where("email = ?", email).First(&existingUser).Error
	if err == nil {
		log.Printf("User %s already exists, skipping...", email)
		return &existingUser, nil
	}

	// Get role
	var role models.Role
	query := config.DB.Where("name = ?", roleName)
	if tenantID != nil {
		query = query.Where("tenant_id = ?", *tenantID)
	} else {
		query = query.Where("tenant_id IS NULL")
	}
	
	err = query.First(&role).Error
	if err != nil {
		return nil, fmt.Errorf("role %s not found: %w", roleName, err)
	}

	// Hash password
	hashedPassword, err := utils.HashPassword("password123")
	if err != nil {
		return nil, err
	}

	// Create user
	user := models.User{
		Email:     email,
		FirstName: firstName,
		LastName:  lastName,
		Password:  hashedPassword,
		IsActive:  true,
		TenantID:  tenantID,
		RoleID:    role.ID,
	}

	err = config.DB.Create(&user).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
