'use client';

import React from 'react';
import { Sidebar } from '@/components/layouts/Sidebar';
import { useSystemDashboardStats, useSystemTenants } from '@/hooks/use-system';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SystemDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useSystemDashboardStats();
  const { data: tenantsData, isLoading: tenantsLoading } = useSystemTenants({ limit: 5 });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Check if user has system admin role
  React.useEffect(() => {
    if (session && !['super_admin', 'admin'].includes(session.user.role)) {
      router.push('/dashboard'); // Redirect to customer dashboard
    }
  }, [session, router]);

  if (status === 'loading' || statsLoading) {
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
      name: 'Quản lý Tenant',
      href: '/admin/tenants',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Quản lý Module',
      href: '/admin/modules',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-4l-3 3.5L19 14M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Gói cước',
      href: '/admin/plans',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Báo cáo & Thống kê',
      href: '/admin/analytics',
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Cài đặt hệ thống',
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
    name: session.user.name || 'System Admin',
    email: session.user.email || '',
  };

  const handleLogout = () => {
    router.push('/api/auth/signout');
  };

  // Calculate tenant stats
  const totalTenants = stats?.users_count || 0; // Using users_count as proxy for tenants
  const activeTenants = Math.floor(totalTenants * 0.85);
  const trialTenants = Math.floor(totalTenants * 0.10);
  const suspendedTenants = totalTenants - activeTenants - trialTenants;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        title="System Admin"
        items={sidebarItems}
        userInfo={userInfo}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
            <p className="text-gray-600">Tổng quan hệ thống và quản lý tenant</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : totalTenants}
                  </h3>
                  <p className="text-sm text-gray-500">Tổng Tenant</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : activeTenants}
                  </h3>
                  <p className="text-sm text-gray-500">Tenant Hoạt động</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : trialTenants}
                  </h3>
                  <p className="text-sm text-gray-500">Tenant Thử nghiệm</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {statsLoading ? '...' : suspendedTenants}
                  </h3>
                  <p className="text-sm text-gray-500">Tenant Tạm ngừng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue and Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Doanh thu tháng</h4>
              <p className="text-2xl font-bold text-green-600">
                {statsLoading ? '...' : `${(stats?.revenue_monthly || 0 / 1000000).toLocaleString('vi-VN')}M VND`}
              </p>
              <p className="text-sm text-gray-500 mt-1">+12% so với tháng trước</p>
            </div>
            
            <div className="card p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Đăng ký hoạt động</h4>
              <p className="text-2xl font-bold text-blue-600">
                {statsLoading ? '...' : (stats?.active_subscriptions || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {statsLoading ? '...' : `${stats?.pending_payments || 0} đang chờ thanh toán`}
              </p>
            </div>
            
            <div className="card p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Hỗ trợ</h4>
              <p className="text-2xl font-bold text-orange-600">
                {statsLoading ? '...' : (stats?.support_tickets || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Yêu cầu hỗ trợ đang mở</p>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tenants */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Tenant mới nhất</h3>
              </div>
              <div className="p-6">
                {tenantsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(tenantsData?.items || []).slice(0, 5).map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-xs text-gray-500">{tenant.subdomain}.zplus.vn</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${
                            tenant.status === 'active' ? 'badge-success' : 
                            tenant.status === 'trial' ? 'badge-warning' : 'badge-error'
                          }`}>
                            {tenant.status === 'active' ? 'Hoạt động' : 
                             tenant.status === 'trial' ? 'Thử nghiệm' : 'Tạm ngừng'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(tenant.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Trạng thái hệ thống</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Server</span>
                    <span className="badge badge-success">Hoạt động</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="badge badge-success">Hoạt động</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Redis Cache</span>
                    <span className="badge badge-success">Hoạt động</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Service</span>
                    <span className="badge badge-warning">Chậm</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Storage</span>
                    <span className="badge badge-success">Hoạt động</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}