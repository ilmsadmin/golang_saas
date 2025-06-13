import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  Tenant, 
  Plan,
  Module,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
  CreateTenantRequest,
  UpdateTenantRequest
} from '@/types';

interface TenantFilters extends Record<string, unknown> {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
}

// Tenant management (System Admin)
export function useSystemTenants(filters: TenantFilters = {}) {
  return useQuery({
    queryKey: ['system', 'tenants', filters],
    queryFn: async (): Promise<PaginatedResponse<Tenant>> => {
      // Mock data for demonstration
      const mockTenants: Tenant[] = [
        {
          id: 1,
          name: 'ABC Company',
          subdomain: 'abc',
          status: 'active',
          plan: {
            id: 2,
            name: 'Pro Plan',
            slug: 'pro',
            description: 'Professional plan',
            price: 99.99,
            billing_cycle: 'monthly',
            features: {
              max_users: 100,
              storage_gb: 50,
              api_calls_per_hour: 10000,
              custom_domain: true,
              white_label: false,
              priority_support: true,
            },
            modules: ['user_management', 'analytics', 'crm'],
            is_active: true,
            sort_order: 1,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
          settings: {
            general: {
              name: 'ABC Company',
              description: 'Leading technology solutions',
              logo_url: '',
              primary_color: '#3B82F6',
              secondary_color: '#10B981',
            },
            features: {
              allow_registration: true,
              require_email_verification: true,
              two_factor_auth: false,
            },
            notifications: {
              email_notifications: true,
              sms_notifications: false,
            },
          },
          users_count: 45,
          customers_count: 120,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          name: 'XYZ Corp',
          subdomain: 'xyz',
          status: 'trial',
          plan: {
            id: 1,
            name: 'Starter Plan',
            slug: 'starter',
            description: 'Basic plan for startups',
            price: 29.99,
            billing_cycle: 'monthly',
            features: {
              max_users: 10,
              storage_gb: 5,
              api_calls_per_hour: 1000,
              custom_domain: false,
              white_label: false,
              priority_support: false,
            },
            modules: ['user_management'],
            is_active: true,
            sort_order: 0,
            created_at: '2024-01-10T00:00:00Z',
            updated_at: '2024-01-10T00:00:00Z',
          },
          settings: {
            general: {
              name: 'XYZ Corp',
              description: 'Innovative startup',
              logo_url: '',
              primary_color: '#F59E0B',
              secondary_color: '#EF4444',
            },
            features: {
              allow_registration: true,
              require_email_verification: false,
              two_factor_auth: false,
            },
            notifications: {
              email_notifications: true,
              sms_notifications: false,
            },
          },
          users_count: 8,
          customers_count: 25,
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z',
        },
        {
          id: 3,
          name: 'Tech Solutions Ltd',
          subdomain: 'techsol',
          status: 'active',
          plan: {
            id: 3,
            name: 'Enterprise Plan',
            slug: 'enterprise',
            description: 'Enterprise-grade features',
            price: 299.99,
            billing_cycle: 'monthly',
            features: {
              max_users: 500,
              storage_gb: 200,
              api_calls_per_hour: 50000,
              custom_domain: true,
              white_label: true,
              priority_support: true,
            },
            modules: ['user_management', 'analytics', 'crm', 'lms'],
            is_active: true,
            sort_order: 2,
            created_at: '2024-01-05T00:00:00Z',
            updated_at: '2024-01-05T00:00:00Z',
          },
          settings: {
            general: {
              name: 'Tech Solutions Ltd',
              description: 'Enterprise software solutions',
              logo_url: '',
              primary_color: '#7C3AED',
              secondary_color: '#059669',
            },
            features: {
              allow_registration: false,
              require_email_verification: true,
              two_factor_auth: true,
            },
            notifications: {
              email_notifications: true,
              sms_notifications: true,
            },
          },
          users_count: 150,
          customers_count: 800,
          created_at: '2024-01-05T00:00:00Z',
          updated_at: '2024-01-05T00:00:00Z',
        },
      ];

      return {
        items: mockTenants,
        pagination: {
          current_page: filters.page || 1,
          total_pages: 1,
          total_items: mockTenants.length,
          items_per_page: filters.limit || 10,
        },
      };
    },
  });
}

export function useSystemTenant(id: number) {
  return useQuery({
    queryKey: ['system', 'tenants', id],
    queryFn: () => apiClient.query<ApiResponse<Tenant>>('getTenant', { id }),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateSystemTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTenantRequest) => 
      apiClient.mutate<ApiResponse<Tenant>>('createTenant', { input: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'tenants'] });
    },
  });
}

export function useUpdateSystemTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTenantRequest & { id: number }) =>
      apiClient.mutate<ApiResponse<Tenant>>('updateTenant', { id, input: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['system', 'tenants', variables.id] });
    },
  });
}

export function useSuspendSystemTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiClient.mutate<ApiResponse<Tenant>>('suspendTenant', { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['system', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['system', 'tenants', id] });
    },
  });
}

export function useActivateSystemTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiClient.mutate<ApiResponse<Tenant>>('activateTenant', { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['system', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['system', 'tenants', id] });
    },
  });
}

// Plan management (System Admin)
export function useSystemPlans() {
  return useQuery({
    queryKey: ['system', 'plans'],
    queryFn: () => apiClient.query<ApiResponse<Plan[]>>('getPlans'),
    select: (data) => data.data,
  });
}

export function useSystemPlan(id: number) {
  return useQuery({
    queryKey: ['system', 'plans', id],
    queryFn: () => apiClient.query<ApiResponse<Plan>>('getPlan', { id }),
    select: (data) => data.data,
    enabled: !!id,
  });
}

// Module management (System Admin)
export function useSystemModules() {
  return useQuery({
    queryKey: ['system', 'modules'],
    queryFn: () => apiClient.query<ApiResponse<Module[]>>('getModules'),
    select: (data) => data.data,
  });
}

// Dashboard statistics for system admin
export function useSystemDashboardStats() {
  return useQuery({
    queryKey: ['system', 'dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Mock data for system admin dashboard
      return {
        users_count: 1250,
        customers_count: 4650,
        subscriptions_count: 3200,
        revenue_total: 125000000,
        revenue_monthly: 15000000,
        active_subscriptions: 3100,
        pending_payments: 45,
        support_tickets: 12,
      };
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}