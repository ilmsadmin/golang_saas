import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { LOGIN_MUTATION, LOGOUT_MUTATION, REGISTER_MUTATION, REFRESH_TOKEN_MUTATION, ME_QUERY } from '@/lib/graphql/auth';
import { getCurrentTenantSlug, getRedirectUrlByRole } from '@/utils/tenant-routing';

// Debug logging helper
const debugLog = (context: string, data: any) => {
  console.log(`[AUTH DEBUG] ${context}:`, data);
};

// Types
interface LoginInput {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantSlug?: string;
}

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
  };
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}

interface AuthPayload {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

// Custom login hook using GraphQL
export function useLogin() {
  const [loginMutation, { loading, error }] = useMutation<
    { login: AuthPayload },
    { input: LoginInput }
  >(LOGIN_MUTATION);
  const router = useRouter();

  const login = async (input: LoginInput) => {
    try {
      
      const { data } = await loginMutation({
        variables: { input },
      });

      if (data?.login) {
        const { user, token, refreshToken } = data.login;
        
        // Store tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Redirect based on user role and tenant context
        const tenantSlug = getCurrentTenantSlug();
        const redirectUrl = getRedirectUrlByRole(user.role.name, tenantSlug || undefined);
        router.push(redirectUrl);
        return { success: true, user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  return {
    login,
    loading,
    error,
  };
}

// Custom logout hook using GraphQL
export function useLogout() {
  const [logoutMutation, { loading }] = useMutation<{ logout: boolean }>(LOGOUT_MUTATION);
  const router = useRouter();

  const logout = async () => {
    try {
      // Call GraphQL logout mutation
      await logoutMutation();
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
      
      // Redirect to sign in page
      router.push('/auth/signin');
      
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Even if GraphQL logout fails, still clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
      router.push('/auth/signin');
      throw err;
    }
  };

  return {
    logout,
    loading,
  };
}

// Register hook using GraphQL
export function useRegister() {
  const [registerMutation, { loading, error }] = useMutation<
    { register: AuthPayload },
    { input: RegisterInput }
  >(REGISTER_MUTATION);
  const router = useRouter();

  const register = async (input: RegisterInput) => {
    try {
      const { data } = await registerMutation({
        variables: { input },
      });


      if (data?.register) {
        const { user, token, refreshToken } = data.register;
        
        // Store tokens in localStorage after successful registration
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Redirect based on user role and tenant context
        const tenantSlug = getCurrentTenantSlug();
        const redirectUrl = getRedirectUrlByRole(user.role.name, tenantSlug || undefined);
        router.push(redirectUrl);
        return { success: true, user };
      }
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  return {
    register,
    loading,
    error,
  };
}

// Current user hook
export function useCurrentUser() {
  const { data, loading, error, refetch } = useQuery<{ me: AuthUser }>(ME_QUERY, {
    errorPolicy: 'all',
    skip: typeof window === 'undefined', // Skip on server side
    onCompleted: (data) => {

    },
    onError: (error) => {

    }
  });


  return {
    user: data?.me,
    loading,
    error,
    refetch,
  };
}

// Refresh token hook
export function useRefreshToken() {
  const [refreshTokenMutation, { loading }] = useMutation<
    { refreshToken: AuthPayload },
    { token: string }
  >(REFRESH_TOKEN_MUTATION);

  const refreshToken = async (token: string) => {
    try {
      const { data } = await refreshTokenMutation({
        variables: { token },
      });


      if (data?.refreshToken) {
        const { token: newToken, refreshToken: newRefreshToken, user } = data.refreshToken;
        
        // Update tokens in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', newToken);
          localStorage.setItem('refresh_token', newRefreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return data.refreshToken;
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      throw err;
    }
  };

  return {
    refreshToken,
    loading,
  };
}

// Enhanced authentication hook that provides complete auth state
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [storedUser, setStoredUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const loginHook = useLogin();
  const logoutHook = useLogout();
  const currentUserHook = useCurrentUser();
  
  // Initialize auth state from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setStoredUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear invalid data
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for storage changes (in case user logs out in another tab)
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setStoredUser(null);
        }
      }
      if (e.key === 'user' && e.newValue) {
        try {
          const user = JSON.parse(e.newValue);
          setStoredUser(user);
        } catch (error) {
          console.error('Error parsing user data from storage event:', error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Enhanced login function that updates state
  const enhancedLogin = async (input: LoginInput) => {
    const result = await loginHook.login(input);
    if (result.success) {
      setIsAuthenticated(true);
      setStoredUser(result.user);
    }
    return result;
  };

  // Enhanced logout function that updates state
  const enhancedLogout = async () => {
    const result = await logoutHook.logout();
    setIsAuthenticated(false);
    setStoredUser(null);
    return result;
  };

  // Permission checking function
  const hasPermission = (resource: string, action: string): boolean => {
    if (!storedUser?.permissions) return false;
    
    return storedUser.permissions.some((perm) => {
      return (perm.resource === '*' || perm.resource === resource) &&
             (perm.action === '*' || perm.action === action);
    });
  };

  // Role checking function
  const hasRole = (roleName: string | string[]): boolean => {
    if (!storedUser?.role) return false;
    
    const roles = Array.isArray(roleName) ? roleName : [roleName];
    return roles.includes(storedUser.role.name);
  };

  // Check if user is system admin
  const isSystemAdmin = (): boolean => {
    return hasRole(['system_admin', 'super_admin']) || hasPermission('*', '*');
  };

  // Check if user is tenant admin
  const isTenantAdmin = (): boolean => {
    return hasRole(['tenant_admin', 'admin']) && !!storedUser?.tenantId;
  };

  // Check if user is customer
  const isCustomer = (): boolean => {
    return hasRole('customer');
  };
  
  return {
    // Auth state
    isAuthenticated,
    storedUser,
    isLoading,
    
    // Login/logout functions
    login: enhancedLogin,
    logout: enhancedLogout,
    
    // Permission checking
    hasPermission,
    hasRole,
    isSystemAdmin,
    isTenantAdmin,
    isCustomer,
    
    // Original hooks
    loginLoading: loginHook.loading,
    loginError: loginHook.error,
    logoutLoading: logoutHook.loading,
    
    // Current user from GraphQL
    user: currentUserHook.user,
    userLoading: currentUserHook.loading,
    userError: currentUserHook.error,
    refetchUser: currentUserHook.refetch,
  };
}
