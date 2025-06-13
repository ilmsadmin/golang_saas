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
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  redirectTo = '/auth/signin',
}: ProtectedRouteProps) {
  const { isAuthenticated, storedUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !storedUser) {
      router.push(redirectTo);
      return;
    }

    // Check role requirement
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(storedUser.role.name)) {
        router.push('/unauthorized');
        return;
      }
    }

    // Check permission requirement
    if (requiredPermission) {
      const hasPermission = checkPermission(
        storedUser.permissions || [],
        requiredPermission.resource,
        requiredPermission.action
      );
      
      if (!hasPermission) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, storedUser, isLoading, router, requiredRole, requiredPermission, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !storedUser) {
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
