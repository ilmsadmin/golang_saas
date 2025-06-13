export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  name?: string; // computed field
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemUser extends User {
  role: 'super_admin' | 'admin';
  permissions: string[];
}

export interface TenantUser extends User {
  tenant_id: number;
  role: {
    id: number;
    name: string;
    display_name: string;
    permissions: string[];
  };
}

export interface Customer extends User {
  tenant_id: number;
  subscription?: Subscription;
  billing_info?: any;
  preferences?: {
    theme?: string;
    language?: string;
    email_notifications?: boolean;
  };
}

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  domain?: string;
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  plan: Plan;
  settings: TenantSettings;
  users_count?: number;
  customers_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: {
    max_users: number;
    storage_gb: number;
    api_calls_per_hour: number;
    custom_domain: boolean;
    white_label: boolean;
    priority_support: boolean;
  };
  modules: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan?: Plan;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  billing_info?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  is_active: boolean;
  configuration_schema?: any;
  dependencies?: string[];
  pricing?: any;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  permissions: string[];
  users_count?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantSettings {
  general: {
    name: string;
    description?: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
  };
  features: {
    allow_registration: boolean;
    require_email_verification: boolean;
    two_factor_auth: boolean;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
  };
}

export interface DashboardStats {
  users_count: number;
  customers_count: number;
  subscriptions_count: number;
  revenue_total: number;
  revenue_monthly: number;
  active_subscriptions: number;
  pending_payments: number;
  support_tickets: number;
}

export interface UsageStats {
  current_period: {
    start_date: string;
    end_date: string;
    api_calls: number;
    storage_used_mb: number;
    users_count: number;
  };
  limits: {
    api_calls: number;
    storage_mb: number;
    users: number;
  };
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  recipients?: any;
  schedule_at?: string;
  sent_at?: string;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'suspended';
  usage_percentage: number;
  expires_at: string;
  plan?: Plan;
}

export interface Bill {
  id: number;
  customer_id: number;
  subscription_id: number;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
  due_date: string;
  paid_at?: string;
  invoice_url?: string;
  description: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  userType?: 'system' | 'tenant' | 'customer';
}

export interface LoginResponse {
  token: string;
  refresh_token?: string;
  user: User | SystemUser | TenantUser;
  permissions: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id?: number;
  send_invitation?: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface CreateTenantRequest {
  name: string;
  subdomain: string;
  plan_id: number;
  admin_email: string;
  admin_password: string;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  subdomain?: string;
  plan_id?: number;
  status?: 'active' | 'suspended' | 'inactive';
  settings?: Partial<TenantSettings>;
}