package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// BaseModel contains common fields for all models
type BaseModel struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// BeforeCreate sets UUID before creating record
func (base *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if base.ID == uuid.Nil {
		base.ID = uuid.New()
	}
	return nil
}

// User represents a user in the system
type User struct {
	BaseModel
	Email     string     `json:"email" gorm:"uniqueIndex;not null"`
	FirstName string     `json:"first_name" gorm:"not null"`
	LastName  string     `json:"last_name" gorm:"not null"`
	Password  string     `json:"-" gorm:"not null"`
	IsActive  bool       `json:"is_active" gorm:"default:true"`
	TenantID  *uuid.UUID `json:"tenant_id" gorm:"type:uuid;index"`
	RoleID    uuid.UUID  `json:"role_id" gorm:"type:uuid;not null"`

	// Relations
	Tenant      *Tenant      `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
	Role        Role         `json:"role" gorm:"foreignKey:RoleID"`
	Permissions []Permission `json:"permissions,omitempty" gorm:"many2many:user_permissions;"`
}

// Role represents a role in RBAC system
type Role struct {
	BaseModel
	Name         string     `json:"name" gorm:"not null"`
	Description  *string    `json:"description"`
	IsSystemRole bool       `json:"is_system_role" gorm:"default:false"`
	TenantID     *uuid.UUID `json:"tenant_id" gorm:"type:uuid;index"`

	// Relations
	Tenant      *Tenant      `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
	Users       []User       `json:"users,omitempty" gorm:"foreignKey:RoleID"`
	Permissions []Permission `json:"permissions,omitempty" gorm:"many2many:role_permissions;"`
}

// Permission represents a permission in RBAC system
type Permission struct {
	BaseModel
	Name               string  `json:"name" gorm:"not null"`
	Resource           string  `json:"resource" gorm:"not null"`
	Action             string  `json:"action" gorm:"not null"`
	Description        *string `json:"description"`
	IsSystemPermission bool    `json:"is_system_permission" gorm:"default:false"`

	// Relations
	Roles []Role `json:"roles,omitempty" gorm:"many2many:role_permissions;"`
	Users []User `json:"users,omitempty" gorm:"many2many:user_permissions;"`
}

// TenantStatus enum
type TenantStatus string

const (
	TenantStatusActive    TenantStatus = "ACTIVE"
	TenantStatusInactive  TenantStatus = "INACTIVE"
	TenantStatusSuspended TenantStatus = "SUSPENDED"
	TenantStatusPending   TenantStatus = "PENDING"
)

// Tenant represents a tenant in the multi-tenant system
type Tenant struct {
	BaseModel
	Name           string                 `json:"name" gorm:"not null"`
	Slug           string                 `json:"slug" gorm:"uniqueIndex;not null"`
	Subdomain      string                 `json:"subdomain" gorm:"uniqueIndex;not null"`
	CustomDomains  datatypes.JSON         `json:"custom_domains" gorm:"type:jsonb"` // Array of custom domains
	Status         TenantStatus           `json:"status" gorm:"default:ACTIVE"`
	Settings       datatypes.JSON         `json:"settings" gorm:"type:jsonb"`
	BillingInfo    datatypes.JSON         `json:"billing_info" gorm:"type:jsonb"`
	ResourceLimits datatypes.JSON         `json:"resource_limits" gorm:"type:jsonb"`

	// Relations
	Users        []User         `json:"users,omitempty" gorm:"foreignKey:TenantID"`
	Roles        []Role         `json:"roles,omitempty" gorm:"foreignKey:TenantID"`
	Subscription *Subscription  `json:"subscription,omitempty" gorm:"foreignKey:TenantID"`
	DomainMappings []DomainMapping `json:"domain_mappings,omitempty" gorm:"foreignKey:TenantID"`
}

// SubscriptionStatus enum
type SubscriptionStatus string

const (
	SubscriptionStatusActive   SubscriptionStatus = "ACTIVE"
	SubscriptionStatusCancelled SubscriptionStatus = "CANCELLED"
	SubscriptionStatusPastDue   SubscriptionStatus = "PAST_DUE"
	SubscriptionStatusUnpaid    SubscriptionStatus = "UNPAID"
)

// Subscription represents a tenant's subscription
type Subscription struct {
	BaseModel
	TenantID            uuid.UUID          `json:"tenant_id" gorm:"type:uuid;not null;index"`
	PlanID              uuid.UUID          `json:"plan_id" gorm:"type:uuid;not null"`
	Status              SubscriptionStatus `json:"status" gorm:"default:ACTIVE"`
	CurrentPeriodStart  time.Time          `json:"current_period_start" gorm:"not null"`
	CurrentPeriodEnd    time.Time          `json:"current_period_end" gorm:"not null"`

	// Relations
	Tenant Tenant `json:"tenant" gorm:"foreignKey:TenantID"`
	Plan   Plan   `json:"plan" gorm:"foreignKey:PlanID"`
}

// Plan represents a subscription plan
type Plan struct {
	BaseModel
	Name         string         `json:"name" gorm:"not null"`
	Slug         string         `json:"slug" gorm:"uniqueIndex;not null"`
	Description  *string        `json:"description"`
	Price        float64        `json:"price" gorm:"type:decimal(10,2);not null"`
	BillingCycle string         `json:"billing_cycle" gorm:"default:monthly"` // monthly, yearly
	Features     datatypes.JSON `json:"features" gorm:"type:jsonb"`
	Limits       datatypes.JSON `json:"limits" gorm:"type:jsonb"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	SortOrder    int            `json:"sort_order" gorm:"default:0"`
	MaxUsers     int            `json:"max_users" gorm:"default:10"`

	// Relations
	Subscriptions []Subscription `json:"subscriptions,omitempty" gorm:"foreignKey:PlanID"`
}

// SystemSettings represents system-wide configuration
type SystemSettings struct {
	BaseModel
	Key         string         `json:"key" gorm:"uniqueIndex;not null"`
	Value       datatypes.JSON `json:"value" gorm:"type:jsonb"`
	Description *string        `json:"description"`
}

// SystemUser represents system administrators who manage the platform  
type SystemUser struct {
	BaseModel
	Email        string         `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string         `json:"-" gorm:"not null"`
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	Role         string         `json:"role" gorm:"not null"` // super_admin, system_admin, system_manager
	Permissions  datatypes.JSON `json:"permissions" gorm:"type:jsonb"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	LastLogin    *time.Time     `json:"last_login"`
}

// SystemAuditLog represents audit trail for system-level operations
type SystemAuditLog struct {
	BaseModel
	SystemUserID *uuid.UUID     `json:"system_user_id" gorm:"type:char(36);index"`
	TenantID     *uuid.UUID     `json:"tenant_id" gorm:"type:char(36);index"`
	Action       string         `json:"action" gorm:"not null"`
	Resource     string         `json:"resource" gorm:"not null"`
	ResourceID   *string        `json:"resource_id"`
	OldValues    datatypes.JSON `json:"old_values" gorm:"type:jsonb"`
	NewValues    datatypes.JSON `json:"new_values" gorm:"type:jsonb"`
	IPAddress    *string        `json:"ip_address"`
	UserAgent    *string        `json:"user_agent"`

	// Relations
	SystemUser *SystemUser `json:"system_user,omitempty" gorm:"foreignKey:SystemUserID"`
	Tenant     *Tenant     `json:"tenant,omitempty" gorm:"foreignKey:TenantID"`
}

// UserRole enum for backward compatibility
type UserRole string

const (
	UserRoleSystemAdmin UserRole = "SYSTEM_ADMIN"
	UserRoleTenantAdmin UserRole = "TENANT_ADMIN"
	UserRoleTenantUser  UserRole = "TENANT_USER"
	UserRoleCustomer    UserRole = "CUSTOMER"
)
