package handlers

import (
	"strconv"
	"time"

	"golang_saas/models"
	"golang_saas/services"

	"github.com/gofiber/fiber/v2"
)

type TenantHandler struct {
	authService *services.AuthService
	userService *services.UserService
}

func NewTenantHandler() *TenantHandler {
	return &TenantHandler{
		authService: services.NewAuthService(),
		userService: services.NewUserService(),
	}
}

// Auth endpoints

func (h *TenantHandler) Login(c *fiber.Ctx) error {
	var req services.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	// Get tenant from context
	tenant := c.Locals("tenant").(*models.Tenant)
	if tenant == nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "TENANT_REQUIRED",
				"message": "Tenant context is required",
			},
		})
	}

	result, err := h.authService.TenantLogin(req, tenant.ID)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "AUTH_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"data":      result,
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) RefreshToken(c *fiber.Ctx) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	result, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "REFRESH_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"data":      result,
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) Logout(c *fiber.Ctx) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	err := h.authService.Logout(req.RefreshToken)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "LOGOUT_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "Successfully logged out",
		"timestamp": time.Now(),
	})
}

// User management endpoints

func (h *TenantHandler) GetUsers(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uint)
	
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	roleFilter := c.Query("role")
	statusFilter := c.Query("status")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	users, total, err := h.userService.GetUsers(tenantID, page, limit, roleFilter, statusFilter, search)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "FETCH_FAILED",
				"message": err.Error(),
			},
		})
	}

	totalPages := (int(total) + limit - 1) / limit

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"users": users,
			"pagination": fiber.Map{
				"current_page":   page,
				"total_pages":    totalPages,
				"total_items":    total,
				"items_per_page": limit,
			},
		},
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) GetUser(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uint)
	
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid user ID",
			},
		})
	}

	user, err := h.userService.GetUser(tenantID, uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "USER_NOT_FOUND",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"data":      user,
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) CreateUser(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uint)
	
	var req services.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	user, err := h.userService.CreateUser(tenantID, req)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "CREATE_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"success":   true,
		"data":      user,
		"message":   "User created successfully",
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) UpdateUser(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uint)
	
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid user ID",
			},
		})
	}

	var req services.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	user, err := h.userService.UpdateUser(tenantID, uint(id), req)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "UPDATE_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"data":      user,
		"message":   "User updated successfully",
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) ActivateUser(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uint)
	
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid user ID",
			},
		})
	}

	err = h.userService.ActivateUser(tenantID, uint(id))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "ACTIVATE_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "User activated successfully",
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) DeactivateUser(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uint)
	
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid user ID",
			},
		})
	}

	err = h.userService.DeactivateUser(tenantID, uint(id))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "DEACTIVATE_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "User deactivated successfully",
		"timestamp": time.Now(),
	})
}

func (h *TenantHandler) DeleteUser(c *fiber.Ctx) error {
	tenantID := c.Locals("tenant_id").(uint)
	
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid user ID",
			},
		})
	}

	err = h.userService.DeleteUser(tenantID, uint(id))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "DELETE_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "User deleted successfully",
		"timestamp": time.Now(),
	})
}