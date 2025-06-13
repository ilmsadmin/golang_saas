package main

import (
	"fmt"
	"log"
	"os"

	"golang_saas/config"
	"golang_saas/middleware"
	"golang_saas/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Initialize database
	config.InitDatabase()
	defer func() {
		if sqlDB, err := config.DB.DB(); err == nil {
			sqlDB.Close()
		}
	}()

	// Initialize Redis
	config.InitRedis()
	defer config.CloseRedis()

	// Run migrations based on command line argument
	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		if err := config.MigrateSystem(); err != nil {
			log.Fatal("System migration failed:", err)
		}
		log.Println("System migration completed successfully")
		return
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: customErrorHandler,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(logger.New())
	
	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     config.AppConfig.CORSAllowedOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With",
		AllowCredentials: true,
	}))

	// Tenant resolution middleware (applies to all routes)
	app.Use(middleware.TenantMiddleware())

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"timestamp": "now",
		})
	})

	// Setup routes
	routes.SetupSystemRoutes(app)
	routes.SetupTenantRoutes(app)

	// 404 handler
	app.Use(func(c *fiber.Ctx) error {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "NOT_FOUND",
				"message": "Route not found",
			},
		})
	})

	// Start server
	port := fmt.Sprintf(":%s", config.AppConfig.AppPort)
	log.Printf("Server starting on port %s", config.AppConfig.AppPort)
	log.Printf("Environment: %s", config.AppConfig.AppEnv)
	
	if err := app.Listen(port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	// Status code defaults to 500
	code := fiber.StatusInternalServerError

	// Retrieve the custom status code if it's a *fiber.Error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	// Error response
	errorCode := "INTERNAL_ERROR"
	message := "Internal server error"

	switch code {
	case 400:
		errorCode = "BAD_REQUEST"
		message = "Bad request"
	case 401:
		errorCode = "UNAUTHORIZED"
		message = "Unauthorized"
	case 403:
		errorCode = "FORBIDDEN"
		message = "Forbidden"
	case 404:
		errorCode = "NOT_FOUND"
		message = "Not found"
	case 422:
		errorCode = "VALIDATION_ERROR"
		message = "Validation error"
	case 429:
		errorCode = "RATE_LIMIT_EXCEEDED"
		message = "Rate limit exceeded"
	}

	// Log error in development
	if config.AppConfig.AppEnv == "development" {
		log.Printf("Error: %v", err)
	}

	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error": fiber.Map{
			"code":    errorCode,
			"message": message,
		},
	})
}