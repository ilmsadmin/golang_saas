package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Tenant-specific models (tenant schema)

type User struct {
	ID                    uint           `json:"id" gorm:"primaryKey"`
	Email                 string         `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash          string         `json:"-" gorm:"not null"`
	FirstName             string         `json:"first_name"`
	LastName              string         `json:"last_name"`
	AvatarURL             string         `json:"avatar_url"`
	Phone                 string         `json:"phone"`
	RoleID                uint           `json:"role_id"`
	Role                  Role           `json:"role" gorm:"foreignKey:RoleID"`
	AdditionalPermissions datatypes.JSON `json:"additional_permissions" gorm:"type:jsonb"`
	IsActive              bool           `json:"is_active" gorm:"default:true"`
	EmailVerified         bool           `json:"email_verified" gorm:"default:false"`
	EmailVerifiedAt       *time.Time     `json:"email_verified_at"`
	LastLoginAt           *time.Time     `json:"last_login_at"`
	TwoFactorEnabled      bool           `json:"two_factor_enabled" gorm:"default:false"`
	TwoFactorSecret       string         `json:"-"`
	Preferences           datatypes.JSON `json:"preferences" gorm:"type:jsonb"`
	CreatedAt             time.Time      `json:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at"`
	DeletedAt             gorm.DeletedAt `json:"-" gorm:"index"`
}

type Role struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"uniqueIndex;not null"`
	DisplayName string         `json:"display_name" gorm:"not null"`
	Permissions datatypes.JSON `json:"permissions" gorm:"type:jsonb"`
	IsDefault   bool           `json:"is_default" gorm:"default:false"`
	IsSystem    bool           `json:"is_system" gorm:"default:false"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type Permission struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"uniqueIndex;not null"`
	DisplayName string    `json:"display_name" gorm:"not null"`
	Resource    string    `json:"resource" gorm:"not null"`
	Action      string    `json:"action" gorm:"not null"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UserSession struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       uint       `json:"user_id" gorm:"not null"`
	User         User       `json:"user" gorm:"foreignKey:UserID"`
	RefreshToken string     `json:"-" gorm:"not null"`
	IPAddress    string     `json:"ip_address"`
	UserAgent    string     `json:"user_agent"`
	ExpiresAt    time.Time  `json:"expires_at"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	RevokedAt    *time.Time `json:"revoked_at"`
}

type Subscription struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	CustomerID    uint           `json:"customer_id"`
	Customer      User           `json:"customer" gorm:"foreignKey:CustomerID"`
	PlanID        uint           `json:"plan_id"`
	Plan          Plan           `json:"plan" gorm:"foreignKey:PlanID"`
	Status        string         `json:"status" gorm:"default:active"`
	BillingCycle  string         `json:"billing_cycle" gorm:"default:monthly"`
	Price         float64        `json:"price" gorm:"type:decimal(10,2)"`
	StartsAt      time.Time      `json:"starts_at"`
	ExpiresAt     *time.Time     `json:"expires_at"`
	CancelledAt   *time.Time     `json:"cancelled_at"`
	CancellationReason string    `json:"cancellation_reason"`
	Metadata      datatypes.JSON `json:"metadata" gorm:"type:jsonb"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

type Notification struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title" gorm:"not null"`
	Message     string         `json:"message" gorm:"type:text;not null"`
	Type        string         `json:"type" gorm:"default:info"`
	Recipients  datatypes.JSON `json:"recipients" gorm:"type:jsonb"`
	SenderID    uint           `json:"sender_id"`
	Sender      User           `json:"sender" gorm:"foreignKey:SenderID"`
	ScheduledAt *time.Time     `json:"scheduled_at"`
	SentAt      *time.Time     `json:"sent_at"`
	Status      string         `json:"status" gorm:"default:draft"`
	Metadata    datatypes.JSON `json:"metadata" gorm:"type:jsonb"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type UserNotification struct {
	ID             uint         `json:"id" gorm:"primaryKey"`
	UserID         uint         `json:"user_id" gorm:"not null"`
	User           User         `json:"user" gorm:"foreignKey:UserID"`
	NotificationID uint         `json:"notification_id" gorm:"not null"`
	Notification   Notification `json:"notification" gorm:"foreignKey:NotificationID"`
	IsRead         bool         `json:"is_read" gorm:"default:false"`
	ReadAt         *time.Time   `json:"read_at"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

type AuditLog struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	UserID      uint           `json:"user_id"`
	User        User           `json:"user" gorm:"foreignKey:UserID"`
	Action      string         `json:"action" gorm:"not null"`
	Resource    string         `json:"resource" gorm:"not null"`
	ResourceID  string         `json:"resource_id"`
	OldValues   datatypes.JSON `json:"old_values" gorm:"type:jsonb"`
	NewValues   datatypes.JSON `json:"new_values" gorm:"type:jsonb"`
	IPAddress   string         `json:"ip_address"`
	UserAgent   string         `json:"user_agent"`
	CreatedAt   time.Time      `json:"created_at"`
}

// Customer-specific models

type CustomerProfile struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UserID    uint           `json:"user_id" gorm:"uniqueIndex;not null"`
	User      User           `json:"user" gorm:"foreignKey:UserID"`
	Company   string         `json:"company"`
	Address   datatypes.JSON `json:"address" gorm:"type:jsonb"`
	Website   string         `json:"website"`
	BioNote   string         `json:"bio_note" gorm:"type:text"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// Helper methods for models

func (u *User) GetFullName() string {
	return u.FirstName + " " + u.LastName
}

func (u *User) GetPermissions() []string {
	var permissions []string
	
	// Parse role permissions from JSON
	if u.Role.Permissions != nil && len(u.Role.Permissions) > 0 {
		var rolePermissions []string
		if err := json.Unmarshal(u.Role.Permissions, &rolePermissions); err == nil {
			permissions = append(permissions, rolePermissions...)
		}
	}
	
	// Parse additional permissions from JSON
	if u.AdditionalPermissions != nil && len(u.AdditionalPermissions) > 0 {
		var additionalPermissions []string
		if err := json.Unmarshal(u.AdditionalPermissions, &additionalPermissions); err == nil {
			permissions = append(permissions, additionalPermissions...)
		}
	}
	
	return permissions
}

func (t *Tenant) IsActive() bool {
	return t.Status == "active"
}

func (s *Subscription) IsActive() bool {
	return s.Status == "active" && (s.ExpiresAt == nil || s.ExpiresAt.After(time.Now()))
}