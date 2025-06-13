# Kiến trúc hệ thống

## Tổng quan kiến trúc

Hệ thống được thiết kế theo mô hình microservices với multi-tenant architecture, đảm bảo scalability và isolation giữa các tenant.

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer / CDN                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 Reverse Proxy (Nginx)                      │
│           Subdomain/Domain Routing Logic                   │
└─────────┬───────────────────────────────┬───────────────────┘
          │                               │
    ┌─────┴─────┐                  ┌─────┴─────┐
    │  System   │                  │  Tenant   │
    │  Domain   │                  │ Subdomains│
    │zplus.vn   │                  │tenant1.zplus.vn│
    └─────┬─────┘                  └─────┬─────┘
          │                               │
┌─────────┴───────────────────────────────┴───────────────────┐
│                Backend Services (Fiber Go)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Auth      │ │   Tenant    │ │   Module    │          │
│  │  Service    │ │  Service    │ │  Services   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────┬───────────────────────────────┬───────────────────┘
          │                               │
┌─────────┴─────┐                  ┌─────┴─────┐
│   Database    │                  │   Cache   │
│ (PostgreSQL)  │                  │  (Redis)  │
└───────────────┘                  └───────────┘
```

## Layers Architecture

### 1. Presentation Layer
- **Next.js Frontend**: Server-side rendering
- **Responsive Design**: Mobile-first approach
- **Multi-theme Support**: Per-tenant customization

### 2. API Gateway Layer
- **Routing**: Subdomain-based tenant resolution
- **Authentication**: JWT token validation
- **Rate Limiting**: Per-tenant limits
- **Request/Response Transformation**

### 3. Business Logic Layer
- **Fiber Go Services**: High-performance HTTP framework
- **Service-oriented Architecture**: Modular design
- **Event-driven Communication**: Redis pub/sub

### 4. Data Access Layer
- **GORM**: Object-relational mapping
- **Repository Pattern**: Data access abstraction
- **Multi-tenant Data Isolation**: Schema/database per tenant

### 5. Infrastructure Layer
- **Docker Containers**: Service containerization
- **Redis**: Caching và session management
- **PostgreSQL**: Primary database
- **File Storage**: Static assets và uploads

## Service Components

### Core Services

#### 1. Authentication Service
```go
type AuthService struct {
    UserRepo     UserRepository
    TenantRepo   TenantRepository
    TokenManager TokenManager
    Cache        RedisClient
}
```
**Responsibilities:**
- User authentication và authorization
- JWT token management
- Session management
- Password reset và email verification

#### 2. Tenant Service
```go
type TenantService struct {
    TenantRepo   TenantRepository
    DomainRepo   DomainRepository
    PlanRepo     PlanRepository
}
```
**Responsibilities:**
- Tenant lifecycle management
- Subdomain/domain configuration
- Tenant settings và configuration
- Billing và subscription management

#### 3. User Management Service
```go
type UserService struct {
    UserRepo UserRepository
    RoleRepo RoleRepository
    RBAC     RBACManager
}
```
**Responsibilities:**
- User CRUD operations
- Role và permission management
- Profile management
- User activity tracking

#### 4. Module Services
Các module có thể được bật/tắt cho từng tenant:

- **QR Check-in Module**: Event attendance tracking
- **LMS Module**: Learning management system
- **CRM Module**: Customer relationship management
- **Notification Module**: Email/SMS notifications
- **Analytics Module**: Reporting và dashboard

## Data Architecture

### Multi-tenant Data Strategy

#### 1. Shared Database, Separate Schemas
```sql
-- Database structure
main_db/
├── public/          -- System-wide tables
│   ├── tenants
│   ├── plans
│   └── modules
├── tenant_1/        -- Tenant 1 schema
│   ├── users
│   ├── roles
│   └── data_tables
└── tenant_2/        -- Tenant 2 schema
    ├── users
    ├── roles
    └── data_tables
```

#### 2. Tenant Resolution Flow
```go
func ResolveTenant(domain string) (*Tenant, error) {
    // Extract subdomain or custom domain
    // Query tenant from database
    // Cache tenant info in Redis
    // Return tenant context
}
```

## Security Architecture

### 1. Multi-layer Security
- **Network Level**: VPC, Security Groups
- **Application Level**: WAF, HTTPS
- **Database Level**: Encryption at rest
- **API Level**: Rate limiting, Input validation

### 2. Tenant Isolation
- **Data Isolation**: Schema-based separation
- **Resource Isolation**: Per-tenant resource limits
- **Code Isolation**: Tenant context in all operations

### 3. Authentication Flow
```
Client → API Gateway → Auth Service → JWT Validation → RBAC Check → Service
```

## Scalability Considerations

### Horizontal Scaling
- **Load Balancers**: Distribute traffic
- **Database Replicas**: Read replicas cho performance
- **Cache Clusters**: Redis cluster for session data
- **CDN**: Static asset distribution

### Vertical Scaling
- **Resource Monitoring**: CPU, Memory, Disk usage
- **Auto-scaling**: Based on metrics
- **Database Optimization**: Query optimization, indexing

## Deployment Architecture

### Production Environment
```yaml
# docker-compose.yml structure
version: '3.8'
services:
  nginx:          # Reverse proxy
  backend:        # Fiber Go application
  frontend:       # Next.js application
  postgres:       # Primary database
  redis:          # Cache và sessions
  monitoring:     # Prometheus/Grafana
```

### Development Environment
- **Local Docker**: Simplified setup
- **Hot Reload**: Development efficiency
- **Test Database**: Separate test environment