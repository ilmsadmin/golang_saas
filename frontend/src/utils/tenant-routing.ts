/**
 * Tenant routing utilities
 */

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }
  return null;
}

/**
 * Get current tenant slug from the browser
 */
export function getCurrentTenantSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return extractSubdomain(window.location.hostname);
}

/**
 * Get tenant slug from URL path (for dynamic routes like /[tenantSlug])
 */
export function getTenantSlugFromPath(pathname: string): string | null {
  // Match patterns like /tenant1, /tenant1/users, etc.
  const match = pathname.match(/^\/([a-z][a-z-]*[a-z]|[a-z])(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * Check if the current URL is a tenant-specific route
 */
export function isTenantRoute(pathname: string): boolean {
  // Skip system routes
  if (pathname.startsWith('/system') || 
      pathname.startsWith('/auth') || 
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/unauthorized')) {
    return false;
  }
  
  return getTenantSlugFromPath(pathname) !== null;
}

/**
 * Build tenant-specific URL
 */
export function buildTenantUrl(tenantSlug: string, path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${tenantSlug}${cleanPath}`;
}

/**
 * Get the appropriate redirect URL based on user role and context
 */
export function getRedirectUrlByRole(roleName: string, tenantSlug?: string): string {
  const roleMap: Record<string, string> = {
    'system_admin': '/system',
    'super_admin': '/system',
    'admin': '/system',
    'tenant_admin': tenantSlug ? `/${tenantSlug}` : '/dashboard',
    'tenant_manager': tenantSlug ? `/${tenantSlug}` : '/dashboard',
    'tenant_user': '/dashboard',
    'customer': '/dashboard',
  };
  
  return roleMap[roleName] || '/dashboard';
}
