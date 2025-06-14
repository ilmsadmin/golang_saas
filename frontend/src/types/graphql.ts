// GraphQL types matching backend schema

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: Role;
  tenantId?: string;
  tenant?: Tenant;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
  tenantId?: string;
  tenant?: Tenant;
  users: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  isSystemPermission: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  subdomain: string;
  status: TenantStatus;
  settings?: any; // JSON type
  users: User[];
  roles: Role[];
  subscription?: TenantSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  tenant: Tenant;
  plan: Plan;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  features: any; // JSON type
  maxUsers: number;
  subscriptions: TenantSubscription[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: any; // JSON type
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  token: string;
  refreshToken: string;
  user: User;
  tenant?: Tenant;
}

// Enums
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  UNPAID = 'UNPAID'
}

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN', 
  TENANT_USER = 'TENANT_USER',
  CUSTOMER = 'CUSTOMER'
}

// Input Types
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSlug?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  domain?: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  planId: string;
}

export interface UpdateTenantInput {
  name?: string;
  domain?: string;
  status?: TenantStatus;
  settings?: any;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleId?: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface CreatePlanInput {
  name: string;
  description?: string;
  price: number;
  features: any;
  maxUsers: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  price?: number;
  features?: any;
  maxUsers?: number;
}

// Filters and Pagination
export interface UserFilter {
  email?: string;
  isActive?: boolean;
  roleId?: string;
  tenantId?: string;
}

export interface TenantFilter {
  status?: TenantStatus;
  name?: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedTenants {
  tenants: Tenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types for the enhanced hook
export interface AuthUser extends User {
  permissions: Permission[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
}