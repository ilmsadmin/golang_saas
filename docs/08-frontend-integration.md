# Frontend Integration

## Tổng quan

Frontend được xây dựng với Next.js 13+ sử dụng App Router, TypeScript, và Tailwind CSS. Hỗ trợ multi-tenant architecture với dynamic routing và theme customization.

## Cấu trúc Project

```
frontend/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── (system)/          # System admin routes
│   │   ├── (tenant)/          # Tenant admin routes
│   │   ├── (customer)/        # Customer routes
│   │   ├── auth/              # Authentication pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # Reusable components
│   │   ├── ui/               # Basic UI components
│   │   ├── forms/            # Form components
│   │   ├── layouts/          # Layout components
│   │   └── features/         # Feature-specific components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── providers/            # Context providers
│   ├── stores/               # State management (Zustand)
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
├── public/                   # Static assets
└── package.json
```

## Environment Configuration

### Development (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SYSTEM_DOMAIN=localhost:3001
NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX=.localhost:3001

# Authentication
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-key

# Environment
NODE_ENV=development
NEXT_PUBLIC_ENV=development

# Features
NEXT_PUBLIC_ENABLE_REGISTRATION=true
NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=false
```

### Production (.env.production)
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.zplus.vn/v1
NEXT_PUBLIC_SYSTEM_DOMAIN=zplus.vn
NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX=.zplus.vn

# Authentication
NEXTAUTH_URL=https://zplus.vn
NEXTAUTH_SECRET=production-secret-key

# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production
```

## Multi-tenant Routing

### 1. Domain Detection Middleware
```typescript
// middleware.ts
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
        new URL(`/tenant${pathname}`, request.url)
      );
    } else {
      return NextResponse.rewrite(
        new URL(`/customer${pathname}`, request.url)
      );
    }
  } else {
    // Main domain - system routes
    if (pathname.startsWith('/admin')) {
      return NextResponse.rewrite(
        new URL(`/system${pathname}`, request.url)
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
```

### 2. Tenant Context Provider
```typescript
// providers/tenant-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const hostname = window.location.hostname;
    const subdomain = extractSubdomain(hostname);
    
    if (subdomain) {
      fetchTenant(subdomain);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const fetchTenant = async (subdomain: string) => {
    try {
      const response = await fetch(`/api/tenant/resolve?subdomain=${subdomain}`);
      if (response.ok) {
        const tenantData = await response.json();
        setTenant(tenantData);
      } else {
        setError('Tenant not found');
      }
    } catch (err) {
      setError('Failed to load tenant');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TenantContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
```

## Authentication Integration

### 1. NextAuth Configuration
```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' }, // system, tenant, customer
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const endpoint = getAuthEndpoint(credentials.userType);
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            id: data.user.id,
            email: data.user.email,
            name: `${data.user.first_name} ${data.user.last_name}`,
            role: data.user.role,
            tenantId: data.user.tenant_id,
            accessToken: data.token,
            permissions: data.permissions,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.accessToken = user.accessToken;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      session.accessToken = token.accessToken;
      session.permissions = token.permissions;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

function getAuthEndpoint(userType: string): string {
  switch (userType) {
    case 'system':
      return '/auth/system/login';
    case 'tenant':
      return '/auth/tenant/login';
    case 'customer':
      return '/auth/customer/login';
    default:
      return '/auth/login';
  }
}
```

### 2. Permission-based Components
```typescript
// components/permission-guard.tsx
'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { data: session } = useSession();
  
  const hasPermission = checkPermission(
    session?.permissions || [],
    resource,
    action
  );
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

function checkPermission(
  permissions: string[],
  resource: string,
  action: string
): boolean {
  return permissions.some(perm => {
    const [permResource, permAction] = perm.split(':');
    return (permResource === '*' || permResource === resource) &&
           (permAction === '*' || permAction === action);
  });
}

// Usage
<PermissionGuard resource="users" action="create">
  <CreateUserButton />
</PermissionGuard>
```

## API Integration

### 1. API Client Setup
```typescript
// lib/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
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
        const hostname = window.location.hostname;
        const subdomain = this.extractSubdomain(hostname);
        if (subdomain) {
          config.headers['X-Tenant'] = subdomain;
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
          window.location.href = '/auth/signin';
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

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### 2. React Query Integration
```typescript
// hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: () => apiClient.get(`/users?page=${page}&limit=${limit}`),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => 
      apiClient.post('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...userData }: UpdateUserRequest) =>
      apiClient.put(`/users/${id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

## Theme Customization

### 1. Dynamic Theme Provider
```typescript
// providers/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useTenant } from './tenant-provider';

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  favicon: string;
  customCss?: string;
}

const ThemeContext = createContext<ThemeConfig | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    if (tenant?.settings?.theme) {
      const themeConfig = tenant.settings.theme;
      setTheme(themeConfig);
      applyTheme(themeConfig);
    }
  }, [tenant]);

  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--primary-color', config.primaryColor);
    root.style.setProperty('--secondary-color', config.secondaryColor);
    
    // Update favicon
    if (config.favicon) {
      updateFavicon(config.favicon);
    }
    
    // Apply custom CSS
    if (config.customCss) {
      injectCustomCSS(config.customCss);
    }
  };

  const updateFavicon = (faviconUrl: string) => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = faviconUrl;
    }
  };

  const injectCustomCSS = (css: string) => {
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'tenant-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### 2. Tailwind CSS Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
        },
        secondary: {
          50: 'rgb(var(--secondary-50) / <alpha-value>)',
          100: 'rgb(var(--secondary-100) / <alpha-value>)',
          500: 'rgb(var(--secondary-500) / <alpha-value>)',
          600: 'rgb(var(--secondary-600) / <alpha-value>)',
          900: 'rgb(var(--secondary-900) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## Component Library

### 1. Basic UI Components
```typescript
// components/ui/button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
            'bg-secondary-600 text-white hover:bg-secondary-700': variant === 'secondary',
            'border border-gray-300 bg-white hover:bg-gray-50': variant === 'outline',
            'hover:bg-gray-100': variant === 'ghost',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
```

### 2. Data Table Component
```typescript
// components/ui/data-table.tsx
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  pagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder={`Search ${searchKey}...`}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
```

## Route Protection

### 1. Protected Route Component
```typescript
// components/protected-route.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from './ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
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
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }

    if (requiredPermission) {
      const hasPermission = checkPermission(
        session.permissions || [],
        requiredPermission.resource,
        requiredPermission.action
      );
      
      if (!hasPermission) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [session, status, router, requiredRole, requiredPermission, redirectTo]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

## Build và Deployment

### 1. Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['cdn.zplus.vn', 'localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 3. Deployment Script
```bash
#!/bin/bash
# deploy-frontend.sh

set -e

echo "Building frontend..."
docker build -t golang-saas-frontend .

echo "Stopping existing container..."
docker stop golang-saas-frontend || true
docker rm golang-saas-frontend || true

echo "Starting new container..."
docker run -d \
  --name golang-saas-frontend \
  --restart unless-stopped \
  -p 3001:3000 \
  --env-file .env.production \
  golang-saas-frontend

echo "Frontend deployed successfully!"
```