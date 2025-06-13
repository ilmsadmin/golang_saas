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
    queryFn: () => apiClient.query<ApiResponse<PaginatedResponse<Tenant>>>('getTenants', filters),
    select: (data) => data.data,
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