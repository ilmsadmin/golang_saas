package middleware

import (
	"context"
	"strings"

	"golang_saas/models"
	"golang_saas/services"
	"golang_saas/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserContextKey is the key used to store user in context
type contextKey string

const (
	UserContextKey   contextKey = "user"
	ClaimsContextKey contextKey = "claims"
)

// AuthMiddleware for GraphQL
func AuthMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.Next()
			return
		}

		token := tokenParts[1]

		// Validate JWT token
		claims, err := utils.ValidateJWT(token)
		if err != nil {
			c.Next()
			return
		}

		// Get user from database
		var user models.User
		userUUID, err := uuid.Parse(claims.UserID)
		if err != nil {
			c.Next()
			return
		}

		err = db.Preload("Role").Preload("Role.Permissions").First(&user, "id = ?", userUUID).Error
		if err != nil {
			c.Next()
			return
		}

		// Store user and claims in context
		ctx := context.WithValue(c.Request.Context(), UserContextKey, &user)
		ctx = context.WithValue(ctx, ClaimsContextKey, claims)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// GetUserFromContext extracts user from GraphQL context
func GetUserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value(UserContextKey).(*models.User)
	return user, ok
}

// GetClaimsFromContext extracts JWT claims from GraphQL context
func GetClaimsFromContext(ctx context.Context) (*utils.Claims, bool) {
	claims, ok := ctx.Value(ClaimsContextKey).(*utils.Claims)
	return claims, ok
}

// RequireAuth ensures user is authenticated
func RequireAuth(ctx context.Context) (*models.User, error) {
	user, ok := GetUserFromContext(ctx)
	if !ok || user == nil {
		return nil, ErrUnauthorized
	}
	return user, nil
}

// RequirePermission checks if user has specific permission
func RequirePermission(ctx context.Context, db *gorm.DB, permission string) error {
	user, err := RequireAuth(ctx)
	if err != nil {
		return err
	}

	rbacService := services.NewRBACService(db)
	hasPermission, err := rbacService.CheckUserPermission(user.ID, permission, user.TenantID)
	if err != nil {
		return &AuthError{Code: "PERMISSION_CHECK_FAILED", Message: "Failed to check permissions"}
	}

	if !hasPermission {
		return ErrForbidden
	}

	return nil
}

// RequireSystemPermission checks if user has specific system permission
func RequireSystemPermission(ctx context.Context, db *gorm.DB, permission string) error {
	user, err := RequireAuth(ctx)
	if err != nil {
		return err
	}

	// System users only
	if user.TenantID != nil {
		return &AuthError{Code: "SYSTEM_ACCESS_REQUIRED", Message: "System access required"}
	}

	rbacService := services.NewRBACService(db)
	hasPermission, err := rbacService.CheckUserPermission(user.ID, permission, nil)
	if err != nil {
		return &AuthError{Code: "PERMISSION_CHECK_FAILED", Message: "Failed to check permissions"}
	}

	if !hasPermission {
		return ErrForbidden
	}

	return nil
}

// RequireTenantPermission checks if user has specific tenant permission
func RequireTenantPermission(ctx context.Context, db *gorm.DB, permission string, tenantID uuid.UUID) error {
	user, err := RequireAuth(ctx)
	if err != nil {
		return err
	}

	// System users can access any tenant
	if user.TenantID == nil {
		// Check if user has system permission to manage tenants
		rbacService := services.NewRBACService(db)
		hasSystemAccess, err := rbacService.CheckUserPermission(user.ID, "tenant.manage", nil)
		if err != nil {
			return &AuthError{Code: "PERMISSION_CHECK_FAILED", Message: "Failed to check permissions"}
		}
		if hasSystemAccess {
			return nil
		}
		return ErrForbidden
	}

	// Check tenant access
	if *user.TenantID != tenantID {
		return &AuthError{Code: "TENANT_ACCESS_DENIED", Message: "Access to tenant denied"}
	}

	rbacService := services.NewRBACService(db)
	hasPermission, err := rbacService.CheckUserPermission(user.ID, permission, &tenantID)
	if err != nil {
		return &AuthError{Code: "PERMISSION_CHECK_FAILED", Message: "Failed to check permissions"}
	}

	if !hasPermission {
		return ErrForbidden
	}

	return nil
}

// RequireRole checks if user has specific role
func RequireRole(ctx context.Context, role models.SystemRole) error {
	user, err := RequireAuth(ctx)
	if err != nil {
		return err
	}

	if user.Role.Name != string(role) {
		return &AuthError{Code: "ROLE_REQUIRED", Message: "Required role not found"}
	}

	return nil
}

// RequireSystemRole checks if user has any system role
func RequireSystemRole(ctx context.Context) error {
	user, err := RequireAuth(ctx)
	if err != nil {
		return err
	}

	// System users have no tenant ID
	if user.TenantID != nil {
		return &AuthError{Code: "SYSTEM_ROLE_REQUIRED", Message: "System role required"}
	}

	if !user.Role.IsSystemRole {
		return &AuthError{Code: "SYSTEM_ROLE_REQUIRED", Message: "System role required"}
	}

	return nil
}

// RequireTenantRole checks if user has tenant role and belongs to specific tenant
func RequireTenantRole(ctx context.Context, tenantID uuid.UUID) error {
	user, err := RequireAuth(ctx)
	if err != nil {
		return err
	}

	// System users can access any tenant
	if user.TenantID == nil && user.Role.IsSystemRole {
		return nil
	}

	// Check tenant access
	if user.TenantID == nil || *user.TenantID != tenantID {
		return &AuthError{Code: "TENANT_ACCESS_DENIED", Message: "Access to tenant denied"}
	}

	return nil
}

// GetUserPermissions returns all permissions for the current user
func GetUserPermissions(ctx context.Context, db *gorm.DB) ([]string, error) {
	user, err := RequireAuth(ctx)
	if err != nil {
		return nil, err
	}

	rbacService := services.NewRBACService(db)
	permissions, err := rbacService.GetUserPermissions(user.ID)
	if err != nil {
		return nil, &AuthError{Code: "PERMISSION_FETCH_FAILED", Message: "Failed to fetch permissions"}
	}

	return permissions, nil
}

// RequirePermission checks if user has specific permission (legacy function, updated)
func RequirePermissionLegacy(ctx context.Context, permission string) error {
	claims, ok := GetClaimsFromContext(ctx)
	if !ok || claims == nil {
		return ErrUnauthorized
	}

	for _, perm := range claims.Permissions {
		if perm == permission {
			return nil
		}
	}

	return ErrForbidden
}

// RequireTenantAccess ensures user has access to specific tenant
func RequireTenantAccess(ctx context.Context, tenantID uuid.UUID) error {
	user, err := RequireAuth(ctx)
	if err != nil {
		return err
	}

	claims, ok := GetClaimsFromContext(ctx)
	if !ok || claims == nil {
		return ErrUnauthorized
	}

	// System users can access any tenant
	if claims.IsSystem {
		return nil
	}

	// Check if user belongs to the tenant
	if user.TenantID == nil || *user.TenantID != tenantID {
		return ErrForbidden
	}

	return nil
}

// Custom errors
var (
	ErrUnauthorized = &AuthError{Code: "UNAUTHORIZED", Message: "Authentication required"}
	ErrForbidden    = &AuthError{Code: "FORBIDDEN", Message: "Access denied"}
)

type AuthError struct {
	Code    string
	Message string
}

func (e *AuthError) Error() string {
	return e.Message
}
