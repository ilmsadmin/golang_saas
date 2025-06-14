package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"golang_saas/graph/model"
	"golang_saas/models"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type CustomerService struct {
	db *gorm.DB
}

func NewCustomerService(db *gorm.DB) *CustomerService {
	return &CustomerService{db: db}
}

// CreateCustomer creates a new customer profile
func (s *CustomerService) CreateCustomer(ctx context.Context, input model.CreateCustomerInput) (*models.CustomerProfile, error) {
	// Validate tenant exists
	tenantUUID, err := uuid.Parse(input.TenantID)
	if err != nil {
		return nil, fmt.Errorf("invalid tenant ID: %v", err)
	}

	var tenant models.Tenant
	err = s.db.First(&tenant, "id = ?", tenantUUID).Error
	if err != nil {
		return nil, errors.New("tenant not found")
	}

	// Check if customer with email already exists for this tenant
	var existingCustomer models.CustomerProfile
	err = s.db.Where("email = ? AND tenant_id = ?", input.Email, tenantUUID).First(&existingCustomer).Error
	if err == nil {
		return nil, errors.New("customer with this email already exists for this tenant")
	}
	if err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to check existing customer: %v", err)
	}

	// Create customer
	customer := models.CustomerProfile{
		TenantID:  tenantUUID,
		Email:     input.Email,
		FirstName: input.FirstName,
		LastName:  input.LastName,
		IsActive:  true,
	}

	if input.Phone != nil {
		customer.Phone = input.Phone
	}

	if input.Address != nil {
		addressBytes, err := json.Marshal(input.Address)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal address: %v", err)
		}
		customer.Address = datatypes.JSON(addressBytes)
	}

	if input.Preferences != nil {
		preferencesBytes, err := json.Marshal(input.Preferences)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal preferences: %v", err)
		}
		customer.Preferences = datatypes.JSON(preferencesBytes)
	}

	if input.Tags != nil {
		tagsBytes, err := json.Marshal(input.Tags)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal tags: %v", err)
		}
		customer.Tags = datatypes.JSON(tagsBytes)
	}

	if input.Metadata != nil {
		metadataBytes, err := json.Marshal(input.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %v", err)
		}
		customer.Metadata = datatypes.JSON(metadataBytes)
	}

	err = s.db.Create(&customer).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create customer: %v", err)
	}

	// Load relationships
	err = s.db.Preload("Tenant").First(&customer, customer.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load customer relationships: %v", err)
	}

	return &customer, nil
}

// UpdateCustomer updates an existing customer
func (s *CustomerService) UpdateCustomer(ctx context.Context, id string, input model.UpdateCustomerInput) (*models.CustomerProfile, error) {
	customerUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid customer ID: %v", err)
	}

	var customer models.CustomerProfile
	err = s.db.First(&customer, "id = ?", customerUUID).Error
	if err != nil {
		return nil, fmt.Errorf("customer not found: %v", err)
	}

	// Update fields
	if input.FirstName != nil {
		customer.FirstName = *input.FirstName
	}
	if input.LastName != nil {
		customer.LastName = *input.LastName
	}
	if input.Phone != nil {
		customer.Phone = input.Phone
	}
	if input.IsActive != nil {
		customer.IsActive = *input.IsActive
	}

	if input.Address != nil {
		addressBytes, err := json.Marshal(input.Address)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal address: %v", err)
		}
		customer.Address = datatypes.JSON(addressBytes)
	}

	if input.Preferences != nil {
		preferencesBytes, err := json.Marshal(input.Preferences)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal preferences: %v", err)
		}
		customer.Preferences = datatypes.JSON(preferencesBytes)
	}

	if input.Tags != nil {
		tagsBytes, err := json.Marshal(input.Tags)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal tags: %v", err)
		}
		customer.Tags = datatypes.JSON(tagsBytes)
	}

	if input.Metadata != nil {
		metadataBytes, err := json.Marshal(input.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %v", err)
		}
		customer.Metadata = datatypes.JSON(metadataBytes)
	}

	err = s.db.Save(&customer).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update customer: %v", err)
	}

	// Load relationships
	err = s.db.Preload("Tenant").First(&customer, customer.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load customer relationships: %v", err)
	}

	return &customer, nil
}

// DeleteCustomer soft deletes a customer
func (s *CustomerService) DeleteCustomer(ctx context.Context, id string) (bool, error) {
	customerUUID, err := uuid.Parse(id)
	if err != nil {
		return false, fmt.Errorf("invalid customer ID: %v", err)
	}

	err = s.db.Delete(&models.CustomerProfile{}, "id = ?", customerUUID).Error
	if err != nil {
		return false, fmt.Errorf("failed to delete customer: %v", err)
	}

	return true, nil
}

// GetCustomer gets a customer by ID
func (s *CustomerService) GetCustomer(ctx context.Context, id string) (*models.CustomerProfile, error) {
	customerUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid customer ID: %v", err)
	}

	var customer models.CustomerProfile
	err = s.db.Preload("Tenant").First(&customer, "id = ?", customerUUID).Error
	if err != nil {
		return nil, fmt.Errorf("customer not found: %v", err)
	}

	return &customer, nil
}

// ListCustomers lists customers with filtering and pagination
func (s *CustomerService) ListCustomers(ctx context.Context, filter *model.UserFilter, pagination *model.PaginationInput) (*model.PaginatedCustomers, error) {
	query := s.db.Model(&models.CustomerProfile{})

	// Apply filters
	if filter != nil {
		if filter.Email != nil {
			query = query.Where("email ILIKE ?", "%"+*filter.Email+"%")
		}
		if filter.IsActive != nil {
			query = query.Where("is_active = ?", *filter.IsActive)
		}
		if filter.TenantID != nil {
			tenantUUID, err := uuid.Parse(*filter.TenantID)
			if err != nil {
				return nil, fmt.Errorf("invalid tenant ID: %v", err)
			}
			query = query.Where("tenant_id = ?", tenantUUID)
		}
	}

	// Count total
	var total int64
	err := query.Count(&total).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count customers: %v", err)
	}

	// Apply pagination
	page := int32(1)
	limit := int32(10)
	if pagination != nil {
		if pagination.Page != nil {
			page = *pagination.Page
		}
		if pagination.Limit != nil {
			limit = *pagination.Limit
		}
	}

	offset := (page - 1) * limit
	query = query.Offset(int(offset)).Limit(int(limit))

	// Load customers
	var customers []models.CustomerProfile
	err = query.Preload("Tenant").Find(&customers).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load customers: %v", err)
	}

	// Convert to pointers and GraphQL model
	var customerPtrs []*model.CustomerProfile
	for i := range customers {
		customerPtrs = append(customerPtrs, s.convertToGraphQLModel(&customers[i]))
	}

	totalPages := int32((total + int64(limit) - 1) / int64(limit))

	return &model.PaginatedCustomers{
		Customers:  customerPtrs,
		Total:      int32(total),
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// Helper function to convert database model to GraphQL model
func (s *CustomerService) convertToGraphQLModel(customer *models.CustomerProfile) *model.CustomerProfile {
	result := &model.CustomerProfile{
		ID:        customer.ID.String(),
		TenantID:  customer.TenantID.String(),
		Email:     customer.Email,
		FirstName: customer.FirstName,
		LastName:  customer.LastName,
		Phone:     customer.Phone,
		IsActive:  customer.IsActive,
		CreatedAt: customer.CreatedAt,
		UpdatedAt: customer.UpdatedAt,
	}

	// Convert JSON fields to maps
	if customer.Address != nil {
		var address map[string]interface{}
		if err := json.Unmarshal(customer.Address, &address); err == nil {
			result.Address = address
		}
	}

	if customer.Preferences != nil {
		var preferences map[string]interface{}
		if err := json.Unmarshal(customer.Preferences, &preferences); err == nil {
			result.Preferences = preferences
		}
	}

	if customer.Tags != nil {
		var tags map[string]interface{}
		if err := json.Unmarshal(customer.Tags, &tags); err == nil {
			result.Tags = tags
		}
	}

	if customer.Metadata != nil {
		var metadata map[string]interface{}
		if err := json.Unmarshal(customer.Metadata, &metadata); err == nil {
			result.Metadata = metadata
		}
	}

	if customer.Tenant.ID != uuid.Nil {
		result.Tenant = &customer.Tenant
	}

	return result
}

// ConvertToGraphQLModel is a public helper for resolvers
func (s *CustomerService) ConvertToGraphQLModel(customer *models.CustomerProfile) *model.CustomerProfile {
	return s.convertToGraphQLModel(customer)
}