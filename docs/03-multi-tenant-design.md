# Thiết kế Multi-Tenant

## Khái niệm Multi-Tenant

Multi-tenancy là một kiến trúc phần mềm cho phép một instance duy nhất của ứng dụng phục vụ nhiều khách hàng (tenant). Mỗi tenant được cách ly logically và chia sẻ tài nguyên hạ tầng.

## Strategies cho Multi-Tenant

### 1. Shared Database, Shared Schema
- **Pros**: Chi phí thấp nhất, dễ maintain
- **Cons**: Khó customization, security risk
- **Không áp dụng cho dự án này**

### 2. Shared Database, Separate Schema (Được chọn)
- **Pros**: Balance giữa cost và isolation
- **Cons**: Phức tạp hơn trong migration
- **Lý do chọn**: Phù hợp với yêu cầu business

### 3. Separate Database
- **Pros**: Isolation tốt nhất
- **Cons**: Chi phí cao, khó maintain
- **Có thể áp dụng cho enterprise tenants**

## Tenant Resolution

### 1. Subdomain-based Resolution
```go
type TenantResolver struct {
    tenantCache map[string]*Tenant
    db          *gorm.DB
    redis       *redis.Client
}

func (tr *TenantResolver) ResolveTenant(host string) (*Tenant, error) {
    subdomain := extractSubdomain(host)
    
    // Check cache first
    if tenant, exists := tr.tenantCache[subdomain]; exists {
        return tenant, nil
    }
    
    // Query from database
    tenant, err := tr.getTenantFromDB(subdomain)
    if err != nil {
        return nil, err
    }
    
    // Cache for future requests
    tr.cacheTenant(subdomain, tenant)
    return tenant, nil
}

func extractSubdomain(host string) string {
    parts := strings.Split(host, ".")
    if len(parts) >= 3 {
        return parts[0] // tenant1 from tenant1.zplus.vn
    }
    return ""
}
```

### 2. Custom Domain Support
```go
type DomainMapping struct {
    ID           uint   `gorm:"primaryKey"`
    Domain       string `gorm:"uniqueIndex"`
    TenantID     uint   
    Tenant       Tenant
    IsActive     bool
    SSLEnabled   bool
    CreatedAt    time.Time
}

func (tr *TenantResolver) ResolveByCustomDomain(domain string) (*Tenant, error) {
    var mapping DomainMapping
    err := tr.db.Where("domain = ? AND is_active = true", domain).
               Preload("Tenant").First(&mapping).Error
    if err != nil {
        return nil, err
    }
    return &mapping.Tenant, nil
}
```

## Database Schema Design

### System-wide Tables (public schema)
```sql
-- Tenants table
CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    plan_id INTEGER REFERENCES plans(id),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Plans table
CREATE TABLE public.plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    features JSONB,
    max_users INTEGER,
    storage_limit_gb INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System users (super admin, etc.)
CREATE TABLE public.system_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Tenant-specific Schema
```sql
-- Create schema for each tenant
CREATE SCHEMA tenant_1;

-- Users trong tenant schema
CREATE TABLE tenant_1.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INTEGER REFERENCES tenant_1.roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles trong tenant schema  
CREATE TABLE tenant_1.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Tenant Context Management

### 1. Middleware cho Tenant Resolution
```go
func TenantMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        host := c.Hostname()
        
        // Resolve tenant from host
        tenant, err := resolveTenant(host)
        if err != nil {
            return c.Status(404).JSON(fiber.Map{
                "error": "Tenant not found",
            })
        }
        
        // Set tenant in context
        c.Locals("tenant", tenant)
        c.Locals("tenant_schema", fmt.Sprintf("tenant_%d", tenant.ID))
        
        return c.Next()
    }
}
```

### 2. Database Connection per Tenant
```go
type TenantDB struct {
    systemDB *gorm.DB
    tenantDBs map[uint]*gorm.DB
    mutex    sync.RWMutex
}

func (tdb *TenantDB) GetTenantDB(tenantID uint) *gorm.DB {
    tdb.mutex.RLock()
    db, exists := tdb.tenantDBs[tenantID]
    tdb.mutex.RUnlock()
    
    if exists {
        return db
    }
    
    // Create new connection with tenant schema
    tdb.mutex.Lock()
    defer tdb.mutex.Unlock()
    
    db = tdb.systemDB.Session(&gorm.Session{})
    schemaName := fmt.Sprintf("tenant_%d", tenantID)
    db.Exec(fmt.Sprintf("SET search_path TO %s", schemaName))
    
    tdb.tenantDBs[tenantID] = db
    return db
}
```

## Tenant Provisioning

### 1. Tenant Creation Flow
```go
type TenantProvisioningService struct {
    db           *gorm.DB
    migrator     TenantMigrator
    domainService DomainService
}

func (tps *TenantProvisioningService) CreateTenant(req CreateTenantRequest) (*Tenant, error) {
    // 1. Validate subdomain availability
    if err := tps.validateSubdomain(req.Subdomain); err != nil {
        return nil, err
    }
    
    // 2. Create tenant record
    tenant := &Tenant{
        Name:      req.Name,
        Subdomain: req.Subdomain,
        PlanID:    req.PlanID,
        Status:    "provisioning",
    }
    
    if err := tps.db.Create(tenant).Error; err != nil {
        return nil, err
    }
    
    // 3. Create tenant schema
    if err := tps.migrator.CreateTenantSchema(tenant.ID); err != nil {
        // Rollback tenant creation
        tps.db.Delete(tenant)
        return nil, err
    }
    
    // 4. Initialize default data
    if err := tps.initializeTenantData(tenant); err != nil {
        // Cleanup
        return nil, err
    }
    
    // 5. Configure subdomain
    if err := tps.domainService.ConfigureSubdomain(req.Subdomain); err != nil {
        return nil, err
    }
    
    // 6. Update status to active
    tenant.Status = "active"
    tps.db.Save(tenant)
    
    return tenant, nil
}
```

### 2. Schema Migration cho Tenant
```go
type TenantMigrator struct {
    db *gorm.DB
}

func (tm *TenantMigrator) CreateTenantSchema(tenantID uint) error {
    schemaName := fmt.Sprintf("tenant_%d", tenantID)
    
    // Create schema
    if err := tm.db.Exec(fmt.Sprintf("CREATE SCHEMA %s", schemaName)).Error; err != nil {
        return err
    }
    
    // Set search path
    db := tm.db.Session(&gorm.Session{})
    db.Exec(fmt.Sprintf("SET search_path TO %s", schemaName))
    
    // Run migrations
    err := db.AutoMigrate(
        &User{},
        &Role{},
        &Permission{},
        // Add other tenant-specific models
    )
    
    return err
}
```

## Subdomain Configuration

### 1. Nginx Configuration
```nginx
# /etc/nginx/sites-available/saas-platform
server {
    listen 80;
    server_name *.zplus.vn zplus.vn;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Custom domain support
server {
    listen 80;
    server_name ~^(?<custom_domain>.+)$;
    
    # Check if custom domain is mapped
    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Custom-Domain $custom_domain;
    }
}
```

### 2. DNS Wildcard Configuration
```bash
# DNS Records for *.zplus.vn
*.zplus.vn.    A    203.0.113.1
zplus.vn.      A    203.0.113.1
```

## Tenant Isolation

### 1. Data Isolation
- **Schema-level separation**: Mỗi tenant có schema riêng
- **Query validation**: Đảm bảo queries chỉ access tenant data
- **Backup per tenant**: Separate backup strategy

### 2. Resource Isolation
```go
type TenantLimits struct {
    MaxUsers        int
    StorageLimit    int64  // bytes
    APICallsPerHour int
    MaxDomains      int
}

func (tl *TenantLimits) CheckUserLimit(tenantID uint, currentUsers int) error {
    if currentUsers >= tl.MaxUsers {
        return ErrUserLimitExceeded
    }
    return nil
}
```

### 3. Feature Isolation
```go
type TenantFeatures struct {
    QRCheckin    bool
    LMS          bool
    CRM          bool
    CustomDomain bool
    APIAccess    bool
}

func (tf *TenantFeatures) IsFeatureEnabled(feature string) bool {
    switch feature {
    case "qr_checkin":
        return tf.QRCheckin
    case "lms":
        return tf.LMS
    case "crm":
        return tf.CRM
    default:
        return false
    }
}
```

## Performance Considerations

### 1. Caching Strategy
- **Tenant metadata**: Cache trong Redis
- **User sessions**: Per-tenant session storage
- **Query results**: Cache với tenant prefix

### 2. Connection Pooling
- **Per-tenant connection pools**: Avoid connection leaks
- **Connection limits**: Per-tenant limits
- **Pool monitoring**: Health checks

### 3. Monitoring
- **Per-tenant metrics**: Resource usage tracking
- **Performance monitoring**: Query performance per tenant
- **Alert system**: Tenant-specific alerts