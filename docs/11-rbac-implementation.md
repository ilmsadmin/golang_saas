# RBAC Implementation Documentation

## Tổng quan

Hệ thống RBAC (Role-Based Access Control) đã được implement với 2 cấp độ:

### 1. System Level (Quản lý hệ thống)
- **Super Admin**: Toàn quyền hệ thống
- **System Admin**: Quản lý hệ thống 
- **System Manager**: Truy cập hạn chế hệ thống
- **System Support**: Hỗ trợ khách hàng

### 2. Tenant Level (Quản lý tenant)
- **Tenant Admin**: Toàn quyền tenant
- **Tenant Manager**: Quản lý hạn chế tenant
- **Tenant User**: Người dùng thường
- **Customer**: Khách hàng cuối

## Cấu trúc Models

### 1. Core Models

```go
// models/rbac.go
type SystemRole // Enum các role có sẵn
type ResourceType // Enum các resource 
type ActionType // Enum các action
type PermissionScope // Enum scope của permission
type SystemPermission // Struct định nghĩa permission
type CustomerProfile // Model khách hàng cuối
```

### 2. Database Models

```go
// models/system.go (đã cập nhật)
type User {
    // ...existing fields...
    RoleID uuid.UUID
    Role Role
    Permissions []Permission // Direct permissions
}

type Role {
    // ...existing fields...
    IsSystemRole bool
    TenantID *uuid.UUID
    Permissions []Permission
}

type Permission {
    // ...existing fields...
    Resource string
    Action string
    IsSystemPermission bool
}
```

## Services

### 1. RBACService

```go
// services/rbac.go
type RBACService struct {
    db *gorm.DB
}

// Khởi tạo system roles
func (s *RBACService) InitializeSystemRoles() error

// Khởi tạo tenant roles  
func (s *RBACService) InitializeTenantRoles(tenantID uuid.UUID) error

// Kiểm tra quyền user
func (s *RBACService) CheckUserPermission(userID uuid.UUID, permission string, tenantID *uuid.UUID) (bool, error)

// Lấy tất cả quyền của user
func (s *RBACService) GetUserPermissions(userID uuid.UUID) ([]string, error)

// Tạo role tùy chỉnh
func (s *RBACService) CreateCustomRole(tenantID *uuid.UUID, name, description string, permissionNames []string) (*models.Role, error)

// Gán role cho user
func (s *RBACService) AssignRoleToUser(userID, roleID uuid.UUID) error

// Lấy roles theo tenant
func (s *RBACService) GetRolesByTenant(tenantID *uuid.UUID) ([]models.Role, error)
```

## Middleware

### 1. Auth Middleware (đã cập nhật)

```go
// middleware/auth.go

// Kiểm tra quyền cụ thể
func RequirePermission(ctx context.Context, db *gorm.DB, permission string) error

// Kiểm tra quyền hệ thống
func RequireSystemPermission(ctx context.Context, db *gorm.DB, permission string) error

// Kiểm tra quyền tenant
func RequireTenantPermission(ctx context.Context, db *gorm.DB, permission string, tenantID uuid.UUID) error

// Kiểm tra role
func RequireRole(ctx context.Context, role models.SystemRole) error

// Kiểm tra system role
func RequireSystemRole(ctx context.Context) error

// Kiểm tra tenant role
func RequireTenantRole(ctx context.Context, tenantID uuid.UUID) error

// Lấy permissions của user hiện tại
func GetUserPermissions(ctx context.Context, db *gorm.DB) ([]string, error)
```

## GraphQL API

### 1. Schema Updates

```graphql
# Các type mới
type PermissionCheck {
  hasPermission: Boolean!
  permission: String!
  reason: String
}

type CustomerProfile {
  id: ID!
  tenantId: ID!
  email: String!
  firstName: String!
  lastName: String!
  # ...other fields...
}

type RolePermissionMatrix {
  role: String!
  permissions: [String!]!
}

# Queries mới
extend type Query {
  myPermissions: [String!]!
  checkPermission(input: PermissionCheckInput!): PermissionCheck!
  roles(tenantId: ID, pagination: PaginationInput): PaginatedRoles!
  permissions(isSystem: Boolean, pagination: PaginationInput): PaginatedPermissions!
  rolePermissionMatrix: [RolePermissionMatrix!]!
  customers(filter: UserFilter, pagination: PaginationInput): PaginatedCustomers!
}

# Mutations mới  
extend type Mutation {
  assignRole(input: AssignRoleInput!): User!
  assignPermissions(input: AssignPermissionInput!): User!
  revokePermissions(input: AssignPermissionInput!): User!
  createCustomer(input: CreateCustomerInput!): CustomerProfile!
  initializeSystemRoles: Boolean!
  initializeTenantRoles(tenantId: ID!): Boolean!
}
```

### 2. Resolvers

```go
// graph/schema.resolvers.go (đã cập nhật)

// Query resolvers
func (r *queryResolver) MyPermissions(ctx context.Context) ([]string, error)
func (r *queryResolver) CheckPermission(ctx context.Context, input model.PermissionCheckInput) (*model.PermissionCheck, error)
func (r *queryResolver) Roles(ctx context.Context, tenantID *string, pagination *model.PaginationInput) (*model.PaginatedRoles, error)
func (r *queryResolver) Customers(ctx context.Context, filter *model.UserFilter, pagination *model.PaginationInput) (*model.PaginatedCustomers, error)

// Mutation resolvers  
func (r *mutationResolver) AssignRole(ctx context.Context, input model.AssignRoleInput) (*models.User, error)
func (r *mutationResolver) CreateCustomer(ctx context.Context, input model.CreateCustomerInput) (*model.CustomerProfile, error)
func (r *mutationResolver) InitializeSystemRoles(ctx context.Context) (bool, error)
```

## Permissions Matrix

### System Permissions

| Resource | Actions | Description |
|----------|---------|-------------|
| system | manage, view | Quản lý hệ thống |
| tenant | create, read, update, delete, list | Quản lý tenant |
| plan | create, read, update, delete, list | Quản lý gói cước |
| module | create, read, update, delete, list | Quản lý module |
| system_user | create, read, update, delete, list | Quản lý user hệ thống |
| system_role | create, read, update, delete, list | Quản lý role hệ thống |
| subscription | create, read, update, delete, list | Quản lý subscription |
| system_setting | create, read, update, delete | Quản lý cài đặt hệ thống |
| audit_log | read, list | Xem audit log |

### Tenant Permissions

| Resource | Actions | Description |
|----------|---------|-------------|
| tenant_user | create, read, update, delete, list | Quản lý user tenant |
| tenant_role | create, read, update, delete, list | Quản lý role tenant |
| tenant_setting | create, read, update, delete | Quản lý cài đặt tenant |
| tenant_module | read, update, list | Quản lý module tenant |
| domain_mapping | create, read, update, delete | Quản lý domain |
| customer | create, read, update, delete, list | Quản lý khách hàng |
| tenant_data | create, read, update, delete, export, import | Quản lý dữ liệu |
| report | create, read, update, delete, export | Quản lý báo cáo |
| dashboard | read, update | Quản lý dashboard |
| profile | read, update | Quản lý profile cá nhân |

## Sử dụng

### 1. Khởi tạo RBAC System

```bash
# Chạy migration
go run cmd/migrate/main.go

# Khởi tạo RBAC
go run cmd/init-rbac/main.go
```

### 2. Sử dụng trong GraphQL

```graphql
# Kiểm tra quyền hiện tại
query {
  myPermissions
}

# Kiểm tra quyền cụ thể
query {
  checkPermission(input: {
    permission: "tenant_user.create"
    tenantId: "tenant-id"
  }) {
    hasPermission
    reason
  }
}

# Gán role cho user
mutation {
  assignRole(input: {
    userId: "user-id"
    roleId: "role-id"  
  }) {
    id
    role {
      name
      permissions {
        name
      }
    }
  }
}

# Tạo khách hàng (tenant only)
mutation {
  createCustomer(input: {
    tenantId: "tenant-id"
    email: "customer@example.com"
    firstName: "John"
    lastName: "Doe"
  }) {
    id
    email
    tenant {
      name
    }
  }
}
```

### 3. Sử dụng trong Code

```go
// Kiểm tra quyền trong resolver
func (r *mutationResolver) CreateUser(ctx context.Context, input model.CreateUserInput) (*models.User, error) {
    // Kiểm tra quyền dựa trên loại user
    if role.TenantID != nil {
        if err := middleware.RequireTenantPermission(ctx, r.DB, "tenant_user.create", *role.TenantID); err != nil {
            return nil, err
        }
    } else {
        if err := middleware.RequireSystemPermission(ctx, r.DB, "system_user.create"); err != nil {
            return nil, err
        }
    }
    
    // Logic tạo user...
}
```

## Luồng hoạt động

### 1. System Admin Flow

1. System Admin login vào `/system`
2. Có quyền quản lý tenants, plans, modules
3. Có thể tạo/sửa/xóa tenants
4. Có thể xem tất cả users, audit logs
5. Tenants được xem như customers

### 2. Tenant Admin Flow  

1. Tenant Admin login vào `/[tenantSlug]`
2. Có quyền quản lý users, roles trong tenant
3. Có thể tạo/sửa customers (end users)
4. Có thể cấu hình tenant settings, modules
5. Customers là người dùng cuối của business

### 3. Customer Flow

1. Customer login vào `/[tenantSlug]` 
2. Chỉ có quyền xem dashboard, update profile
3. Không có quyền admin/management
4. Là end-user của tenant business

## Migration và Setup

Để implement RBAC hoàn chỉnh:

1. Chạy database migration để tạo tables
2. Chạy RBAC initialization để tạo roles/permissions
3. Tạo super admin user đầu tiên
4. Setup routing phân biệt system vs tenant
5. Implement frontend components cho từng role level

Hệ thống RBAC này cung cấp flexibility cao để quản lý phân quyền ở cả 2 cấp độ System và Tenant, đáp ứng yêu cầu multi-tenant SaaS platform.
