'use client';

import React from 'react';
import { Sidebar } from '@/components/layouts/Sidebar';
import { useTenantDashboardStats, useTenantUsers, useTenantCustomers } from '@/hooks/use-tenant';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/providers/tenant-provider';

export default function TenantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { data: stats, isLoading: statsLoading } = useTenantDashboardStats();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Check if user has tenant admin role
  React.useEffect(() => {
    if (session && !['tenant_admin', 'super_admin'].includes(session.user.role)) {
      router.push('/dashboard'); // Redirect to customer dashboard
    }
  }, [session, router]);

  if (status === 'loading' || tenantLoading || statsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Quản lý Người dùng',
      href: '/admin/users',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      name: 'Quản lý Khách hàng',
      href: '/admin/customers',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: 'Phân quyền',
      href: '/admin/roles',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Cài đặt',
      href: '/admin/settings',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const userInfo = {
    name: session.user.name || 'Tenant Admin',
    email: session.user.email || '',
  };

  const handleLogout = () => {
    router.push('/api/auth/signout');
  };

  // Mock stats if no real data
  const mockStats = {
    users_count: 35,
    customers_count: 125,
    subscriptions_count: 95,
    revenue_monthly: 15000000,
    active_subscriptions: 92,
    pending_payments: 3,
    support_tickets: 5,
  };

  const currentStats = stats || mockStats;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        title={tenant?.name || 'Tenant Admin'}
        items={sidebarItems}
        userInfo={userInfo}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Tenant Dashboard</h1>
            <p className="text-gray-600">
              Quản lý {tenant?.name || 'tenant'} - {tenant?.subdomain || ''}.zplus.vn
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : currentStats.users_count}
                  </h3>
                  <p className="text-sm text-gray-500">Tổng Người dùng</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : currentStats.customers_count}
                  </h3>
                  <p className="text-sm text-gray-500">Tổng Khách hàng</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : currentStats.active_subscriptions}
                  </h3>
                  <p className="text-sm text-gray-500">Đăng ký hoạt động</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : currentStats.support_tickets}
                  </h3>
                  <p className="text-sm text-gray-500">Yêu cầu hỗ trợ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue and Plan Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Doanh thu tháng</h4>
              <p className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : `${(currentStats.revenue_monthly / 1000000).toLocaleString('vi-VN')}M VND`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {currentStats.pending_payments} thanh toán đang chờ
              </p>
            </div>
            
            <div className="card p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Gói hiện tại</h4>
              <p className="text-xl font-bold text-blue-600">{tenant?.plan?.name || 'Pro Plan'}</p>
              <p className="text-sm text-gray-500 mt-1">
                {tenant?.plan?.price || 99.99} USD/tháng
              </p>
            </div>
            
            <div className="card p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Trạng thái</h4>
              <p className="text-xl font-bold text-green-600">
                {tenant?.status === 'active' ? 'Hoạt động' : 
                 tenant?.status === 'trial' ? 'Thử nghiệm' : 'Tạm ngừng'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Từ {tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString('vi-VN') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Người dùng mới nhất</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { name: 'Nguyễn Văn A', email: 'a.nguyen@company.com', role: 'Admin', date: '1 giờ trước' },
                    { name: 'Trần Thị B', email: 'b.tran@company.com', role: 'User', date: '2 giờ trước' },
                    { name: 'Lê Văn C', email: 'c.le@company.com', role: 'Manager', date: '1 ngày trước' },
                  ].map((user, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="badge badge-info">{user.role}</span>
                        <span className="text-xs text-gray-500">{user.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Customers */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Khách hàng mới nhất</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { name: 'Công ty ABC', email: 'info@abc.com', plan: 'Pro', date: '30 phút trước' },
                    { name: 'XYZ Enterprise', email: 'contact@xyz.com', plan: 'Enterprise', date: '2 giờ trước' },
                    { name: 'StartUp DEF', email: 'hello@def.com', plan: 'Starter', date: '5 giờ trước' },
                  ].map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="badge badge-success">{customer.plan}</span>
                        <span className="text-xs text-gray-500">{customer.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}