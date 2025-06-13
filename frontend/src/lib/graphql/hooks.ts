import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  ME_QUERY,
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  LOGOUT_MUTATION,
  REFRESH_TOKEN_MUTATION,
  USERS_QUERY,
  USER_QUERY,
  CREATE_USER_MUTATION,
  UPDATE_USER_MUTATION,
  DELETE_USER_MUTATION,
  TENANTS_QUERY,
  TENANT_QUERY,
  TENANT_BY_SLUG_QUERY,
  CREATE_TENANT_MUTATION,
  UPDATE_TENANT_MUTATION,
  DELETE_TENANT_MUTATION,
  ROLES_QUERY,
  ROLE_QUERY,
  PERMISSIONS_QUERY,
  CREATE_ROLE_MUTATION,
  UPDATE_ROLE_MUTATION,
  DELETE_ROLE_MUTATION,
  PLANS_QUERY,
  PLAN_QUERY,
  CREATE_PLAN_MUTATION,
  UPDATE_PLAN_MUTATION,
  DELETE_PLAN_MUTATION,
  SYSTEM_SETTINGS_QUERY,
  SYSTEM_STATS_QUERY,
} from './queries';
import {
  LoginInput,
  RegisterInput,
  CreateUserInput,
  UpdateUserInput,
  UserFilter,
  PaginationInput,
  CreateTenantInput,
  UpdateTenantInput,
  TenantFilter,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePlanInput,
  UpdatePlanInput,
  User,
  Tenant,
  Role,
  Plan,
  Permission,
  AuthPayload,
} from '@/types/graphql';

// Authentication Hooks
export function useCurrentUser() {
  return useQuery(ME_QUERY, {
    errorPolicy: 'all',
  });
}

export function useLogin() {
  const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION);
  const client = useApolloClient();

  const login = async (input: LoginInput) => {
    try {
      const { data } = await loginMutation({
        variables: { input },
      });

      if (data?.login) {
        const { token, refreshToken, user, tenant } = data.login;
        
        // Store tokens
        localStorage.setItem('access_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        if (tenant) {
          localStorage.setItem('tenant', JSON.stringify(tenant));
        }

        // Reset Apollo cache
        await client.resetStore();

        return {
          success: true,
          data: data.login,
          user,
          tenant,
        };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: err.message || 'Login failed',
      };
    }
  };

  return { login, loading, error };
}

export function useRegister() {
  const [registerMutation, { loading, error }] = useMutation(REGISTER_MUTATION);
  const client = useApolloClient();

  const register = async (input: RegisterInput) => {
    try {
      const { data } = await registerMutation({
        variables: { input },
      });

      if (data?.register) {
        const { token, refreshToken, user, tenant } = data.register;
        
        // Store tokens
        localStorage.setItem('access_token', token);
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(user));
        if (tenant) {
          localStorage.setItem('tenant', JSON.stringify(tenant));
        }

        // Reset Apollo cache
        await client.resetStore();

        return {
          success: true,
          data: data.register,
          user,
          tenant,
        };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      console.error('Register error:', err);
      return {
        success: false,
        error: err.message || 'Registration failed',
      };
    }
  };

  return { register, loading, error };
}

export function useLogout() {
  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const client = useApolloClient();

  const logout = async () => {
    try {
      await logoutMutation();
      
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');

      // Clear Apollo cache
      await client.clearStore();

      return { success: true };
    } catch (err: any) {
      console.error('Logout error:', err);
      
      // Clear local storage even if server call fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      
      await client.clearStore();
      
      return { success: true }; // Consider logout successful even if server call fails
    }
  };

  return { logout };
}

// User Management Hooks
export function useUsers(filter?: UserFilter, pagination?: PaginationInput) {
  return useQuery(USERS_QUERY, {
    variables: { filter, pagination },
    errorPolicy: 'all',
  });
}

export function useUser(id: string) {
  return useQuery(USER_QUERY, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  });
}

export function useCreateUser() {
  const [createUserMutation, { loading, error }] = useMutation(CREATE_USER_MUTATION, {
    refetchQueries: [{ query: USERS_QUERY }],
  });

  const createUser = async (input: CreateUserInput) => {
    try {
      const { data } = await createUserMutation({
        variables: { input },
      });
      return { success: true, data: data?.createUser };
    } catch (err: any) {
      console.error('Create user error:', err);
      return { success: false, error: err.message };
    }
  };

  return { createUser, loading, error };
}

export function useUpdateUser() {
  const [updateUserMutation, { loading, error }] = useMutation(UPDATE_USER_MUTATION);

  const updateUser = async (id: string, input: UpdateUserInput) => {
    try {
      const { data } = await updateUserMutation({
        variables: { id, input },
      });
      return { success: true, data: data?.updateUser };
    } catch (err: any) {
      console.error('Update user error:', err);
      return { success: false, error: err.message };
    }
  };

  return { updateUser, loading, error };
}

export function useDeleteUser() {
  const [deleteUserMutation, { loading, error }] = useMutation(DELETE_USER_MUTATION, {
    refetchQueries: [{ query: USERS_QUERY }],
  });

  const deleteUser = async (id: string) => {
    try {
      const { data } = await deleteUserMutation({
        variables: { id },
      });
      return { success: true, data: data?.deleteUser };
    } catch (err: any) {
      console.error('Delete user error:', err);
      return { success: false, error: err.message };
    }
  };

  return { deleteUser, loading, error };
}

// Tenant Management Hooks
export function useTenants(filter?: TenantFilter, pagination?: PaginationInput) {
  return useQuery(TENANTS_QUERY, {
    variables: { filter, pagination },
    errorPolicy: 'all',
  });
}

export function useTenant(id: string) {
  return useQuery(TENANT_QUERY, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  });
}

export function useTenantBySlug(slug: string) {
  return useQuery(TENANT_BY_SLUG_QUERY, {
    variables: { slug },
    skip: !slug,
    errorPolicy: 'all',
  });
}

export function useCreateTenant() {
  const [createTenantMutation, { loading, error }] = useMutation(CREATE_TENANT_MUTATION, {
    refetchQueries: [{ query: TENANTS_QUERY }],
  });

  const createTenant = async (input: CreateTenantInput) => {
    try {
      const { data } = await createTenantMutation({
        variables: { input },
      });
      return { success: true, data: data?.createTenant };
    } catch (err: any) {
      console.error('Create tenant error:', err);
      return { success: false, error: err.message };
    }
  };

  return { createTenant, loading, error };
}

export function useUpdateTenant() {
  const [updateTenantMutation, { loading, error }] = useMutation(UPDATE_TENANT_MUTATION);

  const updateTenant = async (id: string, input: UpdateTenantInput) => {
    try {
      const { data } = await updateTenantMutation({
        variables: { id, input },
      });
      return { success: true, data: data?.updateTenant };
    } catch (err: any) {
      console.error('Update tenant error:', err);
      return { success: false, error: err.message };
    }
  };

  return { updateTenant, loading, error };
}

export function useDeleteTenant() {
  const [deleteTenantMutation, { loading, error }] = useMutation(DELETE_TENANT_MUTATION, {
    refetchQueries: [{ query: TENANTS_QUERY }],
  });

  const deleteTenant = async (id: string) => {
    try {
      const { data } = await deleteTenantMutation({
        variables: { id },
      });
      return { success: true, data: data?.deleteTenant };
    } catch (err: any) {
      console.error('Delete tenant error:', err);
      return { success: false, error: err.message };
    }
  };

  return { deleteTenant, loading, error };
}

// Role and Permission Hooks
export function useRoles() {
  return useQuery(ROLES_QUERY, {
    errorPolicy: 'all',
  });
}

export function useRole(id: string) {
  return useQuery(ROLE_QUERY, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  });
}

export function usePermissions() {
  return useQuery(PERMISSIONS_QUERY, {
    errorPolicy: 'all',
  });
}

export function useCreateRole() {
  const [createRoleMutation, { loading, error }] = useMutation(CREATE_ROLE_MUTATION, {
    refetchQueries: [{ query: ROLES_QUERY }],
  });

  const createRole = async (input: CreateRoleInput) => {
    try {
      const { data } = await createRoleMutation({
        variables: { input },
      });
      return { success: true, data: data?.createRole };
    } catch (err: any) {
      console.error('Create role error:', err);
      return { success: false, error: err.message };
    }
  };

  return { createRole, loading, error };
}

export function useUpdateRole() {
  const [updateRoleMutation, { loading, error }] = useMutation(UPDATE_ROLE_MUTATION);

  const updateRole = async (id: string, input: UpdateRoleInput) => {
    try {
      const { data } = await updateRoleMutation({
        variables: { id, input },
      });
      return { success: true, data: data?.updateRole };
    } catch (err: any) {
      console.error('Update role error:', err);
      return { success: false, error: err.message };
    }
  };

  return { updateRole, loading, error };
}

export function useDeleteRole() {
  const [deleteRoleMutation, { loading, error }] = useMutation(DELETE_ROLE_MUTATION, {
    refetchQueries: [{ query: ROLES_QUERY }],
  });

  const deleteRole = async (id: string) => {
    try {
      const { data } = await deleteRoleMutation({
        variables: { id },
      });
      return { success: true, data: data?.deleteRole };
    } catch (err: any) {
      console.error('Delete role error:', err);
      return { success: false, error: err.message };
    }
  };

  return { deleteRole, loading, error };
}

// Plan Management Hooks
export function usePlans() {
  return useQuery(PLANS_QUERY, {
    errorPolicy: 'all',
  });
}

export function usePlan(id: string) {
  return useQuery(PLAN_QUERY, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  });
}

export function useCreatePlan() {
  const [createPlanMutation, { loading, error }] = useMutation(CREATE_PLAN_MUTATION, {
    refetchQueries: [{ query: PLANS_QUERY }],
  });

  const createPlan = async (input: CreatePlanInput) => {
    try {
      const { data } = await createPlanMutation({
        variables: { input },
      });
      return { success: true, data: data?.createPlan };
    } catch (err: any) {
      console.error('Create plan error:', err);
      return { success: false, error: err.message };
    }
  };

  return { createPlan, loading, error };
}

export function useUpdatePlan() {
  const [updatePlanMutation, { loading, error }] = useMutation(UPDATE_PLAN_MUTATION);

  const updatePlan = async (id: string, input: UpdatePlanInput) => {
    try {
      const { data } = await updatePlanMutation({
        variables: { id, input },
      });
      return { success: true, data: data?.updatePlan };
    } catch (err: any) {
      console.error('Update plan error:', err);
      return { success: false, error: err.message };
    }
  };

  return { updatePlan, loading, error };
}

export function useDeletePlan() {
  const [deletePlanMutation, { loading, error }] = useMutation(DELETE_PLAN_MUTATION, {
    refetchQueries: [{ query: PLANS_QUERY }],
  });

  const deletePlan = async (id: string) => {
    try {
      const { data } = await deletePlanMutation({
        variables: { id },
      });
      return { success: true, data: data?.deletePlan };
    } catch (err: any) {
      console.error('Delete plan error:', err);
      return { success: false, error: err.message };
    }
  };

  return { deletePlan, loading, error };
}

// System Hooks
export function useSystemSettings() {
  return useQuery(SYSTEM_SETTINGS_QUERY, {
    errorPolicy: 'all',
  });
}

export function useSystemStats() {
  return useQuery(SYSTEM_STATS_QUERY, {
    errorPolicy: 'all',
  });
}