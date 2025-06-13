# Hệ thống phân quyền RBAC

## Tổng quan RBAC (Role-Based Access Control)

RBAC là một phương pháp quản lý quyền truy cập dựa trên vai trò (role) của người dùng trong hệ thống. Trong dự án SaaS multi-tenant này, chúng ta có 3 cấp độ phân quyền:

1. **System Level**: Quản trị toàn hệ thống
2. **Tenant Level**: Quản trị trong phạm vi tenant
3. **Customer Level**: Người dùng cuối

## Cấu trúc phân quyền

### 1. System Level (zplus.vn/admin)

#### Super Admin
- **Quyền hạn tối cao** của hệ thống
- **Permissions**:
  - Tạo/xóa/sửa tenant
  - Quản lý tất cả system users
  - Cấu hình system-wide settings
  - Truy cập tất cả tenant data (emergency)
  - Quản lý billing và payments
  - System monitoring và analytics

#### Super Manager  
- **Quyền hạn quản lý** system
- **Permissions**:
  - Xem danh sách tenants
  - Quản lý plans và modules
  - Support và troubleshooting
  - Xem reports và analytics
  - Không thể xóa tenant

```go
const (
    // System Roles
    RoleSuperAdmin   = "super_admin"
    RoleSuperManager = "super_manager"
)

type SystemPermissions struct {
    ManageTenants        bool
    ManageSystemUsers    bool
    ManagePlans          bool
    ManageModules        bool
    ViewSystemAnalytics  bool
    AccessTenantData     bool
    ManageBilling        bool
    SystemConfiguration bool
}
```

### 2. Tenant Level (tenant1.zplus.vn/admin)

#### Tenant Admin
- **Quyền hạn tối cao** trong tenant
- **Permissions**:
  - Quản lý tất cả users trong tenant
  - Cấu hình tenant settings
  - Quản lý subscription và billing
  - Tạo/xóa roles và permissions
  - Quản lý custom domain
  - Access tất cả modules được enable

#### Tenant Manager
- **Quyền hạn quản lý** trong tenant
- **Permissions**:
  - Quản lý users (không bao gồm admin)
  - Sử dụng tất cả modules
  - Xem reports và analytics
  - Quản lý content
  - Không thể thay đổi billing

#### Staff
- **Quyền hạn nhân viên** trong tenant
- **Permissions**:
  - Sử dụng các modules được assign
  - Xem data trong phạm vi role
  - Thực hiện daily operations
  - Không thể quản lý users

```go
const (
    // Tenant Roles
    RoleTenantAdmin   = "tenant_admin"
    RoleTenantManager = "tenant_manager"
    RoleTenantStaff   = "tenant_staff"
)

type TenantPermissions struct {
    ManageUsers          bool
    ManageRoles          bool
    ManageSettings       bool
    ManageBilling        bool
    ManageCustomDomain   bool
    AccessAnalytics      bool
    ManageContent        bool
    UseQRCheckin        bool
    UseLMS              bool
    UseCRM              bool
}
```

### 3. Customer Level (tenant1.zplus.vn/)

#### Premium Customer
- **Khách hàng trả phí cao**
- **Permissions**:
  - Access tất cả features trong gói
  - Priority support
  - Advanced customization
  - API access (nếu có)

#### Standard Customer
- **Khách hàng trả phí cơ bản**
- **Permissions**:
  - Access basic features
  - Standard support
  - Limited customization

#### Free Customer
- **Khách hàng miễn phí**
- **Permissions**:
  - Access limited features
  - Self-service support
  - Basic functionality

```go
const (
    // Customer Roles
    RoleCustomerPremium  = "customer_premium"
    RoleCustomerStandard = "customer_standard"
    RoleCustomerFree     = "customer_free"
)

type CustomerPermissions struct {
    AccessPremiumFeatures bool
    APIAccess            bool
    PrioritySupport      bool
    AdvancedCustomization bool
    FileUploadLimit      int64
    DataExport           bool
}
```

## Database Schema cho RBAC

### 1. System Level Tables
```sql
-- System users table
CREATE TABLE public.system_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System roles table
CREATE TABLE public.system_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    permissions JSONB NOT NULL,
    is_system_role BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Tenant Level Tables (per tenant schema)
```sql
-- Tenant users table
CREATE TABLE tenant_1.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INTEGER REFERENCES tenant_1.roles(id),
    permissions JSONB, -- Additional permissions
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles table per tenant
CREATE TABLE tenant_1.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    permissions JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES tenant_1.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Permissions table
CREATE TABLE tenant_1.permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Role permissions mapping
CREATE TABLE tenant_1.role_permissions (
    role_id INTEGER REFERENCES tenant_1.roles(id),
    permission_id INTEGER REFERENCES tenant_1.permissions(id),
    PRIMARY KEY (role_id, permission_id)
);
```

## Implementation trong Go

### 1. Permission Manager
```go
type PermissionManager struct {
    db    *gorm.DB
    cache map[string][]string // userId -> permissions
    mutex sync.RWMutex
}

type Permission struct {
    Resource string `json:"resource"`
    Action   string `json:"action"`
}

func (pm *PermissionManager) HasPermission(userID string, resource, action string) bool {
    permissions := pm.getUserPermissions(userID)
    
    for _, perm := range permissions {
        if perm == fmt.Sprintf("%s:%s", resource, action) || 
           perm == fmt.Sprintf("%s:*", resource) ||
           perm == "*:*" {
            return true
        }
    }
    return false
}

func (pm *PermissionManager) getUserPermissions(userID string) []string {
    pm.mutex.RLock()
    if perms, exists := pm.cache[userID]; exists {
        pm.mutex.RUnlock()
        return perms
    }
    pm.mutex.RUnlock()
    
    // Load from database
    var user User
    pm.db.Preload("Role.Permissions").First(&user, userID)
    
    var permissions []string
    for _, perm := range user.Role.Permissions {
        permissions = append(permissions, fmt.Sprintf("%s:%s", perm.Resource, perm.Action))
    }
    
    // Cache permissions
    pm.mutex.Lock()
    pm.cache[userID] = permissions
    pm.mutex.Unlock()
    
    return permissions
}
```

### 2. RBAC Middleware
```go
func RBACMiddleware(resource, action string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        // Get user from context
        user := c.Locals("user").(*User)
        if user == nil {
            return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
        }
        
        // Check permission
        permManager := c.Locals("permissionManager").(*PermissionManager)
        if !permManager.HasPermission(fmt.Sprintf("%d", user.ID), resource, action) {
            return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
        }
        
        return c.Next()
    }
}

// Usage
app.Get("/admin/users", 
    AuthMiddleware(),
    RBACMiddleware("users", "read"),
    getUsersHandler,
)

app.Post("/admin/users", 
    AuthMiddleware(),
    RBACMiddleware("users", "create"),
    createUserHandler,
)
```

### 3. Role Management Service
```go
type RoleService struct {
    db          *gorm.DB
    permManager *PermissionManager
}

func (rs *RoleService) CreateRole(tenantID uint, req CreateRoleRequest) (*Role, error) {
    // Validate permissions
    for _, perm := range req.Permissions {
        if !rs.isValidPermission(perm) {
            return nil, ErrInvalidPermission
        }
    }
    
    role := &Role{
        Name:         req.Name,
        DisplayName:  req.DisplayName,
        Permissions:  req.Permissions,
        TenantID:     tenantID,
    }
    
    if err := rs.db.Create(role).Error; err != nil {
        return nil, err
    }
    
    return role, nil
}

func (rs *RoleService) AssignRole(userID, roleID uint) error {
    user := &User{}
    if err := rs.db.First(user, userID).Error; err != nil {
        return err
    }
    
    user.RoleID = roleID
    if err := rs.db.Save(user).Error; err != nil {
        return err
    }
    
    // Clear cache
    rs.permManager.ClearUserCache(fmt.Sprintf("%d", userID))
    
    return nil
}
```

## Permission Definitions

### 1. System Level Permissions
```go
var SystemPermissions = map[string][]string{
    "tenants": {"create", "read", "update", "delete"},
    "system_users": {"create", "read", "update", "delete"},
    "plans": {"create", "read", "update", "delete"},
    "modules": {"create", "read", "update", "delete", "toggle"},
    "billing": {"read", "update", "process"},
    "analytics": {"read", "export"},
    "settings": {"read", "update"},
}
```

### 2. Tenant Level Permissions
```go
var TenantPermissions = map[string][]string{
    "users": {"create", "read", "update", "delete", "invite"},
    "roles": {"create", "read", "update", "delete"},
    "settings": {"read", "update"},
    "billing": {"read", "update"},
    "content": {"create", "read", "update", "delete"},
    "analytics": {"read", "export"},
    "notifications": {"create", "read", "send"},
    "modules": {"use", "configure"},
}
```

### 3. Customer Level Permissions
```go
var CustomerPermissions = map[string][]string{
    "profile": {"read", "update"},
    "subscription": {"read", "update", "cancel"},
    "data": {"create", "read", "update", "delete", "export"},
    "support": {"create_ticket", "read_ticket"},
    "api": {"read", "write"}, // Depending on plan
}
```

## Authorization Flow

### 1. Login Flow
```go
func LoginHandler(c *fiber.Ctx) error {
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
    }
    
    // Authenticate user
    user, err := authService.Authenticate(req.Email, req.Password)
    if err != nil {
        return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
    }
    
    // Generate JWT with roles and permissions
    token, err := jwtService.GenerateToken(user)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Token generation failed"})
    }
    
    return c.JSON(fiber.Map{
        "token": token,
        "user": user,
        "permissions": user.GetPermissions(),
    })
}
```

### 2. JWT Token Structure
```go
type JWTClaims struct {
    UserID      uint     `json:"user_id"`
    TenantID    uint     `json:"tenant_id,omitempty"`
    Role        string   `json:"role"`
    Permissions []string `json:"permissions"`
    jwt.StandardClaims
}

func (js *JWTService) GenerateToken(user *User) (string, error) {
    claims := JWTClaims{
        UserID:      user.ID,
        TenantID:    user.TenantID,
        Role:        user.Role.Name,
        Permissions: user.GetPermissionStrings(),
        StandardClaims: jwt.StandardClaims{
            ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
            IssuedAt:  time.Now().Unix(),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(js.secretKey)
}
```

## Frontend Permission Handling

### 1. React Permission Component
```jsx
import { useAuth } from '@/hooks/useAuth';

const PermissionGuard = ({ resource, action, children, fallback = null }) => {
    const { hasPermission } = useAuth();
    
    if (!hasPermission(resource, action)) {
        return fallback;
    }
    
    return children;
};

// Usage
<PermissionGuard resource="users" action="create">
    <Button onClick={createUser}>Create User</Button>
</PermissionGuard>
```

### 2. Route Protection
```jsx
const ProtectedRoute = ({ children, requiredPermission }) => {
    const { user, hasPermission } = useAuth();
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
        return <Navigate to="/unauthorized" />;
    }
    
    return children;
};
```

## Security Best Practices

### 1. Principle of Least Privilege
- Gán quyền tối thiểu cần thiết
- Regular review và audit permissions
- Temporary permissions với expiration

### 2. Permission Inheritance
- Child roles inherit parent permissions
- Override permissions when needed
- Clear inheritance hierarchy

### 3. Audit Trail
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    tenant_id INTEGER,
    action VARCHAR(100),
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### 4. Session Management
- JWT token với reasonable expiration
- Refresh token mechanism
- Revoke tokens when needed
- Multiple session handling