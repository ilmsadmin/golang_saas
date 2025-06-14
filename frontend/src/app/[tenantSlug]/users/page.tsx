'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenantUsers, useCreateTenantUser, useUpdateTenantUser, useDeleteTenantUser } from '@/hooks/use-tenant';
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
import type { TenantUser, CreateUserRequest, UpdateUserRequest, Role } from '@/types';

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: number;
}

const defaultFormData: UserFormData = {
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  roleId: 0,
};

export default function TenantUsersPage() {
  const { isAuthenticated, storedUser, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);

  // Prepare filters for API
  const filters = useMemo(() => ({
    page,
    limit: 10,
    search: searchTerm,
    role: selectedRole,
    status: selectedStatus,
  }), [page, searchTerm, selectedRole, selectedStatus]);

  // Fetch data
  const { data: usersData, isLoading: usersLoading, error: usersError } = useTenantUsers(filters);
  const createUserMutation = useCreateTenantUser();
  const updateUserMutation = useUpdateTenantUser();
  const deleteUserMutation = useDeleteTenantUser();

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
    if (storedUser && !['tenant_admin', 'super_admin'].includes(storedUser.role.name)) {
      router.push('/dashboard');
    }
  }, [storedUser, router]);

  // Handle user actions
  const handleCreateUser = async () => {
    try {
      const createUserData: CreateUserRequest = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role_id: formData.roleId,
      };
      await createUserMutation.mutateAsync(createUserData);
      setShowCreateModal(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const updateData: UpdateUserRequest = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role_id: formData.roleId,
      };
      await updateUserMutation.mutateAsync({ id: selectedUser.id, data: updateData });
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const openEditModal = (user: TenantUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      password: '',
      roleId: user.role.id,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: TenantUser) => {
    setSelectedUser(user);
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
      active: true,
    },
    {
      name: 'Quản lý Khách hàng',
      href: `/${tenantSlug}/customers`,
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
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
    <ProtectedRoute requiredRole={['tenant_admin', 'super_admin']}>
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
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
              <p className="text-gray-600">
                Quản lý người dùng trong {tenant?.name || 'tenant'}
              </p>
            </div>

            {/* Filters and Actions */}
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <Input
                      placeholder="Tìm kiếm theo tên, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả vai trò</option>
                      <option value="tenant_admin">Admin</option>
                      <option value="tenant_manager">Manager</option>
                      <option value="tenant_staff">Staff</option>
                    </select>
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
                  <PermissionGuard resource="users" action="create">
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Thêm người dùng
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </Card>

            {/* Users Table */}
            <Card>
              <div className="overflow-hidden">
                {usersLoading ? (
                  <div className="p-8 text-center">
                    <div className="loading-spinner mx-auto"></div>
                    <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                ) : usersError ? (
                  <div className="p-8 text-center">
                    <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeadCell>Tên</TableHeadCell>
                        <TableHeadCell>Email</TableHeadCell>
                        <TableHeadCell>Vai trò</TableHeadCell>
                        <TableHeadCell>Trạng thái</TableHeadCell>
                        <TableHeadCell>Đăng nhập cuối</TableHeadCell>
                        <TableHeadCell>Thao tác</TableHeadCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.items?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className="badge badge-info">
                              {user.role.display_name || user.role.name}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`badge ${
                              user.status === 'active' ? 'badge-success' : 
                              user.status === 'suspended' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {user.status === 'active' ? 'Hoạt động' : 
                               user.status === 'suspended' ? 'Tạm ngừng' : 'Không hoạt động'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {user.last_login ? 
                              new Date(user.last_login).toLocaleDateString('vi-VN') : 
                              'Chưa đăng nhập'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <PermissionGuard resource="users" action="update">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(user)}
                                >
                                  Sửa
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard resource="users" action="delete">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal(user)}
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
              {usersData && usersData.pagination.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {((page - 1) * 10) + 1} - {Math.min(page * 10, usersData.pagination.total_items)} 
                      trong tổng số {usersData.pagination.total_items} người dùng
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
                        disabled={page >= usersData.pagination.total_pages}
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

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Thêm người dùng mới</h3>
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
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mật khẩu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Chọn vai trò</option>
                  <option value={1}>Admin</option>
                  <option value={2}>Manager</option>
                  <option value={3}>Staff</option>
                </select>
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
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createUserMutation.isPending ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Chỉnh sửa người dùng</h3>
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
                <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Manager</option>
                  <option value={3}>Staff</option>
                </select>
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
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Xác nhận xóa</h3>
          </ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
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
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ProtectedRoute>
  );
}