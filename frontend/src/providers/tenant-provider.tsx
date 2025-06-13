'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tenant } from '@/types';
import { apiClient } from '@/lib/api-client';

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  subdomain: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
  subdomain: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  
  useEffect(() => {
    const hostname = window.location.hostname;
    const extractedSubdomain = extractSubdomain(hostname);
    setSubdomain(extractedSubdomain);
    
    if (extractedSubdomain) {
      fetchTenant(extractedSubdomain);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const fetchTenant = async (subdomain: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock tenant data - replace with real API call when available
      const mockTenant: Tenant = {
        id: 1,
        name: `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Company`,
        subdomain: subdomain,
        status: 'active',
        plan: {
          id: 1,
          name: 'Pro Plan',
          slug: 'pro',
          description: 'Professional plan with advanced features',
          price: 99.99,
          billing_cycle: 'monthly',
          features: {
            max_users: 100,
            storage_gb: 50,
            api_calls_per_hour: 10000,
            custom_domain: true,
            white_label: false,
            priority_support: true,
          },
          modules: ['user_management', 'analytics', 'crm'],
          is_active: true,
          sort_order: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        settings: {
          general: {
            name: `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Company`,
            description: 'A professional organization',
            logo_url: '',
            primary_color: '#3B82F6',
            secondary_color: '#10B981',
          },
          features: {
            allow_registration: true,
            require_email_verification: true,
            two_factor_auth: false,
          },
          notifications: {
            email_notifications: true,
            sms_notifications: false,
          },
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      
      setTenant(mockTenant);
    } catch (err) {
      console.error('Failed to fetch tenant:', err);
      setError('Failed to load tenant information');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TenantContext.Provider value={{ tenant, isLoading, error, subdomain }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return parts[0];
  }
  return null;
}