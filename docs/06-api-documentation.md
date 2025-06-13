# API Documentation

## API Overview

RESTful API được xây dựng với Fiber Go framework, hỗ trợ multi-tenant architecture với subdomain-based tenant resolution.

## Base URLs

### System API
```
https://zplus.vn/api/v1
```

### Tenant API
```
https://{tenant}.zplus.vn/api/v1
```

## Authentication

### JWT Token Authentication
Tất cả protected routes yêu cầu JWT token trong header:

```http
Authorization: Bearer <jwt_token>
```

### Token Structure
```json
{
  "user_id": 123,
  "tenant_id": 456,
  "role": "tenant_admin",
  "permissions": ["users:read", "users:create"],
  "exp": 1640995200,
  "iat": 1640908800
}
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Email is required"]
    }
  },
  "timestamp": "2023-12-01T10:00:00Z"
}
```

## System API Endpoints

### Authentication

#### POST /auth/login
System user login

**Request:**
```json
{
  "email": "admin@zplus.vn",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@zplus.vn",
      "first_name": "System",
      "last_name": "Admin",
      "role": "super_admin"
    },
    "permissions": ["*:*"]
  }
}
```

#### POST /auth/refresh
Refresh JWT token

**Request:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

#### POST /auth/logout
Logout và invalidate token

### Tenant Management

#### GET /tenants
List all tenants (Super Admin only)

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (active, inactive, suspended)
- `search`: Search by name or subdomain

**Response:**
```json
{
  "success": true,
  "data": {
    "tenants": [
      {
        "id": 1,
        "name": "Tenant One",
        "subdomain": "tenant1",
        "plan": {
          "id": 1,
          "name": "Pro Plan",
          "price": 99.99
        },
        "status": "active",
        "users_count": 25,
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10
    }
  }
}
```

#### POST /tenants
Create new tenant

**Request:**
```json
{
  "name": "New Tenant",
  "subdomain": "newtenant",
  "plan_id": 1,
  "admin_email": "admin@newtenant.com",
  "admin_password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": 2,
      "name": "New Tenant",
      "subdomain": "newtenant",
      "status": "active"
    },
    "admin_user": {
      "id": 1,
      "email": "admin@newtenant.com",
      "role": "tenant_admin"
    }
  }
}
```

#### GET /tenants/{id}
Get tenant details

#### PUT /tenants/{id}
Update tenant

#### DELETE /tenants/{id}
Delete tenant (soft delete)

#### POST /tenants/{id}/suspend
Suspend tenant

#### POST /tenants/{id}/activate
Activate tenant

### Plan Management

#### GET /plans
List all subscription plans

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Starter",
      "price": 29.99,
      "billing_cycle": "monthly",
      "features": {
        "max_users": 10,
        "storage_gb": 5,
        "modules": ["user_management", "basic_analytics"]
      }
    },
    {
      "id": 2,
      "name": "Pro",
      "price": 99.99,
      "billing_cycle": "monthly",
      "features": {
        "max_users": 100,
        "storage_gb": 50,
        "modules": ["user_management", "analytics", "qr_checkin", "crm"]
      }
    }
  ]
}
```

#### POST /plans
Create new plan

#### PUT /plans/{id}
Update plan

#### DELETE /plans/{id}
Delete plan

### Module Management

#### GET /modules
List all available modules

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "qr_checkin",
      "name": "QR Check-in",
      "description": "Event attendance tracking with QR codes",
      "version": "1.0.0",
      "is_active": true
    },
    {
      "id": "lms",
      "name": "Learning Management System",
      "description": "Complete LMS solution",
      "version": "1.2.0",
      "is_active": true
    }
  ]
}
```

#### POST /tenants/{id}/modules
Enable/disable modules for tenant

**Request:**
```json
{
  "modules": [
    {
      "module_id": "qr_checkin",
      "enabled": true
    },
    {
      "module_id": "lms",
      "enabled": false
    }
  ]
}
```

## Tenant API Endpoints

### Authentication

#### POST /auth/login
Tenant user login

**Request:**
```json
{
  "email": "user@tenant1.com",
  "password": "password123"
}
```

#### POST /auth/register
Customer registration (if enabled)

**Request:**
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "plan_id": 1
}
```

#### POST /auth/forgot-password
Reset password request

#### POST /auth/reset-password
Reset password with token

### User Management

#### GET /users
List tenant users

**Query Parameters:**
- `role`: Filter by role
- `status`: Filter by status
- `search`: Search by name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@tenant1.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": {
          "id": 1,
          "name": "tenant_admin",
          "display_name": "Administrator"
        },
        "status": "active",
        "last_login": "2023-12-01T09:00:00Z",
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### POST /users
Create new user

**Request:**
```json
{
  "email": "newuser@tenant1.com",
  "password": "securepassword",
  "first_name": "Jane",
  "last_name": "Smith",
  "role_id": 2,
  "send_invitation": true
}
```

#### GET /users/{id}
Get user details

#### PUT /users/{id}
Update user

#### DELETE /users/{id}
Delete user

#### POST /users/{id}/activate
Activate user

#### POST /users/{id}/deactivate
Deactivate user

### Role Management

#### GET /roles
List tenant roles

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "tenant_admin",
      "display_name": "Administrator",
      "permissions": [
        "users:*",
        "roles:*",
        "settings:*"
      ],
      "users_count": 2,
      "is_default": true
    }
  ]
}
```

#### POST /roles
Create custom role

**Request:**
```json
{
  "name": "content_manager",
  "display_name": "Content Manager",
  "permissions": [
    "content:create",
    "content:read",
    "content:update",
    "users:read"
  ]
}
```

#### PUT /roles/{id}
Update role

#### DELETE /roles/{id}
Delete role

### Customer Management

#### GET /customers
List customers

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "email": "customer@example.com",
        "first_name": "Customer",
        "last_name": "One",
        "subscription": {
          "plan": "Pro Plan",
          "status": "active",
          "expires_at": "2024-01-01T00:00:00Z"
        },
        "created_at": "2023-06-01T00:00:00Z"
      }
    ]
  }
}
```

#### GET /customers/{id}
Get customer details

#### PUT /customers/{id}
Update customer

#### POST /customers/{id}/suspend
Suspend customer

### Subscription Management

#### GET /subscriptions
List subscriptions

#### POST /subscriptions
Create subscription for customer

**Request:**
```json
{
  "customer_id": 1,
  "plan_id": 2,
  "billing_cycle": "monthly"
}
```

#### PUT /subscriptions/{id}
Update subscription

#### POST /subscriptions/{id}/cancel
Cancel subscription

### Settings

#### GET /settings
Get tenant settings

**Response:**
```json
{
  "success": true,
  "data": {
    "general": {
      "name": "Tenant One",
      "description": "Our company description",
      "logo_url": "https://cdn.zplus.vn/logos/tenant1.png",
      "primary_color": "#3B82F6",
      "secondary_color": "#10B981"
    },
    "features": {
      "allow_registration": true,
      "require_email_verification": true,
      "two_factor_auth": false
    },
    "notifications": {
      "email_notifications": true,
      "sms_notifications": false
    }
  }
}
```

#### PUT /settings
Update tenant settings

### Notifications

#### GET /notifications
List notifications

#### POST /notifications
Create notification

**Request:**
```json
{
  "title": "System Maintenance",
  "message": "Scheduled maintenance tonight at 2 AM",
  "type": "info",
  "recipients": {
    "type": "all_users"
  },
  "schedule_at": "2023-12-01T14:00:00Z"
}
```

#### PUT /notifications/{id}
Update notification

#### DELETE /notifications/{id}
Delete notification

#### POST /notifications/{id}/send
Send notification

## Customer API Endpoints

### Profile Management

#### GET /profile
Get customer profile

#### PUT /profile
Update profile

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "preferences": {
    "theme": "dark",
    "language": "en",
    "email_notifications": true
  }
}
```

#### POST /profile/avatar
Upload avatar

### Subscription

#### GET /subscription
Get current subscription

#### POST /subscription/upgrade
Upgrade subscription

#### POST /subscription/cancel
Cancel subscription

### Usage & Analytics

#### GET /usage
Get usage statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "current_period": {
      "start_date": "2023-12-01T00:00:00Z",
      "end_date": "2023-12-31T23:59:59Z",
      "api_calls": 1500,
      "storage_used_mb": 250,
      "users_count": 5
    },
    "limits": {
      "api_calls": 10000,
      "storage_mb": 1000,
      "users": 10
    }
  }
}
```

## Webhooks

### Webhook Events

#### tenant.created
Triggered when new tenant is created

#### tenant.suspended
Triggered when tenant is suspended

#### subscription.created
Triggered when subscription is created

#### subscription.cancelled
Triggered when subscription is cancelled

#### user.registered
Triggered when new user registers

### Webhook Payload Format
```json
{
  "event": "tenant.created",
  "data": {
    "tenant": { ... },
    "timestamp": "2023-12-01T10:00:00Z"
  },
  "webhook_id": "wh_1234567890"
}
```

## Rate Limiting

### Limits by Plan

#### Free Plan
- 1,000 API calls/hour
- 10,000 API calls/month

#### Pro Plan
- 10,000 API calls/hour
- 1,000,000 API calls/month

#### Enterprise Plan
- 100,000 API calls/hour
- Unlimited monthly calls

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Codes

### Authentication Errors
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Token invalid
- `AUTH_004`: Insufficient permissions

### Validation Errors
- `VAL_001`: Required field missing
- `VAL_002`: Invalid email format
- `VAL_003`: Password too weak
- `VAL_004`: Invalid data type

### Business Logic Errors
- `BIZ_001`: Tenant not found
- `BIZ_002`: User limit exceeded
- `BIZ_003`: Feature not enabled
- `BIZ_004`: Subscription expired

### System Errors
- `SYS_001`: Database connection error
- `SYS_002`: External service unavailable
- `SYS_003`: Rate limit exceeded

## SDKs và Libraries

### Go SDK
```go
import "github.com/zplus/golang-saas-sdk"

client := saas.NewClient("your-api-key")
tenants, err := client.Tenants.List()
```

### JavaScript SDK
```javascript
import { SaaSClient } from '@zplus/saas-sdk';

const client = new SaaSClient('your-api-key');
const tenants = await client.tenants.list();
```

### Python SDK
```python
from zplus_saas import SaaSClient

client = SaaSClient('your-api-key')
tenants = client.tenants.list()
```

## Testing

### Test API Keys
- Test System Key: `test_sk_1234567890`
- Test Tenant Key: `test_tk_1234567890`

### Test Environment
- Base URL: `https://api-test.zplus.vn`
- Tenant URL: `https://{tenant}.test.zplus.vn`