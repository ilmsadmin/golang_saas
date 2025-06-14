'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenantRoles, useCreateTenantRole, useUpdateTenantRole, useDeleteTenantRole, useTenantPermissions } from '@/hooks/use-tenant';
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
import type { Role, Permission } from '@/types';

interface RoleFormData {
  name: string;
  displayName: string;
  description: string;
  permissionIds: number[];
}

const defaultFormData: RoleFormData = {
  name: '',
  displayName: '',
  description: '',
  permissionIds: [],
};

export default function TenantRolesPage() {
  const { isAuthenticated, storedUser, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(defaultFormData);

  // Prepare filters for API
  const filters = useMemo(() => ({
    page,
    limit: 10,
    search: searchTerm,
  }), [page, searchTerm]);

  // Fetch data
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useTenantRoles(filters);
  const { data: permissionsData, isLoading: permissionsLoading } = useTenantPermissions();
  const createRoleMutation = useCreateTenantRole();
  const updateRoleMutation = useUpdateTenantRole();
  const deleteRoleMutation = useDeleteTenantRole();

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

  // Handle role actions
  const handleCreateRole = async () => {
    try {
      await createRoleMutation.mutateAsync(formData);
      setShowCreateModal(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      await updateRoleMutation.mutateAsync({ id: selectedRole.id, data: formData });
      setShowEditModal(false);
      setSelectedRole(null);
      setFormData(defaultFormData);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    
    try {
      await deleteRoleMutation.mutateAsync(selectedRole.id);
      setShowDeleteModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.display_name,
      description: '', // Add description if available in role data
      permissionIds: [], // Will need to map permission names to IDs from permissionsData
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const openPermissionsModal = (role: Role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const handlePermissionToggle = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId]
    }));
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
    },
    {
      name: 'Phân quyền',
      href: `/${tenantSlug}/roles`,
      icon: (
        <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      active: true,
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
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Phân quyền</h1>
              <p className="text-gray-600">
                Quản lý vai trò và quyền hạn trong {tenant?.name || 'tenant'}
              </p>
            </div>

            {/* Filters and Actions */}
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <Input
                      placeholder="Tìm kiếm theo tên vai trò..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <PermissionGuard resource="roles" action="create">
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Thêm vai trò
                    </Button>
                  </PermissionGuard>
                </div>
              </div>
            </Card>

            {/* Roles Table */}
            <Card>
              <div className="overflow-hidden">
                {rolesLoading ? (
                  <div className="p-8 text-center">
                    <div className="loading-spinner mx-auto"></div>
                    <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                ) : rolesError ? (
                  <div className="p-8 text-center">
                    <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeadCell>Tên vai trò</TableHeadCell>
                        <TableHeadCell>Tên hiển thị</TableHeadCell>
                        <TableHeadCell>Số người dùng</TableHeadCell>
                        <TableHeadCell>Số quyền</TableHeadCell>
                        <TableHeadCell>Mặc định</TableHeadCell>
                        <TableHeadCell>Ngày tạo</TableHeadCell>
                        <TableHeadCell>Thao tác</TableHeadCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rolesData?.items?.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {role.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{role.display_name}</TableCell>
                          <TableCell>
                            <span className="badge badge-info">
                              {role.users_count || 0} người dùng
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="badge badge-secondary">
                              {role.permissions?.length || 0} quyền
                            </span>
                          </TableCell>
                          <TableCell>
                            {role.is_default ? (
                              <span className="badge badge-success">Có</span>
                            ) : (
                              <span className="badge badge-outline">Không</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(role.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPermissionsModal(role)}
                              >
                                Quyền
                              </Button>
                              <PermissionGuard resource="roles" action="update">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(role)}
                                >
                                  Sửa
                                </Button>
                              </PermissionGuard>
                              <PermissionGuard resource="roles" action="delete">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal(role)}
                                  className="text-red-600 hover:text-red-700"
                                  disabled={role.is_default}
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
              {rolesData && rolesData.pagination.total_pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Hiển thị {((page - 1) * 10) + 1} - {Math.min(page * 10, rolesData.pagination.total_items)} 
                      trong tổng số {rolesData.pagination.total_items} vai trò
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
                        disabled={page >= rolesData.pagination.total_pages}
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

      {/* Create Role Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Thêm vai trò mới</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên vai trò</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tên vai trò (ví dụ: manager)"
                />
                <p className="text-xs text-gray-500 mt-1">Tên không dấu, viết thường, dùng dấu gạch dưới</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên hiển thị</label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Tên hiển thị (ví dụ: Quản lý)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả vai trò"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                {permissionsLoading ? (
                  <div className="text-center py-4">Đang tải quyền...</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {permissionsData?.map((permission: Permission) => (
                      <label key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          {permission.name} ({permission.resource}:{permission.action})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
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
              onClick={handleCreateRole}
              disabled={createRoleMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createRoleMutation.isPending ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Chỉnh sửa vai trò</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên vai trò</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tên vai trò"
                  disabled={selectedRole.is_default}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên hiển thị</label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Tên hiển thị"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả vai trò"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quyền hạn</label>
                {permissionsLoading ? (
                  <div className="text-center py-4">Đang tải quyền...</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {permissionsData?.map((permission: Permission) => (
                      <label key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissionIds.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={selectedRole.is_default}
                        />
                        <span className="text-sm">
                          {permission.name} ({permission.resource}:{permission.action})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
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
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending || selectedRole.is_default}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateRoleMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* View Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <Modal isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Quyền hạn của vai trò: {selectedRole.display_name}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-2">
              {selectedRole.permissions?.length > 0 ? (
                selectedRole.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">{permission}</span>
                    <span className="badge badge-success">Có quyền</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Vai trò này chưa có quyền nào</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setShowPermissionsModal(false)}
            >
              Đóng
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-medium">Xác nhận xóa</h3>
          </ModalHeader>
          <ModalBody>
            <p>
              Bạn có chắc chắn muốn xóa vai trò <strong>{selectedRole.display_name}</strong>?
              Hành động này không thể hoàn tác và sẽ ảnh hưởng đến tất cả người dùng có vai trò này.
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
              onClick={handleDeleteRole}
              disabled={deleteRoleMutation.isPending || selectedRole.is_default}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteRoleMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ProtectedRoute>
  );
}