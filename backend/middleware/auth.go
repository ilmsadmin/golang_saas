package middleware

import (
	"strings"

	"golang_saas/utils"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Authorization header is required",
				},
			})
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "INVALID_TOKEN_FORMAT",
					"message": "Invalid authorization header format",
				},
			})
		}

		token := tokenParts[1]

		// Validate JWT token
		claims, err := utils.ValidateJWT(token)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "INVALID_TOKEN",
					"message": "Invalid or expired token",
				},
			})
		}

		// Set user context
		c.Locals("user_id", claims.UserID)
		c.Locals("tenant_id", claims.TenantID)
		c.Locals("user_role", claims.Role)
		c.Locals("user_permissions", claims.Permissions)
		c.Locals("is_system_user", claims.IsSystem)
		c.Locals("authenticated", true)

		return c.Next()
	}
}

func OptionalAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Next()
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			return c.Next()
		}

		token := tokenParts[1]

		// Validate JWT token
		claims, err := utils.ValidateJWT(token)
		if err != nil {
			return c.Next()
		}

		// Set user context
		c.Locals("user_id", claims.UserID)
		c.Locals("tenant_id", claims.TenantID)
		c.Locals("user_role", claims.Role)
		c.Locals("user_permissions", claims.Permissions)
		c.Locals("is_system_user", claims.IsSystem)
		c.Locals("authenticated", true)

		return c.Next()
	}
}