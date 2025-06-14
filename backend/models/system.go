package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// BaseModel contains common fields for all models
type BaseModel struct {
	ID        uuid.UUID      `json:"id" gorm:"type:char(36);primary_key"`
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
	TenantID  *uuid.UUID `json:"tenant_id" gorm:"type:char(36);index"`
	RoleID    uuid.UUID  `json:"role_id" gorm:"type:char(36);not null"`

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
	TenantID     *uuid.UUID `json:"tenant_id" gorm:"type:char(36);index"`

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
	Name      string                 `json:"name" gorm:"not null"`
	Slug      string                 `json:"slug" gorm:"uniqueIndex;not null"`
	Domain    *string                `json:"domain"`
	Subdomain string                 `json:"subdomain" gorm:"uniqueIndex;not null"`
	Status    TenantStatus           `json:"status" gorm:"default:ACTIVE"`
	Settings  datatypes.JSON         `json:"settings" gorm:"type:jsonb"`

	// Relations
	Users        []User         `json:"users,omitempty" gorm:"foreignKey:TenantID"`
	Roles        []Role         `json:"roles,omitempty" gorm:"foreignKey:TenantID"`
	Subscription *Subscription  `json:"subscription,omitempty" gorm:"foreignKey:TenantID"`
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
	TenantID            uuid.UUID          `json:"tenant_id" gorm:"type:char(36);not null;index"`
	PlanID              uuid.UUID          `json:"plan_id" gorm:"type:char(36);not null"`
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
	Name        string                 `json:"name" gorm:"not null"`
	Description *string                `json:"description"`
	Price       float64                `json:"price" gorm:"not null"`
	Features    datatypes.JSON         `json:"features" gorm:"type:jsonb"`
	MaxUsers    int                    `json:"max_users" gorm:"default:10"`

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

// UserRole enum for backward compatibility
type UserRole string

const (
	UserRoleSystemAdmin UserRole = "SYSTEM_ADMIN"
	UserRoleTenantAdmin UserRole = "TENANT_ADMIN"
	UserRoleTenantUser  UserRole = "TENANT_USER"
	UserRoleCustomer    UserRole = "CUSTOMER"
)

// Input/Output types for services
type CreateTenantInput struct {
	Name           string                 `json:"name"`
	Slug           string                 `json:"slug"`
	Domain         *string                `json:"domain,omitempty"`
	Subdomain      string                 `json:"subdomain"`
	AdminEmail     string                 `json:"adminEmail"`
	AdminPassword  string                 `json:"adminPassword"`
	AdminFirstName string                 `json:"adminFirstName"`
	AdminLastName  string                 `json:"adminLastName"`
	PlanID         string                 `json:"planId"`
	Settings       datatypes.JSON         `json:"settings,omitempty"`
}

type UpdateTenantInput struct {
	Name     *string        `json:"name,omitempty"`
	Domain   *string        `json:"domain,omitempty"`
	Status   *TenantStatus  `json:"status,omitempty"`
	Settings *datatypes.JSON `json:"settings,omitempty"`
}

type TenantFilter struct {
	Status *TenantStatus `json:"status,omitempty"`
	Name   *string       `json:"name,omitempty"`
}

type PaginationInput struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

type PaginatedTenants struct {
	Tenants    []Tenant `json:"tenants"`
	Total      int      `json:"total"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
	TotalPages int      `json:"totalPages"`
}
