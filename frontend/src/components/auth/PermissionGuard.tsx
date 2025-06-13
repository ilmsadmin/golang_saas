'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface PermissionGuardProps {
  children: ReactNode;
  resource: string;
  action: string;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL specified permissions
  roles?: string | string[]; // Optional role requirement
}

/**
 * PermissionGuard component that conditionally renders children based on user permissions
 * Supports both permission-based and role-based access control
 */
export function PermissionGuard({
  children,
  resource,
  action,
  fallback = null,
  requireAll = false,
  roles,
}: PermissionGuardProps) {
  const { hasPermission, hasRole, isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  // Check role requirement first if specified
  if (roles && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  // Check permission requirement
  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface MultiPermissionGuardProps {
  children: ReactNode;
  permissions: Array<{ resource: string; action: string }>;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL specified permissions
  roles?: string | string[]; // Optional role requirement
}

/**
 * MultiPermissionGuard component for checking multiple permissions
 */
export function MultiPermissionGuard({
  children,
  permissions,
  fallback = null,
  requireAll = false,
  roles,
}: MultiPermissionGuardProps) {
  const { hasPermission, hasRole, isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  // Check role requirement first if specified
  if (roles && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  // Check permissions
  const hasPermissions = requireAll
    ? permissions.every(({ resource, action }) => hasPermission(resource, action))
    : permissions.some(({ resource, action }) => hasPermission(resource, action));

  if (!hasPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  children: ReactNode;
  roles: string | string[];
  fallback?: ReactNode;
}

/**
 * RoleGuard component that conditionally renders children based on user roles
 */
export function RoleGuard({
  children,
  roles,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole, isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Utility hook for conditional rendering based on permissions
export function usePermissionGuard() {
  const { hasPermission, hasRole, isSystemAdmin, isTenantAdmin, isCustomer } = useAuth();

  const canAccess = (resource: string, action: string, role?: string | string[]) => {
    if (role && !hasRole(role)) return false;
    return hasPermission(resource, action);
  };

  return {
    hasPermission,
    hasRole,
    canAccess,
    isSystemAdmin,
    isTenantAdmin,
    isCustomer,
  };
}