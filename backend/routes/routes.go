package routes

import (
	"golang_saas/handlers"
	"golang_saas/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupSystemRoutes(app *fiber.App) {
	systemHandler := handlers.NewSystemHandler()

	// System API routes (no tenant required)
	api := app.Group("/api/v1", middleware.RequireSystem())

	// Authentication routes
	auth := api.Group("/auth")
	auth.Post("/login", systemHandler.Login)
	auth.Post("/refresh", systemHandler.RefreshToken)
	auth.Post("/logout", middleware.AuthMiddleware(), systemHandler.Logout)

	// Protected system routes (require authentication and admin privileges)
	protected := api.Group("", middleware.AuthMiddleware(), middleware.RequireSystemAdmin())

	// Tenant management
	tenants := protected.Group("/tenants")
	tenants.Get("/", systemHandler.GetTenants)
	tenants.Get("/:id", systemHandler.GetTenant)
	tenants.Post("/", systemHandler.CreateTenant)
	tenants.Put("/:id", systemHandler.UpdateTenant)
	tenants.Delete("/:id", systemHandler.DeleteTenant)
	tenants.Post("/:id/suspend", systemHandler.SuspendTenant)
	tenants.Post("/:id/activate", systemHandler.ActivateTenant)

	// TODO: Add more system routes
	// - Plans management
	// - Modules management
	// - System analytics
}

func SetupTenantRoutes(app *fiber.App) {
	tenantHandler := handlers.NewTenantHandler()

	// Tenant API routes (require tenant context)
	api := app.Group("/api/v1", middleware.RequireTenant())

	// Public tenant routes (no auth required)
	auth := api.Group("/auth")
	auth.Post("/login", tenantHandler.Login)
	auth.Post("/refresh", tenantHandler.RefreshToken)
	auth.Post("/logout", middleware.AuthMiddleware(), tenantHandler.Logout)

	// Protected tenant routes (require authentication)
	protected := api.Group("", middleware.AuthMiddleware())

	// User management (admin only)
	users := protected.Group("/users", middleware.RequireTenantAdmin())
	users.Get("/", tenantHandler.GetUsers)
	users.Get("/:id", tenantHandler.GetUser)
	users.Post("/", tenantHandler.CreateUser)
	users.Put("/:id", tenantHandler.UpdateUser)
	users.Delete("/:id", tenantHandler.DeleteUser)
	users.Post("/:id/activate", tenantHandler.ActivateUser)
	users.Post("/:id/deactivate", tenantHandler.DeactivateUser)

	// TODO: Add more tenant routes
	// - Roles management
	// - Customer management
	// - Subscription management
	// - Settings management
	// - Notifications management
}