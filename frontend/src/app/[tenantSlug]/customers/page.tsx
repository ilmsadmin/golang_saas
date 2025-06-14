'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenantCustomers, useCreateTenantCustomer, useUpdateTenantCustomer, useDeleteTenantCustomer } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/providers/tenant-provider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeadCell } from '@/components/ui/Table';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { validateTenantSlug } from '@/utils/slug-validation';
import type { Customer } from '@/types';

interface CustomerFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  address?: string;
}

const defaultFormData: CustomerFormData = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  company: '',
  address: '',
};

export default function TenantCustomersPage() {
  const { isAuthenticated, storedUser, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(defaultFormData);

  // Prepare filters for API
  const filters = useMemo(() => ({
    page,
    limit: 10,
    search: searchTerm,
    status: selectedStatus,
  }), [page, searchTerm, selectedStatus]);

  // Fetch data
  const { data: customersData, isLoading: customersLoading, error: customersError } = useTenantCustomers(filters);
  const createCustomerMutation = useCreateTenantCustomer();
  const updateCustomerMutation = useUpdateTenantCustomer();
  const deleteCustomerMutation = useDeleteTenantCustomer();

  // Validate tenant slug
  React.useEffect(() => {
    if (tenantSlug) {
      const slugValidation = validateTenantSlug(tenantSlug);
      if (!slugValidation.valid) {
        console.error('Invalid tenant slug:', slugValidation.error);
        router.push('/unauthorized');
        return;
      }
    }
  }, [tenantSlug, router]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  // Check tenant admin access
  React.useEffect(() => {
    if (storedUser && !['tenant_admin', 'tenant_manager', 'super_admin'].includes(storedUser.role.name)) {
      router.push('/dashboard');
    }
  }, [storedUser, router]);

  // Handle customer actions
  const handleCreateCustomer = async () => {
    try {
      await createCustomerMutation.mutateAsync(formData);
      setShowCreateModal(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      await updateCustomerMutation.mutateAsync({ id: selectedCustomer.id, data: formData });
      setShowEditModal(false);
      setSelectedCustomer(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      await deleteCustomerMutation.mutateAsync(selectedCustomer.id);
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone || '',
      company: '', // Add company field if exists in customer data
      address: '', // Add address field if exists in customer data
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  // Sidebar configuration
  const sidebarItems = [
    {
      name: 'Dashboard',
      href: `/${tenantSlug}`,
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Quản lý Người dùng',
      href: `/${tenantSlug}/users`,
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      name: 'Quản lý Khách hàng',
      href: `/${tenantSlug}/customers`,
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      active: true,
    },
    {
      name: 'Phân quyền',
      href: `/${tenantSlug}/roles`,
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Cài đặt',
      href: `/${tenantSlug}/settings`,
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const userInfo = {
    name: storedUser ? `${storedUser.firstName} ${storedUser.lastName}` : 'Tenant Admin',
    email: storedUser?.email || '',
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/signin');
    }
  };

  if (authLoading || tenantLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated || !storedUser) {
    return null;
  }

  return (
    <ProtectedRoute requiredRole={['tenant_admin', 'tenant_manager', 'super_admin']}>
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
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Khách hàng</h1>
              <p className="text-gray-600">
                Quản lý khách hàng trong {tenant?.name || 'tenant'}
              </p>
            </div>

            {/* Filters and Actions */}
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <Input
                      placeholder="Tìm kiếm theo tên, email, công ty..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                      <option value="suspended">Tạm ngừng</option>
                    </select>
                  </div>
                  <PermissionGuard resource="customers" action="create">
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Thêm khách hàng
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </Card>

            {/* Customers Table */}
            <Card>
              <div className="overflow-hidden">
                {customersLoading ? (
                  <div className="p-8 text-center">
                    <div className="loading-spinner mx-auto"></div>
                    <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                ) : customersError ? (
                  <div className="p-8 text-center">
                    <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeadCell>Tên</TableHeadCell>
                        <TableHeadCell>Email</TableHeadCell>
                        <TableHeadCell>Điện thoại</TableHeadCell>
                        <TableHeadCell>Gói dịch vụ</TableHeadCell>
                        <TableHeadCell>Trạng thái</TableHeadCell>
                        <TableHeadCell>Ngày tạo</TableHeadCell>
                        <TableHeadCell>Thao tác</TableHeadCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customersData?.items?.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
                                  {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {customer.first_name} {customer.last_name}
                                </div>
                                {customer.subscription && (
                                  <div className="text-xs text-gray-500">
                                    ID: {customer.id}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone || '-'}</TableCell>
                          <TableCell>
                            {customer.subscription ? (
                              <span className="badge badge-success">
                                {customer.subscription.plan?.name || 'Active'}
                              </span>
                            ) : (
                              <span className="badge badge-secondary">Free</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`badge ${
                              customer.status === 'active' ? 'badge-success' : 
                              customer.status === 'suspended' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {customer.status === 'active' ? 'Hoạt động' : 
                               customer.status === 'suspended' ? 'Tạm ngừng' : 'Không hoạt động'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(customer.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <PermissionGuard resource="customers" action="read">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {/* View customer details */}}
                                >
                                  Xem
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard resource="customers" action="update">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(customer)}
                                >
                                  Sửa
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard resource="customers" action="delete">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal(customer)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Xóa
                                </Button>
                              </PermissionGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              
              {/* Pagination */}
              {customersData && customersData.pagination.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {((page - 1) * 10) + 1} - {Math.min(page * 10, customersData.pagination.total_items)} 
                      trong tổng số {customersData.pagination.total_items} khách hàng
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= customersData.pagination.total_pages}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Thêm khách hàng mới</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Họ"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Công ty</label>
                <Input
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Tên công ty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Địa chỉ"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateCustomer}
              disabled={createCustomerMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createCustomerMutation.isPending ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Chỉnh sửa khách hàng</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Họ"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Điện thoại</label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Công ty</label>
                <Input
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Tên công ty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Địa chỉ"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateCustomer}
              disabled={updateCustomerMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateCustomerMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCustomer && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Xác nhận xóa</h3>
          </ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc chắn muốn xóa khách hàng <strong>{selectedCustomer.first_name} {selectedCustomer.last_name}</strong>?
              Hành động này không thể hoàn tác.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleDeleteCustomer}
              disabled={deleteCustomerMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCustomerMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ProtectedRoute>
  );
}