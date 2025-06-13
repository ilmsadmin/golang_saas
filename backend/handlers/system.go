package handlers

import (
	"strconv"
	"time"

	"golang_saas/services"

	"github.com/gofiber/fiber/v2"
)

type SystemHandler struct {
	authService   *services.AuthService
	tenantService *services.TenantService
}

func NewSystemHandler() *SystemHandler {
	return &SystemHandler{
		authService:   services.NewAuthService(),
		tenantService: services.NewTenantService(),
	}
}

// Auth endpoints

func (h *SystemHandler) Login(c *fiber.Ctx) error {
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

	result, err := h.authService.SystemLogin(req)
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

func (h *SystemHandler) RefreshToken(c *fiber.Ctx) error {
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

func (h *SystemHandler) Logout(c *fiber.Ctx) error {
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

// Tenant management endpoints

func (h *SystemHandler) GetTenants(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	status := c.Query("status")
	search := c.Query("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	tenants, total, err := h.tenantService.GetTenants(page, limit, status, search)
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
			"tenants": tenants,
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

func (h *SystemHandler) GetTenant(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid tenant ID",
			},
		})
	}

	tenant, err := h.tenantService.GetTenant(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "TENANT_NOT_FOUND",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"data":      tenant,
		"timestamp": time.Now(),
	})
}

func (h *SystemHandler) CreateTenant(c *fiber.Ctx) error {
	var req services.CreateTenantRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	result, err := h.tenantService.CreateTenant(req)
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
		"data":      result,
		"message":   "Tenant created successfully",
		"timestamp": time.Now(),
	})
}

func (h *SystemHandler) UpdateTenant(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid tenant ID",
			},
		})
	}

	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_REQUEST",
				"message": "Invalid request body",
			},
		})
	}

	tenant, err := h.tenantService.UpdateTenant(uint(id), updates)
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
		"data":      tenant,
		"message":   "Tenant updated successfully",
		"timestamp": time.Now(),
	})
}

func (h *SystemHandler) SuspendTenant(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid tenant ID",
			},
		})
	}

	err = h.tenantService.SuspendTenant(uint(id))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "SUSPEND_FAILED",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"message":   "Tenant suspended successfully",
		"timestamp": time.Now(),
	})
}

func (h *SystemHandler) ActivateTenant(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid tenant ID",
			},
		})
	}

	err = h.tenantService.ActivateTenant(uint(id))
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
		"message":   "Tenant activated successfully",
		"timestamp": time.Now(),
	})
}

func (h *SystemHandler) DeleteTenant(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_ID",
				"message": "Invalid tenant ID",
			},
		})
	}

	err = h.tenantService.DeleteTenant(uint(id))
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
		"message":   "Tenant deleted successfully",
		"timestamp": time.Now(),
	})
}