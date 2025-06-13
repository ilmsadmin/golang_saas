import { NextRequest, NextResponse } from 'next/server';
import { validateTenantSlug } from '@/utils/slug-validation';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Extract subdomain
  const subdomain = extractSubdomain(hostname);
  
  if (subdomain && subdomain !== 'www') {
    // Tenant subdomain - handle legacy /admin routes and customer routes
    if (pathname.startsWith('/admin')) {
      // Legacy tenant admin route - redirect to new tenant slug format
      return NextResponse.redirect(
        new URL(`/${subdomain}${pathname.replace('/admin', '')}`, request.url)
      );
    } else if (pathname.startsWith('/dashboard') || 
               pathname.startsWith('/services') || 
               pathname.startsWith('/billing') || 
               pathname.startsWith('/support') || 
               pathname.startsWith('/settings')) {
      // Customer routes - rewrite to customer route group
      return NextResponse.rewrite(
        new URL(`/(customer)${pathname}`, request.url)
      );
    }
    // For tenant slug routes like /{tenantSlug}, /{tenantSlug}/users, etc.
    // these will be handled by the [tenantSlug] dynamic route
  } else {
    // Main domain - system routes
    if (pathname.startsWith('/admin')) {
      // Legacy system admin route - redirect to new /system format
      return NextResponse.redirect(
        new URL(`/system${pathname.replace('/admin', '')}`, request.url)
      );
    } else if (pathname.startsWith('/system')) {
      // System routes - rewrite to system route group
      return NextResponse.rewrite(
        new URL(`/(system)${pathname}`, request.url)
      );
    }
  }
  
  return NextResponse.next();
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};