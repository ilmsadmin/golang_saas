import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }

        // Add tenant header if available
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          const subdomain = this.extractSubdomain(hostname);
          if (subdomain) {
            config.headers['X-Tenant'] = subdomain;
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private extractSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');
    return parts.length >= 3 ? parts[0] : null;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // GraphQL-like query methods that interface with REST API
  async query<T>(operation: string, variables?: Record<string, unknown>): Promise<T> {
    const { data } = await this.resolveOperation(operation, variables);
    return data as T;
  }

  async mutate<T>(operation: string, variables?: Record<string, unknown>): Promise<T> {
    const { data } = await this.resolveOperation(operation, variables);
    return data as T;
  }

  private async resolveOperation(operation: string, variables?: Record<string, unknown>): Promise<{ data: unknown }> {
    // Map GraphQL-like operations to REST endpoints
    switch (operation) {
      // User operations
      case 'getUsers':
        return this.get(`/users?${this.buildQueryString(variables)}`);
      case 'getUser':
        return this.get(`/users/${variables?.id}`);
      case 'createUser':
        return this.post('/users', variables?.input);
      case 'updateUser':
        return this.put(`/users/${variables?.id}`, variables?.input);
      case 'deleteUser':
        return this.delete(`/users/${variables?.id}`);

      // Customer operations
      case 'getCustomers':
        return this.get(`/customers?${this.buildQueryString(variables)}`);
      case 'getCustomer':
        return this.get(`/customers/${variables?.id}`);
      case 'createCustomer':
        return this.post('/customers', variables?.input);
      case 'updateCustomer':
        return this.put(`/customers/${variables?.id}`, variables?.input);

      // Subscription operations
      case 'getSubscriptions':
        return this.get(`/subscriptions?${this.buildQueryString(variables)}`);
      case 'getSubscription':
        return this.get(`/subscriptions/${variables?.id}`);
      case 'createSubscription':
        return this.post('/subscriptions', variables?.input);
      case 'updateSubscription':
        return this.put(`/subscriptions/${variables?.id}`, variables?.input);
      case 'cancelSubscription':
        return this.post(`/subscriptions/${variables?.id}/cancel`);

      // Profile operations
      case 'getProfile':
        return this.get('/profile');
      case 'updateProfile':
        return this.put('/profile', variables?.input);

      // Dashboard operations
      case 'getDashboardStats':
        return this.get('/dashboard/stats');
      case 'getUsageStats':
        return this.get('/usage');

      // Tenant operations (System admin)
      case 'getTenants':
        return this.get(`/tenants?${this.buildQueryString(variables)}`);
      case 'getTenant':
        return this.get(`/tenants/${variables?.id}`);
      case 'createTenant':
        return this.post('/tenants', variables?.input);
      case 'updateTenant':
        return this.put(`/tenants/${variables?.id}`, variables?.input);
      case 'suspendTenant':
        return this.post(`/tenants/${variables?.id}/suspend`);
      case 'activateTenant':
        return this.post(`/tenants/${variables?.id}/activate`);

      // Plan operations
      case 'getPlans':
        return this.get('/plans');
      case 'getPlan':
        return this.get(`/plans/${variables?.id}`);

      // Settings operations
      case 'getSettings':
        return this.get('/settings');
      case 'updateSettings':
        return this.put('/settings', variables?.input);

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return '';
    
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        searchParams.append(key, params[key]?.toString() || '');
      }
    });
    
    return searchParams.toString();
  }
}

export const apiClient = new ApiClient();