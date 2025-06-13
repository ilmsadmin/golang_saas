package middleware

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func RBACMiddleware(resource, action string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check if user is authenticated
		authenticated := c.Locals("authenticated")
		if authenticated == nil || !authenticated.(bool) {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Authentication required",
				},
			})
		}

		// Get user permissions
		permissions, ok := c.Locals("user_permissions").([]string)
		if !ok {
			permissions = []string{}
		}

		// Check if user has required permission
		requiredPermission := fmt.Sprintf("%s:%s", resource, action)
		
		if !hasPermission(permissions, requiredPermission) {
			return c.Status(403).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "FORBIDDEN",
					"message": "Insufficient permissions",
				},
			})
		}

		return c.Next()
	}
}

func hasPermission(userPermissions []string, requiredPermission string) bool {
	for _, permission := range userPermissions {
		// Check for exact match
		if permission == requiredPermission {
			return true
		}
		
		// Check for wildcard permissions
		if permission == "*:*" {
			return true
		}
		
		// Check for resource wildcard (e.g., "users:*")
		parts := strings.Split(permission, ":")
		requiredParts := strings.Split(requiredPermission, ":")
		
		if len(parts) == 2 && len(requiredParts) == 2 {
			if parts[0] == requiredParts[0] && parts[1] == "*" {
				return true
			}
		}
	}
	
	return false
}

func RequireSystemAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check if user is authenticated
		authenticated := c.Locals("authenticated")
		if authenticated == nil || !authenticated.(bool) {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Authentication required",
				},
			})
		}

		// Check if user is system user
		isSystemUser := c.Locals("is_system_user")
		if isSystemUser == nil || !isSystemUser.(bool) {
			return c.Status(403).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "FORBIDDEN",
					"message": "System admin access required",
				},
			})
		}

		// Check role
		role := c.Locals("user_role")
		if role == nil || (role.(string) != "super_admin" && role.(string) != "super_manager") {
			return c.Status(403).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "FORBIDDEN",
					"message": "Super admin privileges required",
				},
			})
		}

		return c.Next()
	}
}

func RequireTenantAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Check if user is authenticated
		authenticated := c.Locals("authenticated")
		if authenticated == nil || !authenticated.(bool) {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Authentication required",
				},
			})
		}

		// Check role
		role := c.Locals("user_role")
		if role == nil || (role.(string) != "tenant_admin" && role.(string) != "tenant_manager") {
			return c.Status(403).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "FORBIDDEN",
					"message": "Tenant admin privileges required",
				},
			})
		}

		return c.Next()
	}
}