package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// System-wide models (public schema)

type Tenant struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	Name           string         `json:"name" gorm:"not null"`
	Subdomain      string         `json:"subdomain" gorm:"uniqueIndex;not null"`
	CustomDomains  datatypes.JSON `json:"custom_domains" gorm:"type:jsonb"`
	PlanID         uint           `json:"plan_id"`
	Plan           Plan           `json:"plan" gorm:"foreignKey:PlanID"`
	Status         string         `json:"status" gorm:"default:active"`
	Settings       datatypes.JSON `json:"settings" gorm:"type:jsonb"`
	BillingInfo    datatypes.JSON `json:"billing_info" gorm:"type:jsonb"`
	ResourceLimits datatypes.JSON `json:"resource_limits" gorm:"type:jsonb"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

type Plan struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Price       float64        `json:"price" gorm:"type:decimal(10,2)"`
	BillingCycle string        `json:"billing_cycle" gorm:"default:monthly"`
	Features    datatypes.JSON `json:"features" gorm:"type:jsonb"`
	MaxUsers    int            `json:"max_users"`
	StorageGB   int            `json:"storage_gb"`
	IsActive    bool           `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type Module struct {
	ID                  string         `json:"id" gorm:"primaryKey"`
	Name                string         `json:"name" gorm:"not null"`
	Description         string         `json:"description"`
	Version             string         `json:"version" gorm:"default:1.0.0"`
	IsActive            bool           `json:"is_active" gorm:"default:true"`
	ConfigurationSchema datatypes.JSON `json:"configuration_schema" gorm:"type:jsonb"`
	Dependencies        datatypes.JSON `json:"dependencies" gorm:"type:jsonb"`
	Pricing             datatypes.JSON `json:"pricing" gorm:"type:jsonb"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
}

type TenantModule struct {
	TenantID      uint           `json:"tenant_id" gorm:"primaryKey"`
	ModuleID      string         `json:"module_id" gorm:"primaryKey"`
	Tenant        Tenant         `json:"tenant" gorm:"foreignKey:TenantID"`
	Module        Module         `json:"module" gorm:"foreignKey:ModuleID"`
	IsEnabled     bool           `json:"is_enabled" gorm:"default:true"`
	Configuration datatypes.JSON `json:"configuration" gorm:"type:jsonb"`
	EnabledAt     time.Time      `json:"enabled_at"`
}

type SystemUser struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Email        string         `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string         `json:"-" gorm:"not null"`
	FirstName    string         `json:"first_name"`
	LastName     string         `json:"last_name"`
	Role         string         `json:"role" gorm:"not null"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	LastLoginAt  *time.Time     `json:"last_login_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

type DomainMapping struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Domain       string         `json:"domain" gorm:"uniqueIndex;not null"`
	TenantID     uint           `json:"tenant_id"`
	Tenant       Tenant         `json:"tenant" gorm:"foreignKey:TenantID"`
	IsPrimary    bool           `json:"is_primary" gorm:"default:false"`
	SSLEnabled   bool           `json:"ssl_enabled" gorm:"default:false"`
	SSLCert      string         `json:"ssl_certificate"`
	Status       string         `json:"status" gorm:"default:pending"`
	VerifiedAt   *time.Time     `json:"verified_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

type SystemAuditLog struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id"`
	User        SystemUser     `json:"user" gorm:"foreignKey:UserID"`
	Action      string         `json:"action" gorm:"not null"`
	Resource    string         `json:"resource" gorm:"not null"`
	ResourceID  string         `json:"resource_id"`
	OldValues   datatypes.JSON `json:"old_values" gorm:"type:jsonb"`
	NewValues   datatypes.JSON `json:"new_values" gorm:"type:jsonb"`
	IPAddress   string         `json:"ip_address"`
	UserAgent   string         `json:"user_agent"`
	CreatedAt   time.Time      `json:"created_at"`
}