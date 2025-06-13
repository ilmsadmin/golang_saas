package routes

import (
	"golang_saas/handlers"
	"golang_saas/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	systemHandler := handlers.NewSystemHandler()
	tenantHandler := handlers.NewTenantHandler()

	// API routes with tenant middleware applied to all
	api := app.Group("/api/v1")

	// Unified auth routes (work for both system and tenant based on context)
	auth := api.Group("/auth")
	auth.Post("/login", func(c *fiber.Ctx) error {
		// Route based on context set by tenant middleware
		isSystemRequest := c.Locals("is_system_request")
		isTenantRequest := c.Locals("is_tenant_request")

		if isTenantRequest != nil && isTenantRequest.(bool) {
			return tenantHandler.Login(c)
		} else if isSystemRequest != nil && isSystemRequest.(bool) {
			return systemHandler.Login(c)
		}

		// Default fallback - determine by host
		host := c.Hostname()
		if host == "localhost" || host == "localhost:3000" {
			return systemHandler.Login(c)
		}

		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Cannot determine request type",
			},
		})
	})
	
	auth.Post("/refresh", func(c *fiber.Ctx) error {
		isSystemRequest := c.Locals("is_system_request")
		isTenantRequest := c.Locals("is_tenant_request")

		if isTenantRequest != nil && isTenantRequest.(bool) {
			return tenantHandler.RefreshToken(c)
		} else if isSystemRequest != nil && isSystemRequest.(bool) {
			return systemHandler.RefreshToken(c)
		}

		host := c.Hostname()
		if host == "localhost" || host == "localhost:3000" {
			return systemHandler.RefreshToken(c)
		}

		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Cannot determine request type",
			},
		})
	})
	
	auth.Post("/logout", middleware.AuthMiddleware(), func(c *fiber.Ctx) error {
		isSystemRequest := c.Locals("is_system_request")
		isTenantRequest := c.Locals("is_tenant_request")

		if isTenantRequest != nil && isTenantRequest.(bool) {
			return tenantHandler.Logout(c)
		} else if isSystemRequest != nil && isSystemRequest.(bool) {
			return systemHandler.Logout(c)
		}

		host := c.Hostname()
		if host == "localhost" || host == "localhost:3000" {
			return systemHandler.Logout(c)
		}

		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Cannot determine request type",
			},
		})
	})

	// System-only routes (require system context)
	systemRoutes := api.Group("", middleware.RequireSystem(), middleware.AuthMiddleware(), middleware.RequireSystemAdmin())
	
	// Tenant management
	tenants := systemRoutes.Group("/tenants")
	tenants.Get("/", systemHandler.GetTenants)
	tenants.Get("/:id", systemHandler.GetTenant)
	tenants.Post("/", systemHandler.CreateTenant)
	tenants.Put("/:id", systemHandler.UpdateTenant)
	tenants.Delete("/:id", systemHandler.DeleteTenant)
	tenants.Post("/:id/suspend", systemHandler.SuspendTenant)
	tenants.Post("/:id/activate", systemHandler.ActivateTenant)

	// Tenant-only routes (require tenant context)
	tenantRoutes := api.Group("", middleware.RequireTenant(), middleware.AuthMiddleware())

	// User management (admin only)
	users := tenantRoutes.Group("/users", middleware.RequireTenantAdmin())
	users.Get("/", tenantHandler.GetUsers)
	users.Get("/:id", tenantHandler.GetUser)
	users.Post("/", tenantHandler.CreateUser)
	users.Put("/:id", tenantHandler.UpdateUser)
	users.Delete("/:id", tenantHandler.DeleteUser)
	users.Post("/:id/activate", tenantHandler.ActivateUser)
	users.Post("/:id/deactivate", tenantHandler.DeactivateUser)

	// TODO: Add more routes
	// - Plans management (system)
	// - Modules management (system)
	// - Roles management (tenant)
	// - Customer management (tenant)
	// - Subscription management (tenant)
	// - Settings management (tenant)
	// - Notifications management (tenant)
}