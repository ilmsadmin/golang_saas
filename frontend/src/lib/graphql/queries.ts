import { gql } from '@apollo/client';

// Fragments
export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    email
    firstName
    lastName
    isActive
    tenantId
    role {
      id
      name
      description
      isSystemRole
    }
    permissions {
      id
      name
      resource
      action
      description
    }
    createdAt
    updatedAt
  }
`;

export const TENANT_FRAGMENT = gql`
  fragment TenantFragment on Tenant {
    id
    name
    slug
    domain
    subdomain
    status
    settings
    subscription {
      id
      status
      currentPeriodStart
      currentPeriodEnd
      plan {
        id
        name
        price
        maxUsers
      }
    }
    createdAt
    updatedAt
  }
`;

export const ROLE_FRAGMENT = gql`
  fragment RoleFragment on Role {
    id
    name
    description
    isSystemRole
    tenantId
    permissions {
      id
      name
      resource
      action
      description
    }
    createdAt
    updatedAt
  }
`;

export const PLAN_FRAGMENT = gql`
  fragment PlanFragment on Plan {
    id
    name
    description
    price
    features
    maxUsers
    createdAt
    updatedAt
  }
`;

// Authentication Queries
export const ME_QUERY = gql`
  ${USER_FRAGMENT}
  query Me {
    me {
      ...UserFragment
      tenant {
        ...TenantFragment
      }
    }
  }
  ${TENANT_FRAGMENT}
`;

export const LOGIN_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      refreshToken
      user {
        ...UserFragment
        tenant {
          ...TenantFragment
        }
      }
      tenant {
        ...TenantFragment
      }
    }
  }
  ${TENANT_FRAGMENT}
`;

export const REGISTER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      refreshToken
      user {
        ...UserFragment
        tenant {
          ...TenantFragment
        }
      }
      tenant {
        ...TenantFragment
      }
    }
  }
  ${TENANT_FRAGMENT}
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      token
      refreshToken
      user {
        ...UserFragment
      }
    }
  }
`;

// User Management Queries
export const USERS_QUERY = gql`
  ${USER_FRAGMENT}
  query Users($filter: UserFilter, $pagination: PaginationInput) {
    users(filter: $filter, pagination: $pagination) {
      users {
        ...UserFragment
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const USER_QUERY = gql`
  ${USER_FRAGMENT}
  query User($id: ID!) {
    user(id: $id) {
      ...UserFragment
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ...UserFragment
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  ${USER_FRAGMENT}
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      ...UserFragment
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

// Tenant Management Queries
export const TENANTS_QUERY = gql`
  ${TENANT_FRAGMENT}
  query Tenants($filter: TenantFilter, $pagination: PaginationInput) {
    tenants(filter: $filter, pagination: $pagination) {
      tenants {
        ...TenantFragment
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const TENANT_QUERY = gql`
  ${TENANT_FRAGMENT}
  query Tenant($id: ID!) {
    tenant(id: $id) {
      ...TenantFragment
      users {
        ...UserFragment
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const TENANT_BY_SLUG_QUERY = gql`
  ${TENANT_FRAGMENT}
  query TenantBySlug($slug: String!) {
    tenantBySlug(slug: $slug) {
      ...TenantFragment
    }
  }
`;

export const CREATE_TENANT_MUTATION = gql`
  ${TENANT_FRAGMENT}
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      ...TenantFragment
    }
  }
`;

export const UPDATE_TENANT_MUTATION = gql`
  ${TENANT_FRAGMENT}
  mutation UpdateTenant($id: ID!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, input: $input) {
      ...TenantFragment
    }
  }
`;

export const DELETE_TENANT_MUTATION = gql`
  mutation DeleteTenant($id: ID!) {
    deleteTenant(id: $id)
  }
`;

// Role and Permission Queries
export const ROLES_QUERY = gql`
  ${ROLE_FRAGMENT}
  query Roles {
    roles {
      ...RoleFragment
    }
  }
`;

export const ROLE_QUERY = gql`
  ${ROLE_FRAGMENT}
  query Role($id: ID!) {
    role(id: $id) {
      ...RoleFragment
      users {
        ...UserFragment
      }
    }
  }
  ${USER_FRAGMENT}
`;

export const PERMISSIONS_QUERY = gql`
  query Permissions {
    permissions {
      id
      name
      resource
      action
      description
      isSystemPermission
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ROLE_MUTATION = gql`
  ${ROLE_FRAGMENT}
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      ...RoleFragment
    }
  }
`;

export const UPDATE_ROLE_MUTATION = gql`
  ${ROLE_FRAGMENT}
  mutation UpdateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      ...RoleFragment
    }
  }
`;

export const DELETE_ROLE_MUTATION = gql`
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`;

// Plan Management Queries
export const PLANS_QUERY = gql`
  ${PLAN_FRAGMENT}
  query Plans {
    plans {
      ...PlanFragment
      subscriptions {
        id
        status
        tenant {
          id
          name
        }
      }
    }
  }
`;

export const PLAN_QUERY = gql`
  ${PLAN_FRAGMENT}
  query Plan($id: ID!) {
    plan(id: $id) {
      ...PlanFragment
      subscriptions {
        id
        status
        currentPeriodStart
        currentPeriodEnd
        tenant {
          id
          name
          slug
        }
      }
    }
  }
`;

export const CREATE_PLAN_MUTATION = gql`
  ${PLAN_FRAGMENT}
  mutation CreatePlan($input: CreatePlanInput!) {
    createPlan(input: $input) {
      ...PlanFragment
    }
  }
`;

export const UPDATE_PLAN_MUTATION = gql`
  ${PLAN_FRAGMENT}
  mutation UpdatePlan($id: ID!, $input: UpdatePlanInput!) {
    updatePlan(id: $id, input: $input) {
      ...PlanFragment
    }
  }
`;

export const DELETE_PLAN_MUTATION = gql`
  mutation DeletePlan($id: ID!) {
    deletePlan(id: $id)
  }
`;

// System Queries
export const SYSTEM_SETTINGS_QUERY = gql`
  query SystemSettings {
    systemSettings {
      id
      key
      value
      description
      createdAt
      updatedAt
    }
  }
`;

export const SYSTEM_STATS_QUERY = gql`
  query SystemStats {
    systemStats
  }
`;