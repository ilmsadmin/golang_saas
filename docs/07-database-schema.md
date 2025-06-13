# Database Schema

## Overview

Database được thiết kế với multi-tenant architecture sử dụng shared database với separate schema cho mỗi tenant. PostgreSQL được sử dụng làm primary database.

## Schema Structure

```
main_database/
├── public/              # System-wide tables
│   ├── tenants         # Tenant information
│   ├── plans           # Subscription plans
│   ├── modules         # Available modules
│   ├── system_users    # System administrators
│   └── audit_logs      # System audit trail
├── tenant_1/           # Tenant 1 schema
│   ├── users           # Tenant users
│   ├── roles           # Tenant roles
│   ├── permissions     # Tenant permissions
│   └── data_tables     # Tenant-specific data
└── tenant_n/           # Additional tenant schemas
    └── ...
```

## System-wide Tables (public schema)

### tenants
Stores information about all tenants in the system.

```sql
CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domains TEXT[], -- Array of custom domains
    plan_id INTEGER REFERENCES public.plans(id),
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, inactive
    settings JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}',
    resource_limits JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_plan_id ON public.tenants(plan_id);
CREATE INDEX idx_tenants_created_at ON public.tenants(created_at);
```

### plans
Subscription plans available for tenants.

```sql
CREATE TABLE public.plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Example plan features and limits
/*
{
  "features": {
    "max_users": 100,
    "storage_gb": 50,
    "api_calls_per_hour": 10000,
    "custom_domain": true,
    "white_label": false,
    "priority_support": true
  },
  "modules": ["user_management", "analytics", "qr_checkin", "crm"]
}
*/
```

### modules
Available modules that can be enabled for tenants.

```sql
CREATE TABLE public.modules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    configuration_schema JSONB DEFAULT '{}',
    dependencies TEXT[], -- Array of module dependencies
    pricing JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Example modules
INSERT INTO public.modules (id, name, description) VALUES
('user_management', 'User Management', 'Basic user and role management'),
('qr_checkin', 'QR Check-in', 'Event attendance tracking with QR codes'),
('lms', 'Learning Management System', 'Complete LMS solution'),
('crm', 'Customer Relationship Management', 'CRM system'),
('analytics', 'Analytics Dashboard', 'Advanced analytics and reporting');
```

### tenant_modules
Mapping between tenants and enabled modules.

```sql
CREATE TABLE public.tenant_modules (
    tenant_id INTEGER REFERENCES public.tenants(id) ON DELETE CASCADE,
    module_id VARCHAR(50) REFERENCES public.modules(id),
    is_enabled BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    enabled_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (tenant_id, module_id)
);
```

### system_users
System administrators who manage the platform.

```sql
CREATE TABLE public.system_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL, -- super_admin, super_manager
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_system_users_email ON public.system_users(email);
CREATE INDEX idx_system_users_role ON public.system_users(role);
```

### domain_mappings
Custom domain mappings for tenants.

```sql
CREATE TABLE public.domain_mappings (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(255) UNIQUE NOT NULL,
    tenant_id INTEGER REFERENCES public.tenants(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    ssl_enabled BOOLEAN DEFAULT false,
    ssl_certificate TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, failed
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_domain_mappings_domain ON public.domain_mappings(domain);
CREATE INDEX idx_domain_mappings_tenant_id ON public.domain_mappings(tenant_id);
```

### system_audit_logs
Audit trail for system-level operations.

```sql
CREATE TABLE public.system_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.system_users(id),
    tenant_id INTEGER REFERENCES public.tenants(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_system_audit_logs_user_id ON public.system_audit_logs(user_id);
CREATE INDEX idx_system_audit_logs_action ON public.system_audit_logs(action);
CREATE INDEX idx_system_audit_logs_created_at ON public.system_audit_logs(created_at);
```

## Tenant-specific Tables

Each tenant has its own schema with the following structure:

### users
Users within the tenant.

```sql
CREATE TABLE tenant_1.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    role_id INTEGER REFERENCES tenant_1.roles(id),
    additional_permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    password_changed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP NULL
);

-- Indexes
CREATE INDEX idx_tenant_users_email ON tenant_1.users(email);
CREATE INDEX idx_tenant_users_role_id ON tenant_1.users(role_id);
CREATE INDEX idx_tenant_users_status ON tenant_1.users(is_active);
```

### roles
Roles within the tenant.

```sql
CREATE TABLE tenant_1.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    is_system_role BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES tenant_1.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(name)
);

-- Default roles
INSERT INTO tenant_1.roles (name, display_name, permissions, is_default, is_system_role) VALUES
('tenant_admin', 'Administrator', '{"*": ["*"]}', true, true),
('tenant_manager', 'Manager', '{"users": ["read"], "content": ["*"], "analytics": ["read"]}', false, true),
('customer_premium', 'Premium Customer', '{"profile": ["*"], "api": ["read", "write"]}', false, true),
('customer_standard', 'Standard Customer', '{"profile": ["*"]}', true, true);
```

### permissions
Available permissions within the tenant.

```sql
CREATE TABLE tenant_1.permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(resource, action)
);

-- Common permissions
INSERT INTO tenant_1.permissions (name, resource, action, description) VALUES
('users_create', 'users', 'create', 'Create new users'),
('users_read', 'users', 'read', 'View user information'),
('users_update', 'users', 'update', 'Update user information'),
('users_delete', 'users', 'delete', 'Delete users'),
('roles_create', 'roles', 'create', 'Create new roles'),
('roles_read', 'roles', 'read', 'View role information'),
('roles_update', 'roles', 'update', 'Update role information'),
('roles_delete', 'roles', 'delete', 'Delete roles'),
('settings_read', 'settings', 'read', 'View tenant settings'),
('settings_update', 'settings', 'update', 'Update tenant settings');
```

### user_sessions
Active user sessions.

```sql
CREATE TABLE tenant_1.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES tenant_1.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenant_sessions_user_id ON tenant_1.user_sessions(user_id);
CREATE INDEX idx_tenant_sessions_token_hash ON tenant_1.user_sessions(token_hash);
CREATE INDEX idx_tenant_sessions_expires_at ON tenant_1.user_sessions(expires_at);
```

### subscriptions
Customer subscriptions within the tenant.

```sql
CREATE TABLE tenant_1.subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES tenant_1.users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES public.plans(id),
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired, suspended
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    billing_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenant_subscriptions_user_id ON tenant_1.subscriptions(user_id);
CREATE INDEX idx_tenant_subscriptions_status ON tenant_1.subscriptions(status);
CREATE INDEX idx_tenant_subscriptions_period_end ON tenant_1.subscriptions(current_period_end);
```

### notifications
Notifications within the tenant.

```sql
CREATE TABLE tenant_1.notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    recipients JSONB NOT NULL, -- {"type": "all_users"} or {"user_ids": [1,2,3]}
    channels JSONB DEFAULT '["in_app"]', -- ["in_app", "email", "sms"]
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, failed
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES tenant_1.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### user_notifications
Individual user notifications.

```sql
CREATE TABLE tenant_1.user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES tenant_1.users(id) ON DELETE CASCADE,
    notification_id INTEGER REFERENCES tenant_1.notifications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenant_user_notifications_user_id ON tenant_1.user_notifications(user_id);
CREATE INDEX idx_tenant_user_notifications_is_read ON tenant_1.user_notifications(is_read);
```

### audit_logs
Audit trail for tenant operations.

```sql
CREATE TABLE tenant_1.audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES tenant_1.users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tenant_audit_logs_user_id ON tenant_1.audit_logs(user_id);
CREATE INDEX idx_tenant_audit_logs_action ON tenant_1.audit_logs(action);
CREATE INDEX idx_tenant_audit_logs_created_at ON tenant_1.audit_logs(created_at);
```

## GORM Models

### System Models

```go
// Tenant model
type Tenant struct {
    ID             uint                   `json:"id" gorm:"primaryKey"`
    Name           string                 `json:"name" gorm:"not null"`
    Subdomain      string                 `json:"subdomain" gorm:"uniqueIndex;not null"`
    CustomDomains  []string               `json:"custom_domains" gorm:"type:text[]"`
    PlanID         uint                   `json:"plan_id"`
    Plan           Plan                   `json:"plan" gorm:"foreignKey:PlanID"`
    Status         string                 `json:"status" gorm:"default:active"`
    Settings       datatypes.JSON         `json:"settings" gorm:"type:jsonb"`
    BillingInfo    datatypes.JSON         `json:"billing_info" gorm:"type:jsonb"`
    ResourceLimits datatypes.JSON         `json:"resource_limits" gorm:"type:jsonb"`
    CreatedAt      time.Time              `json:"created_at"`
    UpdatedAt      time.Time              `json:"updated_at"`
    DeletedAt      gorm.DeletedAt         `json:"deleted_at" gorm:"index"`
    
    // Associations
    DomainMappings []DomainMapping        `json:"domain_mappings" gorm:"foreignKey:TenantID"`
    TenantModules  []TenantModule         `json:"tenant_modules" gorm:"foreignKey:TenantID"`
}

// Plan model
type Plan struct {
    ID           uint           `json:"id" gorm:"primaryKey"`
    Name         string         `json:"name" gorm:"not null"`
    Slug         string         `json:"slug" gorm:"uniqueIndex;not null"`
    Description  string         `json:"description"`
    Price        float64        `json:"price" gorm:"type:decimal(10,2)"`
    BillingCycle string         `json:"billing_cycle" gorm:"default:monthly"`
    Features     datatypes.JSON `json:"features" gorm:"type:jsonb"`
    Limits       datatypes.JSON `json:"limits" gorm:"type:jsonb"`
    IsActive     bool           `json:"is_active" gorm:"default:true"`
    SortOrder    int            `json:"sort_order" gorm:"default:0"`
    CreatedAt    time.Time      `json:"created_at"`
    UpdatedAt    time.Time      `json:"updated_at"`
}

// Module model
type Module struct {
    ID                    string         `json:"id" gorm:"primaryKey"`
    Name                  string         `json:"name" gorm:"not null"`
    Description           string         `json:"description"`
    Version               string         `json:"version" gorm:"default:1.0.0"`
    IsActive              bool           `json:"is_active" gorm:"default:true"`
    ConfigurationSchema   datatypes.JSON `json:"configuration_schema" gorm:"type:jsonb"`
    Dependencies          []string       `json:"dependencies" gorm:"type:text[]"`
    Pricing               datatypes.JSON `json:"pricing" gorm:"type:jsonb"`
    CreatedAt             time.Time      `json:"created_at"`
    UpdatedAt             time.Time      `json:"updated_at"`
}
```

### Tenant Models

```go
// User model (tenant-specific)
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
    TwoFactorEnabled      bool           `json:"two_factor_enabled" gorm:"default:false"`
    TwoFactorSecret       string         `json:"-"`
    LastLogin             *time.Time     `json:"last_login"`
    LoginCount            int            `json:"login_count" gorm:"default:0"`
    PasswordChangedAt     time.Time      `json:"password_changed_at"`
    CreatedAt             time.Time      `json:"created_at"`
    UpdatedAt             time.Time      `json:"updated_at"`
    DeletedAt             gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Role model (tenant-specific)
type Role struct {
    ID           uint           `json:"id" gorm:"primaryKey"`
    Name         string         `json:"name" gorm:"uniqueIndex;not null"`
    DisplayName  string         `json:"display_name"`
    Description  string         `json:"description"`
    Permissions  datatypes.JSON `json:"permissions" gorm:"type:jsonb"`
    IsDefault    bool           `json:"is_default" gorm:"default:false"`
    IsSystemRole bool           `json:"is_system_role" gorm:"default:false"`
    CreatedBy    uint           `json:"created_by"`
    CreatedAt    time.Time      `json:"created_at"`
    UpdatedAt    time.Time      `json:"updated_at"`
    
    // Associations
    Users []User `json:"users" gorm:"foreignKey:RoleID"`
}

// Subscription model (tenant-specific)
type Subscription struct {
    ID                   uint           `json:"id" gorm:"primaryKey"`
    UserID               uint           `json:"user_id"`
    User                 User           `json:"user" gorm:"foreignKey:UserID"`
    PlanID               uint           `json:"plan_id"`
    Plan                 Plan           `json:"plan" gorm:"foreignKey:PlanID"`
    Status               string         `json:"status" gorm:"default:active"`
    CurrentPeriodStart   time.Time      `json:"current_period_start"`
    CurrentPeriodEnd     time.Time      `json:"current_period_end"`
    CancelAtPeriodEnd    bool           `json:"cancel_at_period_end" gorm:"default:false"`
    CancelledAt          *time.Time     `json:"cancelled_at"`
    TrialStart           *time.Time     `json:"trial_start"`
    TrialEnd             *time.Time     `json:"trial_end"`
    BillingInfo          datatypes.JSON `json:"billing_info" gorm:"type:jsonb"`
    Metadata             datatypes.JSON `json:"metadata" gorm:"type:jsonb"`
    CreatedAt            time.Time      `json:"created_at"`
    UpdatedAt            time.Time      `json:"updated_at"`
}
```

## Database Migrations

### System Migration
```go
func MigrateSystem(db *gorm.DB) error {
    return db.AutoMigrate(
        &Tenant{},
        &Plan{},
        &Module{},
        &TenantModule{},
        &SystemUser{},
        &DomainMapping{},
        &SystemAuditLog{},
    )
}
```

### Tenant Migration
```go
func MigrateTenant(db *gorm.DB, tenantID uint) error {
    schemaName := fmt.Sprintf("tenant_%d", tenantID)
    
    // Create schema
    if err := db.Exec(fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", schemaName)).Error; err != nil {
        return err
    }
    
    // Set search path
    db = db.Session(&gorm.Session{})
    db.Exec(fmt.Sprintf("SET search_path TO %s", schemaName))
    
    // Run migrations
    return db.AutoMigrate(
        &User{},
        &Role{},
        &Permission{},
        &UserSession{},
        &Subscription{},
        &Notification{},
        &UserNotification{},
        &AuditLog{},
    )
}
```

## Database Indexes và Performance

### Recommended Indexes
```sql
-- System tables
CREATE INDEX CONCURRENTLY idx_tenants_composite ON public.tenants(status, plan_id, created_at);
CREATE INDEX CONCURRENTLY idx_audit_logs_composite ON public.system_audit_logs(tenant_id, action, created_at);

-- Tenant tables (create for each tenant)
CREATE INDEX CONCURRENTLY idx_users_composite ON tenant_1.users(is_active, role_id, created_at);
CREATE INDEX CONCURRENTLY idx_sessions_cleanup ON tenant_1.user_sessions(expires_at, is_revoked);
CREATE INDEX CONCURRENTLY idx_notifications_delivery ON tenant_1.user_notifications(user_id, is_read, created_at);
```

### Partitioning Strategy
```sql
-- Partition audit logs by month
CREATE TABLE public.audit_logs_template (
    LIKE public.system_audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE public.audit_logs_2023_12 PARTITION OF public.audit_logs_template
    FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');
```

## Backup Strategy

### Full Backup
```bash
pg_dump -h localhost -U postgres -d golang_saas > backup_full.sql
```

### Schema-specific Backup
```bash
pg_dump -h localhost -U postgres -d golang_saas -n tenant_1 > backup_tenant_1.sql
```

### Point-in-time Recovery
```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'
```