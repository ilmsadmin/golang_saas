package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"golang_saas/config"
	"golang_saas/models"

	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

type TenantResolver struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewTenantResolver() *TenantResolver {
	return &TenantResolver{
		db:    config.DB,
		redis: config.RedisClient,
	}
}

func (tr *TenantResolver) ResolveTenant(host string) (*models.Tenant, error) {
	// Try to resolve by subdomain first
	subdomain := extractSubdomain(host)
	if subdomain != "" {
		return tr.resolveTenantBySubdomain(subdomain)
	}

	// Try to resolve by custom domain
	return tr.resolveTenantByCustomDomain(host)
}

func (tr *TenantResolver) resolveTenantBySubdomain(subdomain string) (*models.Tenant, error) {
	cacheKey := fmt.Sprintf("tenant:subdomain:%s", subdomain)
	
	// Check cache first
	if tenant := tr.getTenantFromCache(cacheKey); tenant != nil {
		return tenant, nil
	}

	// Query from database
	var tenant models.Tenant
	err := tr.db.Where("subdomain = ? AND status = ?", subdomain, "active").
		Preload("Plan").
		First(&tenant).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("tenant not found for subdomain: %s", subdomain)
		}
		return nil, err
	}

	// Cache the result
	tr.cacheTenant(cacheKey, &tenant)
	return &tenant, nil
}

func (tr *TenantResolver) resolveTenantByCustomDomain(domain string) (*models.Tenant, error) {
	cacheKey := fmt.Sprintf("tenant:domain:%s", domain)
	
	// Check cache first
	if tenant := tr.getTenantFromCache(cacheKey); tenant != nil {
		return tenant, nil
	}

	// Query from database via domain mapping
	var domainMapping models.DomainMapping
	err := tr.db.Where("domain = ? AND status = ?", domain, "active").
		Preload("Tenant").
		Preload("Tenant.Plan").
		First(&domainMapping).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("tenant not found for domain: %s", domain)
		}
		return nil, err
	}

	// Cache the result
	tr.cacheTenant(cacheKey, &domainMapping.Tenant)
	return &domainMapping.Tenant, nil
}

func (tr *TenantResolver) getTenantFromCache(key string) *models.Tenant {
	ctx := context.Background()
	
	data, err := tr.redis.Get(ctx, key).Result()
	if err != nil {
		return nil
	}

	var tenant models.Tenant
	if err := json.Unmarshal([]byte(data), &tenant); err != nil {
		return nil
	}

	return &tenant
}

func (tr *TenantResolver) cacheTenant(key string, tenant *models.Tenant) {
	ctx := context.Background()
	
	data, err := json.Marshal(tenant)
	if err != nil {
		return
	}

	// Cache for 15 minutes
	tr.redis.Set(ctx, key, data, 15*time.Minute)
}

func (tr *TenantResolver) ClearTenantCache(tenantID uint) {
	ctx := context.Background()
	
	// Clear all cache keys related to this tenant
	pattern := fmt.Sprintf("tenant:*")
	keys, err := tr.redis.Keys(ctx, pattern).Result()
	if err != nil {
		return
	}

	for _, key := range keys {
		// Check if this key belongs to the tenant
		if tenant := tr.getTenantFromCache(key); tenant != nil && tenant.ID == tenantID {
			tr.redis.Del(ctx, key)
		}
	}
}

func extractSubdomain(host string) string {
	// Remove port if present
	if colonIndex := strings.Index(host, ":"); colonIndex != -1 {
		host = host[:colonIndex]
	}

	parts := strings.Split(host, ".")
	
	// For localhost development, we might have patterns like tenant1.localhost
	if len(parts) >= 2 {
		// Skip common prefixes
		if parts[0] == "www" || parts[0] == "api" {
			return ""
		}
		
		// For development with .localhost
		if len(parts) == 2 && parts[1] == "localhost" {
			return parts[0]
		}
		
		// For production with subdomain.domain.tld (at least 3 parts)
		if len(parts) >= 3 {
			return parts[0]
		}
	}
	
	return ""
}

func IsTenantDomain(host string) bool {
	return extractSubdomain(host) != ""
}

func IsSystemDomain(host string) bool {
	// Remove port if present
	if colonIndex := strings.Index(host, ":"); colonIndex != -1 {
		host = host[:colonIndex]
	}

	// Check if it's the main domain without subdomain
	parts := strings.Split(host, ".")
	
	// For localhost development
	if host == "localhost" {
		return true
	}
	
	// For production, check if it's the main domain (e.g., zplus.vn)
	if len(parts) == 2 {
		// This would be domain.tld
		return true
	}
	
	return false
}