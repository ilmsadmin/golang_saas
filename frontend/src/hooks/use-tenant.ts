import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  TenantUser, 
  Customer,
  Role,
  Permission,
  TenantSettings,
  DashboardStats,
  PaginatedResponse,
  ApiResponse,
  CreateUserRequest,
  UpdateUserRequest,
  Module
} from '@/types';

interface UserFilters extends Record<string, unknown> {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}

// Users management
export function useTenantUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['tenant', 'users', filters],
    queryFn: () => apiClient.query<ApiResponse<PaginatedResponse<TenantUser>>>('getUsers', filters),
    select: (data) => data.data,
  });
}

export function useTenantUser(id: number) {
  return useQuery({
    queryKey: ['tenant', 'users', id],
    queryFn: () => apiClient.query<ApiResponse<TenantUser>>('getUser', { id }),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateTenantUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserRequest) => 
      apiClient.mutate<ApiResponse<TenantUser>>('createUser', { input: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'users'] });
    },
  });
}

export function useUpdateTenantUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      apiClient.mutate<ApiResponse<TenantUser>>('updateUser', { id, input: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'users', variables.id] });
    },
  });
}

export function useDeleteTenantUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiClient.mutate<ApiResponse<void>>('deleteUser', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'users'] });
    },
  });
}

// Customer management
export function useTenantCustomers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['tenant', 'customers', filters],
    queryFn: () => apiClient.query<ApiResponse<PaginatedResponse<Customer>>>('getCustomers', filters),
    select: (data) => data.data,
  });
}

export function useTenantCustomer(id: number) {
  return useQuery({
    queryKey: ['tenant', 'customers', id],
    queryFn: () => apiClient.query<ApiResponse<Customer>>('getCustomer', { id }),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateTenantCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => 
      apiClient.mutate<ApiResponse<Customer>>('createCustomer', { input: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'customers'] });
    },
  });
}

export function useUpdateTenantCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.mutate<ApiResponse<Customer>>('updateCustomer', { id, input: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'customers', variables.id] });
    },
  });
}

export function useDeleteTenantCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiClient.mutate<ApiResponse<void>>('deleteCustomer', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'customers'] });
    },
  });
}

// Roles management
export function useTenantRoles(filters: any = {}) {
  return useQuery({
    queryKey: ['tenant', 'roles', filters],
    queryFn: () => apiClient.query<ApiResponse<PaginatedResponse<Role>>>('getRoles', filters),
    select: (data) => data.data,
  });
}

export function useTenantPermissions() {
  return useQuery({
    queryKey: ['tenant', 'permissions'],
    queryFn: () => apiClient.query<ApiResponse<Permission[]>>('getPermissions'),
    select: (data) => data.data,
  });
}

export function useCreateTenantRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => 
      apiClient.mutate<ApiResponse<Role>>('createRole', { input: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'roles'] });
    },
  });
}

export function useUpdateTenantRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.mutate<ApiResponse<Role>>('updateRole', { id, input: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'roles', variables.id] });
    },
  });
}

export function useDeleteTenantRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiClient.mutate<ApiResponse<void>>('deleteRole', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'roles'] });
    },
  });
}

// Modules management
export function useTenantModules() {
  return useQuery({
    queryKey: ['tenant', 'modules'],
    queryFn: () => apiClient.query<ApiResponse<Module[]>>('getModules'),
    select: (data) => data.data,
  });
}

export function useUpdateTenantModules() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => 
      apiClient.mutate<ApiResponse<void>>('updateModules', { input: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'modules'] });
    },
  });
}

// Tenant settings
export function useTenantSettings() {
  return useQuery({
    queryKey: ['tenant', 'settings'],
    queryFn: () => apiClient.query<ApiResponse<TenantSettings>>('getSettings'),
    select: (data) => data.data,
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<TenantSettings>) => 
      apiClient.mutate<ApiResponse<TenantSettings>>('updateSettings', { input: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'settings'] });
    },
  });
}

// Dashboard statistics for tenant admin
export function useTenantDashboardStats() {
  return useQuery({
    queryKey: ['tenant', 'dashboard', 'stats'],
    queryFn: () => apiClient.query<ApiResponse<DashboardStats>>('getDashboardStats'),
    select: (data) => data.data,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}