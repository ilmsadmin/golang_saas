'use client';

import React from 'react';
import { useSystemStats, useTenants } from '@/lib/graphql/hooks';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, StatsCard } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell, TableCell, EmptyTableState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Tenant } from '@/types/graphql';
import Link from 'next/link';

export default function SystemDashboard() {
  const { data: systemStats, loading: statsLoading } = useSystemStats();
  const { data: tenantsData, loading: tenantsLoading } = useTenants({}, { page: 1, limit: 5 });

  // Mock data for demonstration since we may not have real backend data yet
  const mockStats = {
    totalTenants: 25,
    activeTenants: 18,
    trialTenants: 5,
    suspendedTenants: 2,
    monthlyRevenue: 150000000, // 150M VND
    activeSubscriptions: 23,
    pendingPayments: 3,
    supportTickets: 12,
  };

  const stats = systemStats || mockStats;

  return (
    <ProtectedRoute requiredRole={['system_admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">System Admin Dashboard</h1>
                  <p className="mt-1 text-sm text-gray-500">Tổng quan hệ thống và quản lý tenant</p>
                </div>
                <div className="flex space-x-3">
                  <PermissionGuard resource="tenants" action="create">
                    <Link href="/system/tenants/create">
                      <Button>Tạo Tenant mới</Button>
                    </Link>
                  </PermissionGuard>
                  <PermissionGuard resource="plans" action="create">
                    <Link href="/system/plans/create">
                      <Button variant="outline">Tạo Plan mới</Button>
                    </Link>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Tổng Tenants"
              value={statsLoading ? '...' : stats.totalTenants || 0}
              change={{ value: '+3 tháng này', type: 'increase' }}
              icon={
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
            
            <StatsCard
              title="Tenants Hoạt động"
              value={statsLoading ? '...' : stats.activeTenants || 0}
              change={{ value: '85% tổng số', type: 'increase' }}
              icon={
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatsCard
              title="Doanh thu tháng"
              value={statsLoading ? '...' : `${(stats.monthlyRevenue / 1000000).toFixed(0)}M VND`}
              change={{ value: '+12% tháng trước', type: 'increase' }}
              icon={
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
            
            <StatsCard
              title="Hỗ trợ mở"
              value={statsLoading ? '...' : stats.supportTickets || 0}
              change={{ value: '-5 hôm qua', type: 'decrease' }}
              icon={
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Z" />
                </svg>
              }
            />
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
                <div className="space-y-3">
                  <PermissionGuard resource="tenants" action="create">
                    <Link href="/system/tenants/create" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Tạo Tenant mới
                      </Button>
                    </Link>
                  </PermissionGuard>
                  
                  <PermissionGuard resource="plans" action="read">
                    <Link href="/system/plans" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Quản lý Plans
                      </Button>
                    </Link>
                  </PermissionGuard>
                  
                  <PermissionGuard resource="system" action="read">
                    <Link href="/system/analytics" className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Xem Báo cáo
                      </Button>
                    </Link>
                  </PermissionGuard>
                </div>
              </div>
            </Card>

            {/* System Health */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái hệ thống</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Server</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Hoạt động</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Hoạt động</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Redis Cache</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Hoạt động</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Service</span>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Chậm</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiệu suất</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">CPU Usage</span>
                      <span className="text-gray-900">45%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Memory</span>
                      <span className="text-gray-900">62%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Storage</span>
                      <span className="text-gray-900">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Tenants */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tenants gần đây</h3>
                <Link href="/system/tenants">
                  <Button variant="outline" size="sm">Xem tất cả</Button>
                </Link>
              </div>
            </div>
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeadCell>Tên</TableHeadCell>
                    <TableHeadCell>Subdomain</TableHeadCell>
                    <TableHeadCell>Plan</TableHeadCell>
                    <TableHeadCell>Trạng thái</TableHeadCell>
                    <TableHeadCell>Ngày tạo</TableHeadCell>
                    <TableHeadCell>Thao tác</TableHeadCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-pulse flex space-x-4">
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : tenantsData?.tenants?.length ? (
                    tenantsData.tenants.slice(0, 5).map((tenant: Tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell className="text-gray-500">{tenant.subdomain}.zplus.vn</TableCell>
                        <TableCell>
                          {tenant.subscription?.plan?.name || 'Free'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            tenant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tenant.status === 'ACTIVE' ? 'Hoạt động' :
                             tenant.status === 'PENDING' ? 'Đang chờ' : 'Tạm ngừng'}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(tenant.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <PermissionGuard resource="tenants" action="update">
                            <Link href={`/system/tenants/${tenant.id}`}>
                              <Button variant="ghost" size="sm">Xem</Button>
                            </Link>
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyTableState
                      title="Chưa có tenants"
                      description="Bắt đầu bằng cách tạo tenant đầu tiên"
                      action={
                        <PermissionGuard resource="tenants" action="create">
                          <Link href="/system/tenants/create">
                            <Button>Tạo Tenant</Button>
                          </Link>
                        </PermissionGuard>
                      }
                      icon={
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      }
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}