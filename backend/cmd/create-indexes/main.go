package main

import (
	"log"
	"golang_saas/config"
)

func main() {
	// Initialize database
	config.LoadConfig()
	config.InitDatabase()

	// Create recommended composite indexes for performance
	indexes := []string{
		// System tables composite indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_composite ON tenants(status, created_at)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_subdomain_status ON tenants(subdomain, status)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plans_active_sort ON plans(is_active, sort_order)",
		
		// System audit logs
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_composite ON system_audit_logs(tenant_id, action, created_at)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_user_action ON system_audit_logs(system_user_id, action)",
		
		// User-related indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_composite ON users(tenant_id, is_active, created_at)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role_id)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_tenant ON users(email, tenant_id)",
		
		// Session management indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_cleanup ON user_sessions(expires_at, is_revoked)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_tenant_user ON user_sessions(tenant_id, user_id)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token_active ON user_sessions(token_hash, is_revoked)",
		
		// Notification indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_tenant_status ON notifications(tenant_id, status)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at, status)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_delivery ON user_notifications(user_id, is_read, created_at)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_tenant_unread ON user_notifications(tenant_id, is_read)",
		
		// Subscription and plan indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_tenant_status ON subscriptions(tenant_id, status)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end, status)",
		
		// RBAC indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_tenant_system ON roles(tenant_id, is_system_role)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_system ON permissions(is_system_permission)",
		
		// Audit log indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_composite ON audit_logs(tenant_id, action, created_at)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_resource ON audit_logs(user_id, resource)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)",
		
		// Domain mapping indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_mappings_tenant ON domain_mappings(tenant_id, is_primary)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_domain_mappings_status ON domain_mappings(status, verified_at)",
		
		// Module indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenant_modules_enabled ON tenant_modules(tenant_id, is_enabled)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modules_active ON modules(is_active, id)",
		
		// Customer profile indexes
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_profiles_tenant_active ON customer_profiles(tenant_id, is_active)",
		"CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_profiles_email_tenant ON customer_profiles(email, tenant_id)",
	}

	log.Println("Creating recommended database indexes...")
	
	successCount := 0
	for i, indexSQL := range indexes {
		log.Printf("Creating index %d/%d...", i+1, len(indexes))
		if err := config.DB.Exec(indexSQL).Error; err != nil {
			log.Printf("Warning: Failed to create index: %v", err)
			log.Printf("SQL: %s", indexSQL)
		} else {
			successCount++
		}
	}
	
	log.Printf("Index creation completed. Successfully created %d/%d indexes", successCount, len(indexes))
}