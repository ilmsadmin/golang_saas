import { gql } from '@apollo/client';

// Authentication mutations
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
        isActive
        role {
          id
          name
        }
        tenantId
        tenant {
          id
          name
          slug
        }
        permissions {
          id
          name
          resource
          action
        }
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
        isActive
        role {
          id
          name
        }
        tenantId
        tenant {
          id
          name
          slug
        }
        permissions {
          id
          name
          resource
          action
        }
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
        isActive
        role {
          id
          name
        }
        tenantId
        tenant {
          id
          name
          slug
        }
        permissions {
          id
          name
          resource
          action
        }
      }
    }
  }
`;

// Query for current user
export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      isActive
      role {
        id
        name
      }
      tenantId
      tenant {
        id
        name
        slug
      }
      permissions {
        id
        name
        resource
        action
      }
    }
  }
`;
