'use client';

import React, { useState } from 'react';
import { useTenants, useDeleteTenant } from '@/lib/graphql/hooks';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell, TableCell, EmptyTableState } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmationModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Tenant, TenantStatus, TenantFilter } from '@/types/graphql';
import Link from 'next/link';

export default function TenantsManagement() {
  const [filter, setFilter] = useState<TenantFilter>({});
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tenantsData, loading: tenantsLoading, refetch } = useTenants(
    { 
      ...filter,
      name: searchTerm || undefined
    }, 
    { page, limit: 10 }
  );
  const { deleteTenant, loading: deleteLoading } = useDeleteTenant();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (status: TenantStatus | undefined) => {
    setFilter({ status });
    setPage(1);
  };

  const handleViewDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowDetails(true);
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    
    try {
      const result = await deleteTenant(selectedTenant.id);
      if (result.success) {
        setShowDeleteConfirm(false);
        setSelectedTenant(null);
        refetch();
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
    }
  };

  const getStatusColor = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case TenantStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TenantStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      case TenantStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return 'Hoạt động';
      case TenantStatus.PENDING:
        return 'Chờ duyệt';
      case TenantStatus.SUSPENDED:
        return 'Tạm ngừng';
      case TenantStatus.INACTIVE:
        return 'Không hoạt động';
      default:
        return 'Không xác định';
    }
  };

  return (
    <ProtectedRoute requiredRole={['system_admin', 'super_admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý Tenants</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Quản lý tất cả tenants trong hệ thống
                  </p>
                </div>
                <PermissionGuard resource="tenants" action="create">
                  <Link href="/system/tenants/create">
                    <Button>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tạo Tenant mới
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm
                  </label>
                  <Input
                    type="text"
                    placeholder="Tên tenant..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    value={filter.status || ''}
                    onChange={(e) => handleFilterChange(e.target.value as TenantStatus || undefined)}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value={TenantStatus.ACTIVE}>Hoạt động</option>
                    <option value={TenantStatus.PENDING}>Chờ duyệt</option>
                    <option value={TenantStatus.SUSPENDED}>Tạm ngừng</option>
                    <option value={TenantStatus.INACTIVE}>Không hoạt động</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kết quả
                  </label>
                  <div className="text-sm text-gray-500 py-2">
                    {tenantsData?.total || 0} tenants
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFilter({});
                      setSearchTerm('');
                      setPage(1);
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Tenants Table */}
          <Card>
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeadCell>Tên</TableHeadCell>
                    <TableHeadCell>Domain</TableHeadCell>
                    <TableHeadCell>Plan</TableHeadCell>
                    <TableHeadCell>Trạng thái</TableHeadCell>
                    <TableHeadCell>Ngày tạo</TableHeadCell>
                    <TableHeadCell>Thao tác</TableHeadCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantsLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : tenantsData?.tenants?.length ? (
                    tenantsData.tenants.map((tenant: Tenant) => (
                      <TableRow key={tenant.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.slug}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {tenant.domain || `${tenant.subdomain}.zplus.vn`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {tenant.subscription?.plan?.name || 'Free'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${tenant.subscription?.plan?.price || 0}/tháng
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tenant.status)}`}>
                            {getStatusText(tenant.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(tenant.createdAt).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(tenant)}
                            >
                              Xem
                            </Button>
                            <PermissionGuard resource="tenants" action="update">
                              <Link href={`/system/tenants/${tenant.id}/edit`}>
                                <Button variant="ghost" size="sm">
                                  Sửa
                                </Button>
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard resource="tenants" action="delete">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                Xóa
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyTableState
                      title="Không có tenants"
                      description="Chưa có tenant nào được tạo hoặc không có kết quả phù hợp với bộ lọc"
                      action={
                        <PermissionGuard resource="tenants" action="create">
                          <Link href="/system/tenants/create">
                            <Button>Tạo Tenant đầu tiên</Button>
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

            {/* Pagination */}
            {tenantsData && tenantsData.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Hiển thị {((page - 1) * 10) + 1} đến {Math.min(page * 10, tenantsData.total)} của {tenantsData.total} kết quả
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm text-gray-700">
                      Trang {page} / {tenantsData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= tenantsData.totalPages}
                    >
                      Tiếp
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Tenant Details Modal */}
        {selectedTenant && (
          <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} size="lg">
            <ModalHeader onClose={() => setShowDetails(false)}>
              <h3 className="text-lg font-semibold text-gray-900">Chi tiết Tenant</h3>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTenant.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Slug</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTenant.slug}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subdomain</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTenant.subdomain}.zplus.vn</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain tùy chỉnh</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTenant.domain || 'Chưa cài đặt'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTenant.status)}`}>
                    {getStatusText(selectedTenant.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan hiện tại</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTenant.subscription?.plan?.name || 'Free'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTenant.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cập nhật lần cuối</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTenant.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              
              {selectedTenant.settings && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cài đặt</label>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedTenant.settings, null, 2)}
                  </pre>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Đóng
              </Button>
              <PermissionGuard resource="tenants" action="update">
                <Link href={`/system/tenants/${selectedTenant.id}/edit`}>
                  <Button>Chỉnh sửa</Button>
                </Link>
              </PermissionGuard>
            </ModalFooter>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteTenant}
          title="Xóa Tenant"
          message={`Bạn có chắc chắn muốn xóa tenant "${selectedTenant?.name}"? Hành động này không thể hoàn tác.`}
          confirmText="Xóa"
          cancelText="Hủy"
          type="danger"
          loading={deleteLoading}
        />
      </div>
    </ProtectedRoute>
  );
}