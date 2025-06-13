import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  Customer, 
  Subscription, 
  DashboardStats, 
  UsageStats, 
  Service, 
  Bill,
  ApiResponse,
  UpdateUserRequest
} from '@/types';

// Customer profile operations
export function useCustomerProfile() {
  return useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: () => apiClient.query<ApiResponse<Customer>>('getProfile'),
    select: (data) => data.data,
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => 
      apiClient.mutate<ApiResponse<Customer>>('updateProfile', { input: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

// Dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['customer', 'dashboard', 'stats'],
    queryFn: () => apiClient.query<ApiResponse<DashboardStats>>('getDashboardStats'),
    select: (data) => data.data,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Usage statistics
export function useUsageStats() {
  return useQuery({
    queryKey: ['customer', 'usage'],
    queryFn: () => apiClient.query<ApiResponse<UsageStats>>('getUsageStats'),
    select: (data) => data.data,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

// Customer subscription
export function useCustomerSubscription() {
  return useQuery({
    queryKey: ['customer', 'subscription'],
    queryFn: () => apiClient.query<ApiResponse<Subscription>>('getSubscription'),
    select: (data) => data.data,
  });
}

// Services (mock implementation since not in API docs)
export function useCustomerServices() {
  return useQuery({
    queryKey: ['customer', 'services'],
    queryFn: async (): Promise<Service[]> => {
      // Mock data - replace with real API call when available
      return [
        {
          id: 1,
          name: 'Email Marketing Pro',
          description: 'Advanced email marketing solution',
          status: 'active',
          usage_percentage: 85,
          expires_at: '2024-12-31T00:00:00Z',
          plan: {
            id: 1,
            name: 'Pro',
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
            modules: ['email_marketing', 'analytics'],
            is_active: true,
            sort_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
        {
          id: 2,
          name: 'CRM Advanced',
          description: 'Customer relationship management',
          status: 'active',
          usage_percentage: 62,
          expires_at: '2024-11-15T00:00:00Z',
        },
        {
          id: 3,
          name: 'Analytics Basic',
          description: 'Basic analytics and reporting',
          status: 'active',
          usage_percentage: 45,
          expires_at: '2024-10-20T00:00:00Z',
        },
      ];
    },
  });
}

// Recent billing (mock implementation)
export function useRecentBilling() {
  return useQuery({
    queryKey: ['customer', 'billing', 'recent'],
    queryFn: async (): Promise<Bill[]> => {
      // Mock data - replace with real API call when available
      return [
        {
          id: 1,
          customer_id: 1,
          subscription_id: 1,
          amount: 1500000,
          currency: 'VND',
          status: 'paid',
          due_date: '2024-01-15T00:00:00Z',
          paid_at: '2024-01-15T00:00:00Z',
          description: 'Email Marketing Pro - Monthly subscription',
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          customer_id: 1,
          subscription_id: 2,
          amount: 2200000,
          currency: 'VND',
          status: 'paid',
          due_date: '2024-01-10T00:00:00Z',
          paid_at: '2024-01-10T00:00:00Z',
          description: 'CRM Advanced - Monthly subscription',
          created_at: '2024-01-10T00:00:00Z',
        },
        {
          id: 3,
          customer_id: 1,
          subscription_id: 3,
          amount: 800000,
          currency: 'VND',
          status: 'pending',
          due_date: '2024-01-05T00:00:00Z',
          description: 'Analytics Basic - Monthly subscription',
          created_at: '2024-01-05T00:00:00Z',
        },
      ];
    },
  });
}