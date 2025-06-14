'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  redirectTo = '/auth/signin',
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, storedUser, isLoading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !storedUser) {
      router.push(redirectTo);
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    // Check permission requirement
    if (requiredPermission) {
      const hasRequiredPermission = hasPermission(
        requiredPermission.resource,
        requiredPermission.action
      );
      
      if (!hasRequiredPermission) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, storedUser, isLoading, router, requiredRole, requiredPermission, redirectTo, hasRole, hasPermission]);

  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !storedUser) {
    return null;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return null;
  }

  return <>{children}</>;
}

function checkPermission(
  permissions: Array<{id: string; name: string; resource: string; action: string}>,
  resource: string,
  action: string
): boolean {
  return permissions.some(perm => {
    return (perm.resource === '*' || perm.resource === resource) &&
           (perm.action === '*' || perm.action === action);
  });
}
