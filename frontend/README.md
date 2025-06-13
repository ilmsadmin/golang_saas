# ZPlus SaaS Platform - Frontend

This is the frontend implementation for the ZPlus SaaS multi-tenant platform, built with Next.js 13+, TypeScript, and Tailwind CSS.

## Features Implemented

### 🏗️ Architecture
- **Next.js 13+ with App Router** - Modern React framework
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Multi-tenant routing** - Dynamic routing based on subdomain detection

### 🎨 Design System
- Custom CSS variables for theme customization
- Consistent color scheme (primary blue, secondary gray tones)
- Reusable UI components (Button, Input, Sidebar)
- Responsive design with mobile-first approach

### 📱 Pages Implemented
- **Homepage (/)** - Interface overview and navigation
- **Authentication (/auth/signin)** - Multi-type signin (System Admin, Tenant Admin, Customer)
- **System Admin Dashboard (/admin/dashboard)** - Tenant management, system overview
- **Tenant Admin Dashboard** - User/customer management (subdomain routing)
- **Customer Dashboard (/dashboard)** - Service overview, billing, support

### 🎯 Multi-Tenant Support
- Route groups for different user types: `(system)`, `(tenant)`, `(customer)`
- Middleware for subdomain detection and route rewriting
- Context-aware navigation and user interfaces

## Getting Started

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Configuration
Copy `.env.example` to `.env.local` and update the values:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SYSTEM_DOMAIN=localhost:3001
NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX=.localhost:3001
```

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── (system)/          # System admin routes
│   ├── (tenant)/          # Tenant admin routes  
│   ├── (customer)/        # Customer routes
│   └── auth/              # Authentication pages
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   └── layouts/          # Layout components
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Multi-Tenant Routing

### Main Domain (localhost:3001)
- `/` - Homepage
- `/auth/signin` - Authentication
- `/admin/dashboard` - System admin dashboard

### Tenant Subdomains (company.localhost:3001)
- `/admin/dashboard` - Tenant admin dashboard
- `/dashboard` - Customer dashboard

## Components

### UI Components
- **Button** - Primary, secondary, outline, ghost variants
- **Input** - Form input with label, error, and helper text support
- **Sidebar** - Navigation sidebar with user profile

### Layout Components
- **Sidebar** - Reusable sidebar for admin interfaces

## Styling

### Custom CSS Classes
```css
.btn-primary        # Primary button style
.btn-secondary      # Secondary button style
.card              # Card container
.form-input        # Form input field
.sidebar-link      # Sidebar navigation link
.badge             # Status badge with variants
```

### Color Scheme
- **Primary:** Blue (various shades)
- **Secondary:** Gray (various shades)
- **Success:** Green
- **Warning:** Yellow
- **Error:** Red

## Development Notes

### Mock Data Integration
The current implementation uses mock data and simulated API calls. To integrate with the backend:

1. Update API endpoints in environment variables
2. Implement actual authentication service
3. Connect to real data sources
4. Add error handling and loading states

### TypeScript Types
All major interfaces are defined in `src/types/index.ts`:
- `User`, `SystemUser`, `TenantUser`
- `Tenant`, `Plan`, `Module`
- `LoginRequest`, `LoginResponse`
- `ApiResponse<T>`

### Next Steps
- Implement real API integration
- Add form validation
- Implement state management (Zustand)
- Add data fetching with React Query
- Implement real authentication with NextAuth.js
- Add more pages (user management, settings, etc.)

## Technology Stack

- **Next.js 15.3.3** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **ESLint** - Code linting
- **React** - UI library

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes
