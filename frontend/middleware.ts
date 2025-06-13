import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Extract subdomain
  const subdomain = extractSubdomain(hostname);
  
  if (subdomain && subdomain !== 'www') {
    // Tenant subdomain - rewrite to tenant routes
    if (pathname.startsWith('/admin')) {
      return NextResponse.rewrite(
        new URL(`/(tenant)/tenant${pathname.replace('/admin', '')}`, request.url)
      );
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/services') || pathname.startsWith('/billing') || pathname.startsWith('/support') || pathname.startsWith('/settings')) {
      return NextResponse.rewrite(
        new URL(`/(customer)${pathname}`, request.url)
      );
    }
  } else {
    // Main domain - system routes
    if (pathname.startsWith('/admin')) {
      return NextResponse.rewrite(
        new URL(`/(system)/system${pathname.replace('/admin', '')}`, request.url)
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