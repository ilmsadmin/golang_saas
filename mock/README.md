# Mock Frontend Interfaces

This directory contains mock HTML interfaces for the multi-tenant SaaS platform frontend based on the project documentation.

## 🚀 Quick Start

Open `index.html` in your browser to access all mock interfaces.

## 📁 Directory Structure

```
mock/
├── index.html                  # Main entry point with interface navigation
├── README.md                   # This documentation
├── assets/                     # Shared assets
│   ├── styles.css             # CSS with Tailwind classes and custom styles
│   └── scripts.js             # JavaScript utilities and mock data
├── auth/                       # Authentication interfaces
│   ├── signin.html            # Multi-role sign-in page
│   └── register.html          # Tenant registration page
├── system/                     # System admin interfaces (zplus.vn/admin)
│   └── dashboard.html         # System admin dashboard with tenant management
├── tenant/                     # Tenant admin interfaces (tenant1.zplus.vn/admin)
│   └── dashboard.html         # Tenant admin dashboard with customer management
├── customer/                   # Customer interfaces (tenant1.zplus.vn/)
│   └── dashboard.html         # Customer dashboard with service access
└── components/                 # Shared UI components
    ├── navigation.html        # Top navigation component
    └── sidebar.html           # Sidebar layout component
```

## 🎨 Interface Overview

### 1. Authentication System
- **Multi-role sign-in**: Support for System Admin, Tenant Admin, and Customer roles
- **Tenant registration**: Complete registration flow for new tenants
- **Role-based routing**: Redirect users to appropriate dashboards based on role

### 2. System Admin Interface (zplus.vn/admin)
- **Dashboard**: Overview with stats, recent tenants, and system status
- **Tenant Management**: CRUD operations for tenant accounts
- **Module Management**: Enable/disable modules for tenants
- **Analytics**: System-wide reporting and monitoring

### 3. Tenant Admin Interface (tenant1.zplus.vn/admin)
- **Dashboard**: Tenant-specific metrics and customer overview
- **Customer Management**: CRUD operations for customer accounts
- **Service Management**: Configure and manage available services
- **Notifications**: Send notifications to customers
- **Reports**: Tenant-specific analytics and reporting

### 4. Customer Interface (tenant1.zplus.vn/)
- **Dashboard**: Personal dashboard with service access
- **Service Usage**: Access to subscribed services (QR Check-in, LMS, CRM, etc.)
- **Subscription Management**: View and manage service subscriptions
- **Profile Management**: Personal information and account settings

## 🛠 Technologies Used

- **HTML5**: Modern semantic markup
- **Tailwind CSS**: Utility-first CSS framework via CDN
- **Vanilla JavaScript**: No framework dependencies
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation
- **Modern Browser Support**: ES6+ features

## ✨ Features Implemented

### Design System
- **Consistent color scheme**: Primary blue, secondary gray tones
- **Typography**: Clear hierarchy with proper font sizes
- **Spacing**: Consistent margins and padding
- **Component library**: Reusable buttons, forms, tables, cards

### User Experience
- **Multi-tenant simulation**: Different branding for each tenant
- **Role-based navigation**: Appropriate menus for each user type
- **Interactive elements**: Hover states, focus indicators
- **Loading states**: Simulated API calls with feedback
- **Toast notifications**: User feedback for actions

### Functionality
- **Form handling**: Validation and submission simulation
- **Table management**: Sortable, filterable data tables
- **Modal dialogs**: For creating/editing entities
- **Theme support**: CSS variables for easy customization
- **Mock data**: Realistic sample data for demonstrations

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Tablet support**: Appropriate layouts for medium screens
- **Desktop optimization**: Full-featured layouts for large screens
- **Touch-friendly**: Large tap targets and gestures

## 🎯 Multi-Tenant Architecture Simulation

The mock interfaces simulate the multi-tenant architecture described in the project documentation:

### Domain Structure
- **System**: `zplus.vn/admin` (System admin access)
- **Tenant**: `tenant1.zplus.vn/admin` (Tenant admin access)
- **Customer**: `tenant1.zplus.vn/` (Customer access)

### User Roles & Permissions
- **System Admin**: Manage all tenants, modules, and system settings
- **Tenant Admin**: Manage customers and services within their tenant
- **Customer**: Access subscribed services and manage personal profile

### Service Modules
- **User Management**: Basic user and permission management
- **QR Check-in**: QR code-based check-in system
- **LMS**: Learning Management System
- **CRM**: Customer Relationship Management

## 🔧 Customization

### Theming
- CSS variables in `assets/styles.css` for easy color customization
- Tailwind CSS classes for consistent spacing and typography
- Dark mode support prepared (can be activated via JavaScript)

### Adding New Interfaces
1. Create new HTML file following existing structure
2. Include shared assets: `styles.css` and `scripts.js`
3. Use existing CSS classes and JavaScript utilities
4. Add navigation links in appropriate parent interfaces

### Mock Data
- Extend `mockData` object in `assets/scripts.js`
- Use `utils.loadTable()` for displaying tabular data
- Implement form handling with `utils.handleFormSubmit()`

## 📱 Browser Support

- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Progressive enhancement**: Core functionality works without JavaScript

## 🚀 Future Enhancements

- Add more interactive components (charts, graphs)
- Implement drag-and-drop functionality
- Add real-time notification system
- Integrate with backend API endpoints
- Add animation and transition effects
- Implement proper state management

## 📞 Usage Notes

1. **Start from index.html**: Use the main entry point to navigate between interfaces
2. **Test different roles**: Try signing in as different user types to see role-based interfaces
3. **Responsive testing**: Test on different screen sizes and devices
4. **Interactive elements**: Click buttons, fill forms, and navigate between sections
5. **Browser console**: Check for any JavaScript errors or warnings

This mock implementation serves as a comprehensive foundation for the actual frontend development using Next.js, TypeScript, and the complete tech stack outlined in the project documentation.