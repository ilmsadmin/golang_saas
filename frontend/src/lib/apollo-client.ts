import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Create HTTP Link
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql',
});

// Get token from localStorage (for client-side) or return empty string (for server-side)
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token') || '';
  }
  return '';
};

// Authentication Link
const authLink = setContext(async (_, { headers }) => {
  // Get authentication token
  const token = getAuthToken();
  
  // Extract subdomain for tenant context
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const subdomain = extractSubdomain(hostname);
  
  const requestHeaders = {
    ...headers,
    authorization: token ? `Bearer ${token}` : '',
    'X-Tenant': subdomain || '',
    'Content-Type': 'application/json',
  };
  
  console.log('[Apollo Client Debug] Request Headers:', requestHeaders);
  console.log('[Apollo Client Debug] Token:', token);
  console.log('[Apollo Client Debug] Subdomain:', subdomain);
  
  return {
    headers: requestHeaders
  };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle 401 errors by redirecting to login
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  }
});

// Helper function to extract subdomain
function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  return parts.length >= 3 ? parts[0] : null;
}

// Apollo Client Instance
export const apolloClient = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          users: {
            keyArgs: ['filters'],
            merge(existing = { items: [], total: 0 }, incoming) {
              return {
                ...incoming,
                items: [...(existing.items || []), ...(incoming.items || [])],
              };
            },
          },
          tenants: {
            keyArgs: ['filters'],
            merge(existing = { items: [], total: 0 }, incoming) {
              return {
                ...incoming,
                items: [...(existing.items || []), ...(incoming.items || [])],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
});