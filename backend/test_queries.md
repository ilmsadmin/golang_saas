# GraphQL Test Queries

## Health Check
```graphql
query {
  __schema {
    types {
      name
    }
  }
}
```

## Register a new user
```graphql
mutation RegisterUser {
  register(input: {
    email: "john.doe@example.com"
    password: "password123"
    firstName: "John"
    lastName: "Doe"
  }) {
    token
    refreshToken
    user {
      id
      email
      firstName
      lastName
      isActive
      role {
        name
        description
      }
    }
  }
}
```

## Login
```graphql
mutation LoginUser {
  login(input: {
    email: "john.doe@example.com"
    password: "password123"
  }) {
    token
    refreshToken
    user {
      id
      email
      firstName
      lastName
      isActive
      role {
        name
        description
        permissions {
          name
          resource
          action
        }
      }
    }
  }
}
```

## Get current user (requires Authorization header)
```graphql
query Me {
  me {
    id
    email
    firstName
    lastName
    isActive
    role {
      name
      description
      permissions {
        name
        resource
        action
      }
    }
    tenant {
      id
      name
      slug
      status
    }
  }
}
```

## Get users (requires Authorization header and permissions)
```graphql
query GetUsers {
  users(
    pagination: { page: 1, limit: 10 }
    filter: { isActive: true }
  ) {
    users {
      id
      email
      firstName
      lastName
      isActive
      role {
        name
      }
    }
    total
    page
    limit
    totalPages
  }
}
```

## Create a tenant (requires system admin permissions)
```graphql
mutation CreateTenant {
  createTenant(input: {
    name: "Acme Corporation"
    slug: "acme-corp"
    subdomain: "acme"
    adminEmail: "admin@acme.com"
    adminPassword: "admin123"
    adminFirstName: "Admin"
    adminLastName: "User"
    planId: "PLAN_ID_HERE" # You'll need to get a plan ID first
  }) {
    id
    name
    slug
    subdomain
    status
  }
}
```

## Get subscription plans
```graphql
query GetPlans {
  plans {
    id
    name
    description
    price
    maxUsers
  }
}
```

## Authorization Header Format
When testing authenticated queries, add this header:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```
