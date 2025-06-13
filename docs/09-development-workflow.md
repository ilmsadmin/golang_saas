# Development Workflow

## Quy trình phát triển

Tài liệu này mô tả quy trình phát triển cho dự án SaaS multi-tenant, bao gồm git workflow, code review, testing, và deployment.

## Git Workflow

### 1. Branch Strategy (Git Flow)
```
main
├── develop
├── feature/feature-name
├── release/version-number
└── hotfix/issue-description
```

#### Main Branches
- **main**: Production-ready code
- **develop**: Integration branch cho features

#### Supporting Branches
- **feature/***: New features
- **release/***: Release preparation
- **hotfix/***: Critical fixes

### 2. Naming Conventions

#### Branch Names
```bash
# Features
feature/multi-tenant-routing
feature/rbac-system
feature/qr-checkin-module

# Releases
release/v1.0.0
release/v1.1.0

# Hotfixes
hotfix/security-patch
hotfix/database-connection-fix

# Bug fixes
bugfix/user-permission-error
```

#### Commit Messages
```bash
# Format: type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore

# Examples:
feat(auth): add JWT token refresh mechanism
fix(tenant): resolve subdomain routing issue
docs(api): update authentication endpoints
style(frontend): improve responsive design
refactor(db): optimize tenant schema migration
test(rbac): add permission checking tests
chore(deps): update Go dependencies
```

### 3. Git Hooks

#### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running pre-commit checks..."

# Run linters
echo "Linting Go code..."
if ! gofmt -l . | read; then
    echo "Go code is properly formatted"
else
    echo "Go code needs formatting. Run: gofmt -w ."
    exit 1
fi

echo "Linting TypeScript code..."
cd frontend && npm run lint
if [ $? -ne 0 ]; then
    echo "TypeScript linting failed"
    exit 1
fi

# Run tests
echo "Running tests..."
cd backend && go test ./...
if [ $? -ne 0 ]; then
    echo "Go tests failed"
    exit 1
fi

cd ../frontend && npm run test
if [ $? -ne 0 ]; then
    echo "Frontend tests failed"
    exit 1
fi

echo "All pre-commit checks passed!"
```

#### Pre-push Hook
```bash
#!/bin/sh
# .git/hooks/pre-push

echo "Running pre-push checks..."

# Security scan
echo "Running security scan..."
cd backend && gosec ./...
if [ $? -ne 0 ]; then
    echo "Security scan failed"
    exit 1
fi

# Build check
echo "Testing build..."
cd backend && go build -o /tmp/app .
if [ $? -ne 0 ]; then
    echo "Build failed"
    exit 1
fi

cd ../frontend && npm run build
if [ $? -ne 0 ]; then
    echo "Frontend build failed"
    exit 1
fi

echo "All pre-push checks passed!"
```

## Development Environment Setup

### 1. Required Tools
```bash
# Go tools
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install github.com/securec/gosec/v2/cmd/gosec@latest
go install github.com/cosmtrek/air@latest

# Frontend tools
npm install -g @next/env
npm install -g eslint
npm install -g prettier

# Database tools
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Ubuntu

# Docker
brew install docker docker-compose  # macOS
```

### 2. Environment Variables
```bash
# Create .env files from templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Setup environment switcher
echo 'alias dev-env="export $(cat .env | xargs)"' >> ~/.bashrc
echo 'alias test-env="export $(cat .env.test | xargs)"' >> ~/.bashrc
```

### 3. Database Setup Script
```bash
#!/bin/bash
# scripts/setup-dev-db.sh

DB_NAME="golang_saas_dev"
DB_USER="postgres"
DB_PASSWORD="password"

echo "Setting up development database..."

# Create database
createdb $DB_NAME

# Run migrations
cd backend
go run main.go migrate

# Seed data
go run main.go seed

echo "Development database setup complete!"
```

## Code Standards

### 1. Go Code Standards
```go
// Package documentation
// Package auth provides authentication and authorization functionality
// for the multi-tenant SaaS platform.
package auth

// Struct definitions with proper tags
type User struct {
    ID        uint      `json:"id" gorm:"primaryKey" validate:"omitempty"`
    Email     string    `json:"email" gorm:"uniqueIndex;not null" validate:"required,email"`
    FirstName string    `json:"first_name" gorm:"size:100" validate:"required,min=2,max=50"`
    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// Function documentation
// AuthenticateUser validates user credentials and returns a JWT token.
// It returns an error if the credentials are invalid or if there's a system error.
func AuthenticateUser(email, password string) (*User, string, error) {
    // Validate input
    if email == "" || password == "" {
        return nil, "", ErrInvalidCredentials
    }
    
    // Implementation...
    return user, token, nil
}

// Error definitions
var (
    ErrInvalidCredentials = errors.New("invalid email or password")
    ErrUserNotFound       = errors.New("user not found")
    ErrTokenExpired       = errors.New("token has expired")
)
```

### 2. TypeScript Standards
```typescript
// Interface definitions
interface User {
  readonly id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

// Enum definitions
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  CUSTOMER = 'customer',
}

// Function definitions with proper types
async function authenticateUser(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
  
  if (!response.success) {
    throw new Error(response.error.message);
  }
  
  return response.data;
}

// React component with TypeScript
interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
  loading?: boolean;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onUserSelect,
  loading = false,
}) => {
  // Component implementation
};
```

### 3. Database Standards
```sql
-- Table naming: snake_case, plural
-- Column naming: snake_case
-- Index naming: idx_table_column(s)
-- Foreign key naming: fk_table_referenced_table

CREATE TABLE tenant_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_email ON tenant_users(email);
CREATE INDEX idx_users_tenant_id ON tenant_users(tenant_id);
```

## Testing Strategy

### 1. Backend Testing

#### Unit Tests
```go
// auth_test.go
func TestAuthenticateUser(t *testing.T) {
    tests := []struct {
        name        string
        email       string
        password    string
        expectError bool
        errorType   error
    }{
        {
            name:        "valid credentials",
            email:       "test@example.com",
            password:    "password123",
            expectError: false,
        },
        {
            name:        "invalid email",
            email:       "",
            password:    "password123",
            expectError: true,
            errorType:   ErrInvalidCredentials,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            user, token, err := AuthenticateUser(tt.email, tt.password)
            
            if tt.expectError {
                assert.Error(t, err)
                assert.Equal(t, tt.errorType, err)
                assert.Nil(t, user)
                assert.Empty(t, token)
            } else {
                assert.NoError(t, err)
                assert.NotNil(t, user)
                assert.NotEmpty(t, token)
            }
        })
    }
}
```

#### Integration Tests
```go
// integration_test.go
func TestTenantCreationFlow(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer teardownTestDB(t, db)
    
    // Test data
    tenantData := CreateTenantRequest{
        Name:      "Test Tenant",
        Subdomain: "test",
        PlanID:    1,
    }
    
    // Create tenant
    tenant, err := tenantService.CreateTenant(tenantData)
    assert.NoError(t, err)
    assert.NotNil(t, tenant)
    
    // Verify tenant schema was created
    var schemaExists bool
    db.Raw("SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = ?)", 
           fmt.Sprintf("tenant_%d", tenant.ID)).Scan(&schemaExists)
    assert.True(t, schemaExists)
}
```

### 2. Frontend Testing

#### Unit Tests (Jest + Testing Library)
```typescript
// __tests__/components/UserList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserList } from '../UserList';

const mockUsers: User[] = [
  {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    createdAt: new Date(),
  },
];

describe('UserList', () => {
  it('renders user list correctly', () => {
    const onUserSelect = jest.fn();
    
    render(
      <UserList users={mockUsers} onUserSelect={onUserSelect} />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('calls onUserSelect when user is clicked', () => {
    const onUserSelect = jest.fn();
    
    render(
      <UserList users={mockUsers} onUserSelect={onUserSelect} />
    );
    
    fireEvent.click(screen.getByText('John Doe'));
    expect(onUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });
});
```

#### E2E Tests (Playwright)
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login successfully', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.fill('[data-testid="email"]', 'admin@test.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    await page.fill('[data-testid="email"]', 'invalid@test.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });
});
```

### 3. API Testing
```bash
# Install Newman for Postman collection testing
npm install -g newman

# Run API tests
newman run postman/API_Tests.postman_collection.json \
  --environment postman/Development.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export reports/api-test-report.html
```

## CI/CD Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.19
    
    - name: Cache Go modules
      uses: actions/cache@v3
      with:
        path: ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
    
    - name: Install dependencies
      run: |
        cd backend
        go mod download
    
    - name: Run linter
      run: |
        cd backend
        golangci-lint run
    
    - name: Run security scan
      run: |
        cd backend
        gosec ./...
    
    - name: Run tests
      run: |
        cd backend
        go test -v -race -coverprofile=coverage.out ./...
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.out

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run linter
      run: |
        cd frontend
        npm run lint
    
    - name: Run type check
      run: |
        cd frontend
        npm run type-check
    
    - name: Run tests
      run: |
        cd frontend
        npm run test:ci
    
    - name: Build
      run: |
        cd frontend
        npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Start application
      run: |
        docker-compose -f docker-compose.ci.yml up -d
        sleep 30  # Wait for services to start
    
    - name: Run E2E tests
      run: |
        cd frontend
        npx playwright test
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: frontend/playwright-report/

  deploy:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend, e2e-tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        # Deploy script here
        echo "Deploying to staging..."
    
    - name: Run smoke tests
      run: |
        # Smoke tests after deployment
        echo "Running smoke tests..."
```

### 2. Deployment Scripts

#### Staging Deployment
```bash
#!/bin/bash
# scripts/deploy-staging.sh

set -e

ENVIRONMENT="staging"
DOCKER_REGISTRY="your-registry.com"
VERSION=$(git rev-parse --short HEAD)

echo "Deploying version $VERSION to $ENVIRONMENT..."

# Build and push images
docker build -t $DOCKER_REGISTRY/golang-saas-backend:$VERSION ./backend
docker build -t $DOCKER_REGISTRY/golang-saas-frontend:$VERSION ./frontend

docker push $DOCKER_REGISTRY/golang-saas-backend:$VERSION
docker push $DOCKER_REGISTRY/golang-saas-frontend:$VERSION

# Deploy to staging server
ssh user@staging-server << EOF
    cd /opt/golang-saas
    
    # Update environment file
    export VERSION=$VERSION
    
    # Pull latest images
    docker-compose -f docker-compose.staging.yml pull
    
    # Stop and start services
    docker-compose -f docker-compose.staging.yml down
    docker-compose -f docker-compose.staging.yml up -d
    
    # Run migrations
    docker-compose -f docker-compose.staging.yml exec backend ./main migrate
    
    # Health check
    sleep 30
    curl -f http://localhost:3000/health || exit 1
EOF

echo "Deployment to $ENVIRONMENT completed successfully!"
```

#### Production Deployment
```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

ENVIRONMENT="production"
VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

echo "Deploying version $VERSION to $ENVIRONMENT..."

# Safety checks
read -p "Are you sure you want to deploy to production? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Deployment cancelled"
    exit 1
fi

# Create backup
ssh user@production-server << EOF
    # Backup database
    docker-compose exec postgres pg_dump -U postgres golang_saas > /backups/pre-deploy-$(date +%Y%m%d_%H%M%S).sql
EOF

# Deploy using blue-green strategy
./scripts/blue-green-deploy.sh $VERSION

echo "Production deployment completed!"
```

## Code Review Process

### 1. Pull Request Template
```markdown
<!-- .github/pull_request_template.md -->
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Code is documented
- [ ] Database migrations are backward compatible
- [ ] Security considerations reviewed
- [ ] Performance impact assessed

## Screenshots (if applicable)

## Additional Notes
```

### 2. Review Guidelines
- **Code Quality**: Clean, readable, maintainable
- **Testing**: Adequate test coverage (>80%)
- **Security**: No security vulnerabilities
- **Performance**: No significant performance degradation
- **Documentation**: Code is properly documented
- **Breaking Changes**: Clearly documented

### 3. Approval Process
- **2 approvals required** for main branch
- **1 approval required** for develop branch
- **Code owner approval** for critical components
- **Security review** for authentication/authorization changes

## Documentation Maintenance

### 1. API Documentation
```bash
# Generate API documentation from code
swag init -g main.go -o ./docs/swagger

# Update Postman collection
postman-collection-generator \
  --input ./docs/swagger/swagger.json \
  --output ./postman/API_Collection.json
```

### 2. Database Documentation
```bash
# Generate database documentation
schemaspy -t pgsql -host localhost -db golang_saas -u postgres -p password -o ./docs/database
```

### 3. Frontend Documentation
```bash
# Generate component documentation
cd frontend && npm run storybook:build
```

## Monitoring và Logging

### 1. Application Monitoring
- **Health checks**: `/health` endpoint
- **Metrics**: Prometheus metrics
- **Dashboards**: Grafana dashboards
- **Alerts**: PagerDuty integration

### 2. Log Management
```go
// Structured logging with logrus
logger := logrus.WithFields(logrus.Fields{
    "tenant_id": tenantID,
    "user_id":   userID,
    "action":    "create_user",
})

logger.Info("User created successfully")
```

### 3. Error Tracking
- **Sentry**: Error monitoring
- **Custom metrics**: Business metrics
- **Performance monitoring**: APM tools