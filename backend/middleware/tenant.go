package middleware

import (
	"fmt"

	"golang_saas/utils"

	"github.com/gofiber/fiber/v2"
)

func TenantMiddleware() fiber.Handler {
	tenantResolver := utils.NewTenantResolver()
	
	return func(c *fiber.Ctx) error {
		host := c.Hostname()
		
		// Check if this is a tenant request
		if utils.IsTenantDomain(host) {
			tenant, err := tenantResolver.ResolveTenant(host)
			if err != nil {
				return c.Status(404).JSON(fiber.Map{
					"success": false,
					"error": fiber.Map{
						"code":    "TENANT_NOT_FOUND",
						"message": "Tenant not found",
					},
				})
			}
			
			// Check if tenant is active
			if !tenant.IsActive() {
				return c.Status(403).JSON(fiber.Map{
					"success": false,
					"error": fiber.Map{
						"code":    "TENANT_INACTIVE",
						"message": "Tenant is not active",
					},
				})
			}
			
			// Set tenant context
			c.Locals("tenant", tenant)
			c.Locals("tenant_id", tenant.ID)
			c.Locals("tenant_schema", fmt.Sprintf("tenant_%d", tenant.ID))
			c.Locals("is_tenant_request", true)
		} else {
			// System request
			c.Locals("is_system_request", true)
		}
		
		return c.Next()
	}
}

func RequireTenant() fiber.Handler {
	return func(c *fiber.Ctx) error {
		tenant := c.Locals("tenant")
		if tenant == nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "TENANT_REQUIRED",
					"message": "This endpoint requires a tenant context",
				},
			})
		}
		return c.Next()
	}
}

func RequireSystem() fiber.Handler {
	return func(c *fiber.Ctx) error {
		isSystemRequest := c.Locals("is_system_request")
		if isSystemRequest == nil || !isSystemRequest.(bool) {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "SYSTEM_REQUIRED",
					"message": "This endpoint requires system-level access",
				},
			})
		}
		return c.Next()
	}
}