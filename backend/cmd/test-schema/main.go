package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"
	"golang_saas/config"
	"golang_saas/models"
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

func main() {
	// Initialize database
	config.LoadConfig()
	config.InitDatabase()

	log.Println("Starting database schema tests...")

	// Test 1: Create and validate a Plan
	if err := testPlanModel(); err != nil {
		log.Printf("Plan model test failed: %v", err)
	} else {
		log.Println("✓ Plan model test passed")
	}

	// Test 2: Create and validate a Tenant
	if err := testTenantModel(); err != nil {
		log.Printf("Tenant model test failed: %v", err)
	} else {
		log.Println("✓ Tenant model test passed")
	}

	// Test 3: Test SystemUser model
	if err := testSystemUserModel(); err != nil {
		log.Printf("SystemUser model test failed: %v", err)
	} else {
		log.Println("✓ SystemUser model test passed")
	}

	// Test 4: Test UserSession model
	if err := testUserSessionModel(); err != nil {
		log.Printf("UserSession model test failed: %v", err)
	} else {
		log.Println("✓ UserSession model test passed")
	}

	// Test 5: Test Notification models
	if err := testNotificationModels(); err != nil {
		log.Printf("Notification model test failed: %v", err)
	} else {
		log.Println("✓ Notification models test passed")
	}

	// Test 6: Test relationships
	if err := testModelRelationships(); err != nil {
		log.Printf("Model relationships test failed: %v", err)
	} else {
		log.Println("✓ Model relationships test passed")
	}

	log.Println("Database schema tests completed")
}

func testPlanModel() error {
	// Create a test plan with new fields
	features, _ := json.Marshal(map[string]interface{}{
		"max_users": 100,
		"storage_gb": 50,
		"api_calls": 10000,
	})
	
	limits, _ := json.Marshal(map[string]interface{}{
		"api_calls_per_hour": 1000,
		"storage_gb": 50,
	})

	plan := models.Plan{
		Name:         "Test Plan",
		Slug:         "test-plan-" + uuid.New().String()[:8],
		Description:  stringPtr("Test plan description"),
		Price:        29.99,
		BillingCycle: "monthly",
		Features:     datatypes.JSON(features),
		Limits:       datatypes.JSON(limits),
		IsActive:     true,
		SortOrder:    1,
		MaxUsers:     100,
	}

	// Create the plan
	if err := config.DB.Create(&plan).Error; err != nil {
		return err
	}

	// Verify it was created with all fields
	var savedPlan models.Plan
	if err := config.DB.Where("slug = ?", plan.Slug).First(&savedPlan).Error; err != nil {
		return err
	}

	// Check new fields
	if savedPlan.BillingCycle != "monthly" {
		return fmt.Errorf("billing_cycle not saved correctly")
	}
	if !savedPlan.IsActive {
		return fmt.Errorf("is_active not saved correctly")
	}
	if savedPlan.SortOrder != 1 {
		return fmt.Errorf("sort_order not saved correctly")
	}

	// Clean up
	config.DB.Delete(&savedPlan)
	return nil
}

func testTenantModel() error {
	customDomains, _ := json.Marshal([]string{"example.com", "test.example.com"})
	billingInfo, _ := json.Marshal(map[string]interface{}{
		"payment_method": "credit_card",
		"last_four": "1234",
	})
	resourceLimits, _ := json.Marshal(map[string]interface{}{
		"max_users": 100,
		"storage_gb": 50,
	})

	tenant := models.Tenant{
		Name:           "Test Tenant",
		Slug:           "test-tenant-" + uuid.New().String()[:8],
		Subdomain:      "test-" + uuid.New().String()[:8],
		CustomDomains:  datatypes.JSON(customDomains),
		Status:         models.TenantStatusActive,
		BillingInfo:    datatypes.JSON(billingInfo),
		ResourceLimits: datatypes.JSON(resourceLimits),
	}

	// Create the tenant
	if err := config.DB.Create(&tenant).Error; err != nil {
		return err
	}

	// Verify it was created with all fields
	var savedTenant models.Tenant
	if err := config.DB.Where("slug = ?", tenant.Slug).First(&savedTenant).Error; err != nil {
		return err
	}

	// Check new fields exist
	if len(savedTenant.CustomDomains) == 0 {
		return fmt.Errorf("custom_domains not saved correctly")
	}
	if len(savedTenant.BillingInfo) == 0 {
		return fmt.Errorf("billing_info not saved correctly")
	}
	if len(savedTenant.ResourceLimits) == 0 {
		return fmt.Errorf("resource_limits not saved correctly")
	}

	// Clean up
	config.DB.Delete(&savedTenant)
	return nil
}

func testSystemUserModel() error {
	permissions, _ := json.Marshal(map[string]interface{}{
		"system": []string{"manage"},
		"tenants": []string{"create", "read", "update"},
	})

	systemUser := models.SystemUser{
		Email:        "test-" + uuid.New().String()[:8] + "@example.com",
		PasswordHash: "hashed_password",
		FirstName:    "Test",
		LastName:     "User",
		Role:         "system_admin",
		Permissions:  datatypes.JSON(permissions),
		IsActive:     true,
	}

	// Create the system user
	if err := config.DB.Create(&systemUser).Error; err != nil {
		return err
	}

	// Verify it was created
	var savedUser models.SystemUser
	if err := config.DB.Where("email = ?", systemUser.Email).First(&savedUser).Error; err != nil {
		return err
	}

	// Clean up
	config.DB.Delete(&savedUser)
	return nil
}

func testUserSessionModel() error {
	// First create a user and tenant for the session
	tenant := models.Tenant{
		Name:      "Session Test Tenant",
		Slug:      "session-test-" + uuid.New().String()[:8],
		Subdomain: "session-" + uuid.New().String()[:8],
		Status:    models.TenantStatusActive,
	}
	if err := config.DB.Create(&tenant).Error; err != nil {
		return err
	}

	user := models.User{
		Email:     "session-user-" + uuid.New().String()[:8] + "@example.com",
		FirstName: "Session",
		LastName:  "User",
		Password:  "hashed_password",
		TenantID:  &tenant.ID,
	}
	if err := config.DB.Create(&user).Error; err != nil {
		return err
	}

	session := models.UserSession{
		UserID:           user.ID,
		TenantID:         tenant.ID,
		TokenHash:        "hashed_token_" + uuid.New().String(),
		RefreshTokenHash: stringPtr("hashed_refresh_token"),
		IPAddress:        stringPtr("192.168.1.1"),
		UserAgent:        stringPtr("Test User Agent"),
		ExpiresAt:        time.Now().Add(24 * time.Hour),
		LastActivity:     time.Now(),
		IsRevoked:        false,
	}

	// Create the session
	if err := config.DB.Create(&session).Error; err != nil {
		return err
	}

	// Verify it was created
	var savedSession models.UserSession
	if err := config.DB.Where("token_hash = ?", session.TokenHash).First(&savedSession).Error; err != nil {
		return err
	}

	// Clean up
	config.DB.Delete(&savedSession)
	config.DB.Delete(&user)
	config.DB.Delete(&tenant)
	return nil
}

func testNotificationModels() error {
	// Create tenant for notifications
	tenant := models.Tenant{
		Name:      "Notification Test Tenant",
		Slug:      "notif-test-" + uuid.New().String()[:8],
		Subdomain: "notif-" + uuid.New().String()[:8],
		Status:    models.TenantStatusActive,
	}
	if err := config.DB.Create(&tenant).Error; err != nil {
		return err
	}

	user := models.User{
		Email:     "notif-user-" + uuid.New().String()[:8] + "@example.com",
		FirstName: "Notification",
		LastName:  "User",
		Password:  "hashed_password",
		TenantID:  &tenant.ID,
	}
	if err := config.DB.Create(&user).Error; err != nil {
		return err
	}

	recipients, _ := json.Marshal(map[string]interface{}{
		"type": "all_users",
	})
	channels, _ := json.Marshal([]string{"in_app", "email"})

	notification := models.Notification{
		TenantID:   tenant.ID,
		Title:      "Test Notification",
		Message:    "This is a test notification",
		Type:       "info",
		Recipients: datatypes.JSON(recipients),
		Channels:   datatypes.JSON(channels),
		Status:     "draft",
		CreatedBy:  user.ID,
	}

	// Create the notification
	if err := config.DB.Create(&notification).Error; err != nil {
		return err
	}

	// Create user notification
	userNotification := models.UserNotification{
		UserID:         user.ID,
		TenantID:       tenant.ID,
		NotificationID: notification.ID,
		IsRead:         false,
	}

	if err := config.DB.Create(&userNotification).Error; err != nil {
		return err
	}

	// Clean up
	config.DB.Delete(&userNotification)
	config.DB.Delete(&notification)
	config.DB.Delete(&user)
	config.DB.Delete(&tenant)
	return nil
}

func testModelRelationships() error {
	// Test Plan -> Subscription relationship
	plan := models.Plan{
		Name:         "Relationship Test Plan",
		Slug:         "rel-test-" + uuid.New().String()[:8],
		Price:        19.99,
		BillingCycle: "monthly",
		IsActive:     true,
		MaxUsers:     10,
	}
	if err := config.DB.Create(&plan).Error; err != nil {
		return err
	}

	tenant := models.Tenant{
		Name:      "Relationship Test Tenant",
		Slug:      "rel-test-" + uuid.New().String()[:8],
		Subdomain: "rel-" + uuid.New().String()[:8],
		Status:    models.TenantStatusActive,
	}
	if err := config.DB.Create(&tenant).Error; err != nil {
		return err
	}

	subscription := models.Subscription{
		TenantID:           tenant.ID,
		PlanID:             plan.ID,
		Status:             models.SubscriptionStatusActive,
		CurrentPeriodStart: time.Now(),
		CurrentPeriodEnd:   time.Now().Add(30 * 24 * time.Hour),
	}
	if err := config.DB.Create(&subscription).Error; err != nil {
		return err
	}

	// Test loading relationships
	var loadedPlan models.Plan
	if err := config.DB.Preload("Subscriptions").Where("id = ?", plan.ID).First(&loadedPlan).Error; err != nil {
		return err
	}

	if len(loadedPlan.Subscriptions) == 0 {
		return fmt.Errorf("plan subscriptions relationship not working")
	}

	// Clean up
	config.DB.Delete(&subscription)
	config.DB.Delete(&tenant)
	config.DB.Delete(&plan)
	return nil
}

func stringPtr(s string) *string {
	return &s
}