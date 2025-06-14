package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// Tenant-specific models and data structures

// TenantUser represents tenant-specific user data
type TenantUser struct {
	BaseModel
	UserID           uuid.UUID      `json:"user_id" gorm:"type:char(36);not null;index"`
	TenantID         uuid.UUID      `json:"tenant_id" gorm:"type:char(36);not null;index"`
	AvatarURL        *string        `json:"avatar_url"`
	Phone            *string        `json:"phone"`
	Preferences      datatypes.JSON `json:"preferences" gorm:"type:jsonb"`
	LastLoginAt      *time.Time     `json:"last_login_at"`
	TwoFactorEnabled bool           `json:"two_factor_enabled" gorm:"default:false"`

	// Relations
	User   User   `json:"user" gorm:"foreignKey:UserID"`
	Tenant Tenant `json:"tenant" gorm:"foreignKey:TenantID"`
}

// TenantSettings represents tenant-specific configuration
type TenantSettings struct {
	BaseModel
	TenantID uuid.UUID      `json:"tenant_id" gorm:"type:char(36);not null;uniqueIndex"`
	Key      string         `json:"key" gorm:"not null"`
	Value    datatypes.JSON `json:"value" gorm:"type:jsonb"`

	// Relations
	Tenant Tenant `json:"tenant" gorm:"foreignKey:TenantID"`
}

// TenantModule represents modules enabled for a tenant
type TenantModule struct {
	TenantID      uuid.UUID      `json:"tenant_id" gorm:"type:char(36);primary_key"`
	ModuleID      string         `json:"module_id" gorm:"primary_key"`
	IsEnabled     bool           `json:"is_enabled" gorm:"default:true"`
	Configuration datatypes.JSON `json:"configuration" gorm:"type:jsonb"`
	EnabledAt     time.Time      `json:"enabled_at" gorm:"autoCreateTime"`

	// Relations
	Tenant Tenant `json:"tenant" gorm:"foreignKey:TenantID"`
}

// Module represents available system modules
type Module struct {
	ID                  string         `json:"id" gorm:"primary_key"`
	Name                string         `json:"name" gorm:"not null"`
	Description         *string        `json:"description"`
	Version             string         `json:"version" gorm:"default:1.0.0"`
	IsActive            bool           `json:"is_active" gorm:"default:true"`
	ConfigurationSchema datatypes.JSON `json:"configuration_schema" gorm:"type:jsonb"`
	Dependencies        datatypes.JSON `json:"dependencies" gorm:"type:jsonb"`
	Pricing             datatypes.JSON `json:"pricing" gorm:"type:jsonb"`
	CreatedAt           time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
}

// DomainMapping represents custom domain mappings for tenants
type DomainMapping struct {
	BaseModel
	Domain     string     `json:"domain" gorm:"uniqueIndex;not null"`
	TenantID   uuid.UUID  `json:"tenant_id" gorm:"type:char(36);not null"`
	IsPrimary  bool       `json:"is_primary" gorm:"default:false"`
	SSLEnabled bool       `json:"ssl_enabled" gorm:"default:false"`
	Status     string     `json:"status" gorm:"default:pending"`
	VerifiedAt *time.Time `json:"verified_at"`

	// Relations
	Tenant Tenant `json:"tenant" gorm:"foreignKey:TenantID"`
}

// AuditLog represents audit trail for tenant operations
type AuditLog struct {
	BaseModel
	TenantID   uuid.UUID      `json:"tenant_id" gorm:"type:char(36);not null;index"`
	UserID     uuid.UUID      `json:"user_id" gorm:"type:char(36);not null"`
	Action     string         `json:"action" gorm:"not null"`
	Resource   string         `json:"resource" gorm:"not null"`
	ResourceID *string        `json:"resource_id"`
	OldValues  datatypes.JSON `json:"old_values" gorm:"type:jsonb"`
	NewValues  datatypes.JSON `json:"new_values" gorm:"type:jsonb"`
	IPAddress  *string        `json:"ip_address"`
	UserAgent  *string        `json:"user_agent"`

	// Relations
	Tenant Tenant `json:"tenant" gorm:"foreignKey:TenantID"`
	User   User   `json:"user" gorm:"foreignKey:UserID"`
}
