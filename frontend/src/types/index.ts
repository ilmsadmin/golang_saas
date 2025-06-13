export interface User {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemUser extends User {
  role: string;
  permissions: string[];
}

export interface TenantUser extends User {
  tenantId: number;
  role: {
    id: number;
    name: string;
    permissions: Permission[];
  };
}

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  domain?: string;
  status: 'active' | 'suspended' | 'trial';
  plan: Plan;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  modules: Module[];
}

export interface Module {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Permission {
  id: number;
  resource: string;
  action: string;
  description: string;
}

export interface TenantSettings {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  features: {
    [key: string]: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  userType?: 'system' | 'tenant' | 'customer';
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
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
}