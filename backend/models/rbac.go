package models

import (
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// SystemRole represents predefined system roles
type SystemRole string

const (
	// System Level Roles
	SystemRoleSuperAdmin SystemRole = "SUPER_ADMIN"     // Full system access
	SystemRoleAdmin      SystemRole = "SYSTEM_ADMIN"    // System management
	SystemRoleManager    SystemRole = "SYSTEM_MANAGER"  // Limited system access
	SystemRoleSupport    SystemRole = "SYSTEM_SUPPORT"  // Support operations

	// Tenant Level Roles
	TenantRoleAdmin    SystemRole = "TENANT_ADMIN"    // Full tenant access
	TenantRoleManager  SystemRole = "TENANT_MANAGER"  // Tenant management
	TenantRoleUser     SystemRole = "TENANT_USER"     // Regular tenant user
	TenantRoleCustomer SystemRole = "CUSTOMER"        // End customer
)

// ResourceType represents different resource types in the system
type ResourceType string

const (
	// System Resources
	ResourceSystem        ResourceType = "system"
	ResourceTenant        ResourceType = "tenant"
	ResourcePlan          ResourceType = "plan"
	ResourceModule        ResourceType = "module"
	ResourceUser          ResourceType = "user"
	ResourceRole          ResourceType = "role"
	ResourcePermission    ResourceType = "permission"
	ResourceSubscription  ResourceType = "subscription"
	ResourceSystemSetting ResourceType = "system_setting"
	ResourceAuditLog      ResourceType = "audit_log"

	// Tenant Specific Resources
	ResourceTenantUser     ResourceType = "tenant_user"
	ResourceTenantSetting  ResourceType = "tenant_setting"
	ResourceTenantModule   ResourceType = "tenant_module"
	ResourceDomainMapping  ResourceType = "domain_mapping"
	ResourceTenantData     ResourceType = "tenant_data"
	ResourceCustomer       ResourceType = "customer"
	ResourceReport         ResourceType = "report"
	ResourceDashboard      ResourceType = "dashboard"
)

// ActionType represents different actions that can be performed
type ActionType string

const (
	ActionCreate ActionType = "create"
	ActionRead   ActionType = "read"
	ActionUpdate ActionType = "update"
	ActionDelete ActionType = "delete"
	ActionList   ActionType = "list"
	ActionManage ActionType = "manage"
	ActionView   ActionType = "view"
	ActionExport ActionType = "export"
	ActionImport ActionType = "import"
)

// PermissionScope represents the scope of a permission
type PermissionScope string

const (
	ScopeSystem PermissionScope = "system"
	ScopeTenant PermissionScope = "tenant"
	ScopeOwn    PermissionScope = "own"
)

// SystemPermission represents predefined system permissions
type SystemPermission struct {
	Name        string
	Resource    ResourceType
	Action      ActionType
	Scope       PermissionScope
	Description string
	IsSystem    bool
}

// GetSystemPermissions returns all predefined system permissions
func GetSystemPermissions() []SystemPermission {
	return []SystemPermission{
		// System Administration Permissions
		{Name: "system.manage", Resource: ResourceSystem, Action: ActionManage, Scope: ScopeSystem, Description: "Full system management", IsSystem: true},
		{Name: "system.view", Resource: ResourceSystem, Action: ActionView, Scope: ScopeSystem, Description: "View system information", IsSystem: true},

		// Tenant Management Permissions
		{Name: "tenant.create", Resource: ResourceTenant, Action: ActionCreate, Scope: ScopeSystem, Description: "Create new tenants", IsSystem: true},
		{Name: "tenant.read", Resource: ResourceTenant, Action: ActionRead, Scope: ScopeSystem, Description: "View tenant details", IsSystem: true},
		{Name: "tenant.update", Resource: ResourceTenant, Action: ActionUpdate, Scope: ScopeSystem, Description: "Update tenant information", IsSystem: true},
		{Name: "tenant.delete", Resource: ResourceTenant, Action: ActionDelete, Scope: ScopeSystem, Description: "Delete tenants", IsSystem: true},
		{Name: "tenant.list", Resource: ResourceTenant, Action: ActionList, Scope: ScopeSystem, Description: "List all tenants", IsSystem: true},

		// Plan Management Permissions
		{Name: "plan.create", Resource: ResourcePlan, Action: ActionCreate, Scope: ScopeSystem, Description: "Create subscription plans", IsSystem: true},
		{Name: "plan.read", Resource: ResourcePlan, Action: ActionRead, Scope: ScopeSystem, Description: "View plan details", IsSystem: true},
		{Name: "plan.update", Resource: ResourcePlan, Action: ActionUpdate, Scope: ScopeSystem, Description: "Update plans", IsSystem: true},
		{Name: "plan.delete", Resource: ResourcePlan, Action: ActionDelete, Scope: ScopeSystem, Description: "Delete plans", IsSystem: true},
		{Name: "plan.list", Resource: ResourcePlan, Action: ActionList, Scope: ScopeSystem, Description: "List all plans", IsSystem: true},

		// Module Management Permissions
		{Name: "module.create", Resource: ResourceModule, Action: ActionCreate, Scope: ScopeSystem, Description: "Create system modules", IsSystem: true},
		{Name: "module.read", Resource: ResourceModule, Action: ActionRead, Scope: ScopeSystem, Description: "View module details", IsSystem: true},
		{Name: "module.update", Resource: ResourceModule, Action: ActionUpdate, Scope: ScopeSystem, Description: "Update modules", IsSystem: true},
		{Name: "module.delete", Resource: ResourceModule, Action: ActionDelete, Scope: ScopeSystem, Description: "Delete modules", IsSystem: true},
		{Name: "module.list", Resource: ResourceModule, Action: ActionList, Scope: ScopeSystem, Description: "List all modules", IsSystem: true},

		// System User Management Permissions
		{Name: "system_user.create", Resource: ResourceUser, Action: ActionCreate, Scope: ScopeSystem, Description: "Create system users", IsSystem: true},
		{Name: "system_user.read", Resource: ResourceUser, Action: ActionRead, Scope: ScopeSystem, Description: "View system user details", IsSystem: true},
		{Name: "system_user.update", Resource: ResourceUser, Action: ActionUpdate, Scope: ScopeSystem, Description: "Update system users", IsSystem: true},
		{Name: "system_user.delete", Resource: ResourceUser, Action: ActionDelete, Scope: ScopeSystem, Description: "Delete system users", IsSystem: true},
		{Name: "system_user.list", Resource: ResourceUser, Action: ActionList, Scope: ScopeSystem, Description: "List system users", IsSystem: true},

		// System Role Management Permissions
		{Name: "system_role.create", Resource: ResourceRole, Action: ActionCreate, Scope: ScopeSystem, Description: "Create system roles", IsSystem: true},
		{Name: "system_role.read", Resource: ResourceRole, Action: ActionRead, Scope: ScopeSystem, Description: "View system role details", IsSystem: true},
		{Name: "system_role.update", Resource: ResourceRole, Action: ActionUpdate, Scope: ScopeSystem, Description: "Update system roles", IsSystem: true},
		{Name: "system_role.delete", Resource: ResourceRole, Action: ActionDelete, Scope: ScopeSystem, Description: "Delete system roles", IsSystem: true},
		{Name: "system_role.list", Resource: ResourceRole, Action: ActionList, Scope: ScopeSystem, Description: "List system roles", IsSystem: true},

		// Subscription Management Permissions
		{Name: "subscription.create", Resource: ResourceSubscription, Action: ActionCreate, Scope: ScopeSystem, Description: "Create subscriptions", IsSystem: true},
		{Name: "subscription.read", Resource: ResourceSubscription, Action: ActionRead, Scope: ScopeSystem, Description: "View subscription details", IsSystem: true},
		{Name: "subscription.update", Resource: ResourceSubscription, Action: ActionUpdate, Scope: ScopeSystem, Description: "Update subscriptions", IsSystem: true},
		{Name: "subscription.delete", Resource: ResourceSubscription, Action: ActionDelete, Scope: ScopeSystem, Description: "Delete subscriptions", IsSystem: true},
		{Name: "subscription.list", Resource: ResourceSubscription, Action: ActionList, Scope: ScopeSystem, Description: "List all subscriptions", IsSystem: true},

		// System Settings Permissions
		{Name: "system_setting.create", Resource: ResourceSystemSetting, Action: ActionCreate, Scope: ScopeSystem, Description: "Create system settings", IsSystem: true},
		{Name: "system_setting.read", Resource: ResourceSystemSetting, Action: ActionRead, Scope: ScopeSystem, Description: "View system settings", IsSystem: true},
		{Name: "system_setting.update", Resource: ResourceSystemSetting, Action: ActionUpdate, Scope: ScopeSystem, Description: "Update system settings", IsSystem: true},
		{Name: "system_setting.delete", Resource: ResourceSystemSetting, Action: ActionDelete, Scope: ScopeSystem, Description: "Delete system settings", IsSystem: true},

		// Audit Log Permissions
		{Name: "audit_log.read", Resource: ResourceAuditLog, Action: ActionRead, Scope: ScopeSystem, Description: "View audit logs", IsSystem: true},
		{Name: "audit_log.list", Resource: ResourceAuditLog, Action: ActionList, Scope: ScopeSystem, Description: "List audit logs", IsSystem: true},

		// ===========================================
		// TENANT LEVEL PERMISSIONS
		// ===========================================

		// Tenant User Management Permissions
		{Name: "tenant_user.create", Resource: ResourceTenantUser, Action: ActionCreate, Scope: ScopeTenant, Description: "Create tenant users", IsSystem: false},
		{Name: "tenant_user.read", Resource: ResourceTenantUser, Action: ActionRead, Scope: ScopeTenant, Description: "View tenant user details", IsSystem: false},
		{Name: "tenant_user.update", Resource: ResourceTenantUser, Action: ActionUpdate, Scope: ScopeTenant, Description: "Update tenant users", IsSystem: false},
		{Name: "tenant_user.delete", Resource: ResourceTenantUser, Action: ActionDelete, Scope: ScopeTenant, Description: "Delete tenant users", IsSystem: false},
		{Name: "tenant_user.list", Resource: ResourceTenantUser, Action: ActionList, Scope: ScopeTenant, Description: "List tenant users", IsSystem: false},

		// Tenant Role Management Permissions
		{Name: "tenant_role.create", Resource: ResourceRole, Action: ActionCreate, Scope: ScopeTenant, Description: "Create tenant roles", IsSystem: false},
		{Name: "tenant_role.read", Resource: ResourceRole, Action: ActionRead, Scope: ScopeTenant, Description: "View tenant role details", IsSystem: false},
		{Name: "tenant_role.update", Resource: ResourceRole, Action: ActionUpdate, Scope: ScopeTenant, Description: "Update tenant roles", IsSystem: false},
		{Name: "tenant_role.delete", Resource: ResourceRole, Action: ActionDelete, Scope: ScopeTenant, Description: "Delete tenant roles", IsSystem: false},
		{Name: "tenant_role.list", Resource: ResourceRole, Action: ActionList, Scope: ScopeTenant, Description: "List tenant roles", IsSystem: false},

		// Tenant Settings Permissions
		{Name: "tenant_setting.create", Resource: ResourceTenantSetting, Action: ActionCreate, Scope: ScopeTenant, Description: "Create tenant settings", IsSystem: false},
		{Name: "tenant_setting.read", Resource: ResourceTenantSetting, Action: ActionRead, Scope: ScopeTenant, Description: "View tenant settings", IsSystem: false},
		{Name: "tenant_setting.update", Resource: ResourceTenantSetting, Action: ActionUpdate, Scope: ScopeTenant, Description: "Update tenant settings", IsSystem: false},
		{Name: "tenant_setting.delete", Resource: ResourceTenantSetting, Action: ActionDelete, Scope: ScopeTenant, Description: "Delete tenant settings", IsSystem: false},

		// Tenant Module Permissions
		{Name: "tenant_module.read", Resource: ResourceTenantModule, Action: ActionRead, Scope: ScopeTenant, Description: "View tenant modules", IsSystem: false},
		{Name: "tenant_module.update", Resource: ResourceTenantModule, Action: ActionUpdate, Scope: ScopeTenant, Description: "Configure tenant modules", IsSystem: false},
		{Name: "tenant_module.list", Resource: ResourceTenantModule, Action: ActionList, Scope: ScopeTenant, Description: "List tenant modules", IsSystem: false},

		// Domain Mapping Permissions
		{Name: "domain_mapping.create", Resource: ResourceDomainMapping, Action: ActionCreate, Scope: ScopeTenant, Description: "Create domain mappings", IsSystem: false},
		{Name: "domain_mapping.read", Resource: ResourceDomainMapping, Action: ActionRead, Scope: ScopeTenant, Description: "View domain mappings", IsSystem: false},
		{Name: "domain_mapping.update", Resource: ResourceDomainMapping, Action: ActionUpdate, Scope: ScopeTenant, Description: "Update domain mappings", IsSystem: false},
		{Name: "domain_mapping.delete", Resource: ResourceDomainMapping, Action: ActionDelete, Scope: ScopeTenant, Description: "Delete domain mappings", IsSystem: false},

		// Customer Management Permissions
		{Name: "customer.create", Resource: ResourceCustomer, Action: ActionCreate, Scope: ScopeTenant, Description: "Create customers", IsSystem: false},
		{Name: "customer.read", Resource: ResourceCustomer, Action: ActionRead, Scope: ScopeTenant, Description: "View customer details", IsSystem: false},
		{Name: "customer.update", Resource: ResourceCustomer, Action: ActionUpdate, Scope: ScopeTenant, Description: "Update customers", IsSystem: false},
		{Name: "customer.delete", Resource: ResourceCustomer, Action: ActionDelete, Scope: ScopeTenant, Description: "Delete customers", IsSystem: false},
		{Name: "customer.list", Resource: ResourceCustomer, Action: ActionList, Scope: ScopeTenant, Description: "List customers", IsSystem: false},

		// Tenant Data Permissions
		{Name: "tenant_data.create", Resource: ResourceTenantData, Action: ActionCreate, Scope: ScopeTenant, Description: "Create tenant data", IsSystem: false},
		{Name: "tenant_data.read", Resource: ResourceTenantData, Action: ActionRead, Scope: ScopeTenant, Description: "View tenant data", IsSystem: false},
		{Name: "tenant_data.update", Resource: ResourceTenantData, Action: ActionUpdate, Scope: ScopeTenant, Description: "Update tenant data", IsSystem: false},
		{Name: "tenant_data.delete", Resource: ResourceTenantData, Action: ActionDelete, Scope: ScopeTenant, Description: "Delete tenant data", IsSystem: false},
		{Name: "tenant_data.export", Resource: ResourceTenantData, Action: ActionExport, Scope: ScopeTenant, Description: "Export tenant data", IsSystem: false},
		{Name: "tenant_data.import", Resource: ResourceTenantData, Action: ActionImport, Scope: ScopeTenant, Description: "Import tenant data", IsSystem: false},

		// Reporting Permissions
		{Name: "report.create", Resource: ResourceReport, Action: ActionCreate, Scope: ScopeTenant, Description: "Create reports", IsSystem: false},
		{Name: "report.read", Resource: ResourceReport, Action: ActionRead, Scope: ScopeTenant, Description: "View reports", IsSystem: false},
		{Name: "report.update", Resource: ResourceReport, Action: ActionUpdate, Scope: ScopeTenant, Description: "Update reports", IsSystem: false},
		{Name: "report.delete", Resource: ResourceReport, Action: ActionDelete, Scope: ScopeTenant, Description: "Delete reports", IsSystem: false},
		{Name: "report.export", Resource: ResourceReport, Action: ActionExport, Scope: ScopeTenant, Description: "Export reports", IsSystem: false},

		// Dashboard Permissions
		{Name: "dashboard.read", Resource: ResourceDashboard, Action: ActionRead, Scope: ScopeTenant, Description: "View dashboard", IsSystem: false},
		{Name: "dashboard.update", Resource: ResourceDashboard, Action: ActionUpdate, Scope: ScopeTenant, Description: "Customize dashboard", IsSystem: false},

		// Own Profile Permissions
		{Name: "profile.read", Resource: ResourceUser, Action: ActionRead, Scope: ScopeOwn, Description: "View own profile", IsSystem: false},
		{Name: "profile.update", Resource: ResourceUser, Action: ActionUpdate, Scope: ScopeOwn, Description: "Update own profile", IsSystem: false},
	}
}

// RolePermissionMatrix defines which permissions each role should have
type RolePermissionMatrix struct {
	Role        SystemRole
	Permissions []string
}

// GetRolePermissions returns the permission matrix for system roles
func GetRolePermissions() []RolePermissionMatrix {
	return []RolePermissionMatrix{
		// System Level Roles
		{
			Role: SystemRoleSuperAdmin,
			Permissions: []string{
				"system.manage",
				"tenant.create", "tenant.read", "tenant.update", "tenant.delete", "tenant.list",
				"plan.create", "plan.read", "plan.update", "plan.delete", "plan.list",
				"module.create", "module.read", "module.update", "module.delete", "module.list",
				"system_user.create", "system_user.read", "system_user.update", "system_user.delete", "system_user.list",
				"system_role.create", "system_role.read", "system_role.update", "system_role.delete", "system_role.list",
				"subscription.create", "subscription.read", "subscription.update", "subscription.delete", "subscription.list",
				"system_setting.create", "system_setting.read", "system_setting.update", "system_setting.delete",
				"audit_log.read", "audit_log.list",
			},
		},
		{
			Role: SystemRoleAdmin,
			Permissions: []string{
				"system.view",
				"tenant.create", "tenant.read", "tenant.update", "tenant.list",
				"plan.read", "plan.list",
				"module.read", "module.update", "module.list",
				"system_user.create", "system_user.read", "system_user.update", "system_user.list",
				"system_role.read", "system_role.list",
				"subscription.create", "subscription.read", "subscription.update", "subscription.list",
				"system_setting.read", "system_setting.update",
				"audit_log.read", "audit_log.list",
			},
		},
		{
			Role: SystemRoleManager,
			Permissions: []string{
				"system.view",
				"tenant.read", "tenant.list",
				"plan.read", "plan.list",
				"module.read", "module.list",
				"system_user.read", "system_user.list",
				"subscription.read", "subscription.list",
				"audit_log.read", "audit_log.list",
			},
		},
		{
			Role: SystemRoleSupport,
			Permissions: []string{
				"tenant.read", "tenant.list",
				"system_user.read", "system_user.list",
				"subscription.read", "subscription.list",
				"audit_log.read", "audit_log.list",
			},
		},

		// Tenant Level Roles
		{
			Role: TenantRoleAdmin,
			Permissions: []string{
				"tenant_user.create", "tenant_user.read", "tenant_user.update", "tenant_user.delete", "tenant_user.list",
				"tenant_role.create", "tenant_role.read", "tenant_role.update", "tenant_role.delete", "tenant_role.list",
				"tenant_setting.create", "tenant_setting.read", "tenant_setting.update", "tenant_setting.delete",
				"tenant_module.read", "tenant_module.update", "tenant_module.list",
				"domain_mapping.create", "domain_mapping.read", "domain_mapping.update", "domain_mapping.delete",
				"customer.create", "customer.read", "customer.update", "customer.delete", "customer.list",
				"tenant_data.create", "tenant_data.read", "tenant_data.update", "tenant_data.delete", "tenant_data.export", "tenant_data.import",
				"report.create", "report.read", "report.update", "report.delete", "report.export",
				"dashboard.read", "dashboard.update",
				"profile.read", "profile.update",
			},
		},
		{
			Role: TenantRoleManager,
			Permissions: []string{
				"tenant_user.read", "tenant_user.update", "tenant_user.list",
				"tenant_role.read", "tenant_role.list",
				"tenant_setting.read", "tenant_setting.update",
				"tenant_module.read", "tenant_module.list",
				"domain_mapping.read",
				"customer.create", "customer.read", "customer.update", "customer.list",
				"tenant_data.create", "tenant_data.read", "tenant_data.update", "tenant_data.export",
				"report.create", "report.read", "report.update", "report.export",
				"dashboard.read", "dashboard.update",
				"profile.read", "profile.update",
			},
		},
		{
			Role: TenantRoleUser,
			Permissions: []string{
				"tenant_user.read",
				"customer.read", "customer.list",
				"tenant_data.read",
				"report.read", "report.export",
				"dashboard.read",
				"profile.read", "profile.update",
			},
		},
		{
			Role: TenantRoleCustomer,
			Permissions: []string{
				"dashboard.read",
				"profile.read", "profile.update",
			},
		},
	}
}

// CustomerProfile represents end customer profile for tenant businesses
type CustomerProfile struct {
	BaseModel
	TenantID    uuid.UUID      `json:"tenant_id" gorm:"type:char(36);not null;index"`
	Email       string         `json:"email" gorm:"not null"`
	FirstName   string         `json:"first_name" gorm:"not null"`
	LastName    string         `json:"last_name" gorm:"not null"`
	Phone       *string        `json:"phone"`
	Address     datatypes.JSON `json:"address" gorm:"type:jsonb"`
	Preferences datatypes.JSON `json:"preferences" gorm:"type:jsonb"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	Tags        datatypes.JSON `json:"tags" gorm:"type:jsonb"`
	Metadata    datatypes.JSON `json:"metadata" gorm:"type:jsonb"`

	// Relations
	Tenant Tenant `json:"tenant" gorm:"foreignKey:TenantID"`
}
