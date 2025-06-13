import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import type { LoginRequest, LoginResponse } from '@/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId?: number;
    };
    accessToken: string;
    permissions: string[];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: number;
    accessToken: string;
    permissions: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    tenantId?: number;
    accessToken: string;
    permissions: string[];
  }
}

export const authOptions: AuthOptions = {
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

        try {
          const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8081/graphql';
          
          const response = await fetch(graphqlUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `
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
              `,
              variables: {
                input: {
                  email: credentials.email,
                  password: credentials.password,
                  tenantSlug: credentials.userType === 'tenant' ? getSubdomainFromHost() : undefined,
                }
              }
            }),
          });

          const result = await response.json();
          
          if (result.data?.login) {
            const { user, token } = result.data.login;
            const permissions = user.permissions?.map((p: any) => `${p.resource}:${p.action}`) || [];
            
            return {
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`.trim() || user.email,
              role: user.role?.name || 'customer',
              tenantId: user.tenantId,
              accessToken: token,
              permissions: permissions,
            };
          }
        } catch (error) {
          console.error('Authentication error:', error);
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
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

function getAuthEndpoint(userType: string): string {
  switch (userType) {
    case 'system':
      return '/auth/login'; // System admin login
    case 'tenant':
      return '/auth/login'; // Tenant admin login  
    case 'customer':
      return '/auth/login'; // Customer login
    default:
      return '/auth/login';
  }
}

function getSubdomainFromHost(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  return parts.length >= 3 ? parts[0] : null;
}

export default NextAuth(authOptions);