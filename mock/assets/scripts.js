// Common JavaScript utilities for mock interfaces

// Mock data for demonstrations
const mockData = {
  tenants: [
    { id: 1, name: 'Acme Corp', subdomain: 'acme', status: 'active', plan: 'premium', users: 45 },
    { id: 2, name: 'TechStart', subdomain: 'techstart', status: 'active', plan: 'basic', users: 12 },
    { id: 3, name: 'Global LLC', subdomain: 'global', status: 'suspended', plan: 'premium', users: 78 }
  ],
  customers: [
    { id: 1, name: 'John Doe', email: 'john@acme.com', role: 'user', status: 'active', lastLogin: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@acme.com', role: 'manager', status: 'active', lastLogin: '2024-01-14' },
    { id: 3, name: 'Bob Wilson', email: 'bob@acme.com', role: 'user', status: 'inactive', lastLogin: '2024-01-10' }
  ],
  modules: [
    { id: 1, name: 'User Management', description: 'Manage users and permissions', status: 'active', price: 10 },
    { id: 2, name: 'QR Check-in', description: 'QR code check-in system', status: 'active', price: 15 },
    { id: 3, name: 'LMS', description: 'Learning Management System', status: 'beta', price: 25 },
    { id: 4, name: 'CRM', description: 'Customer Relationship Management', status: 'active', price: 20 }
  ]
};

// Utility functions
const utils = {
  // Format date
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  },

  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  // Get status badge class
  getStatusBadge: (status) => {
    const statusClasses = {
      'active': 'badge badge-success',
      'inactive': 'badge badge-warning',
      'suspended': 'badge badge-error',
      'beta': 'badge badge-info'
    };
    return statusClasses[status] || 'badge';
  },

  // Show toast notification
  showToast: (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md text-white z-50 ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  },

  // Toggle mobile menu
  toggleMobileMenu: () => {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  },

  // Handle form submission
  handleFormSubmit: (event, callback) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // Simulate API call
    setTimeout(() => {
      if (callback) callback(data);
      utils.showToast('Dữ liệu đã được lưu thành công!', 'success');
    }, 1000);
  },

  // Load data into table
  loadTable: (containerId, data, columns) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tbody = container.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    data.forEach(item => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';
      
      columns.forEach(column => {
        const cell = document.createElement('td');
        cell.className = 'table-cell';
        
        if (column.render) {
          cell.innerHTML = column.render(item[column.key], item);
        } else {
          cell.textContent = item[column.key] || '';
        }
        
        row.appendChild(cell);
      });
      
      tbody.appendChild(row);
    });
  },

  // Initialize components
  init: () => {
    // Add event listeners for common interactions
    document.addEventListener('DOMContentLoaded', () => {
      // Mobile menu toggle
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', utils.toggleMobileMenu);
      }

      // Dropdown toggles
      document.querySelectorAll('[data-dropdown-toggle]').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = button.getAttribute('data-dropdown-toggle');
          const dropdown = document.getElementById(targetId);
          if (dropdown) {
            dropdown.classList.toggle('hidden');
          }
        });
      });

      // Close dropdowns when clicking outside
      document.addEventListener('click', () => {
        document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
          dropdown.classList.add('hidden');
        });
      });
    });
  }
};

// Theme management
const theme = {
  // Get current theme
  getCurrentTheme: () => {
    return localStorage.getItem('theme') || 'light';
  },

  // Set theme
  setTheme: (themeName) => {
    localStorage.setItem('theme', themeName);
    document.documentElement.setAttribute('data-theme', themeName);
  },

  // Toggle theme
  toggleTheme: () => {
    const current = theme.getCurrentTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    theme.setTheme(newTheme);
  },

  // Initialize theme
  init: () => {
    const savedTheme = theme.getCurrentTheme();
    theme.setTheme(savedTheme);
  }
};

// Initialize everything
utils.init();
theme.init();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { utils, theme, mockData };
}