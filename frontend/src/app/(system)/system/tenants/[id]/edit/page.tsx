'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTenant, useUpdateTenant } from '@/lib/graphql/hooks';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UpdateTenantInput, TenantStatus } from '@/types/graphql';
import Link from 'next/link';

export default function EditTenant() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  
  const { data: tenant, loading: tenantLoading, error: tenantError } = useTenant(tenantId);
  const { updateTenant, loading: updateLoading } = useUpdateTenant();
  
  const [formData, setFormData] = useState<UpdateTenantInput>({
    name: '',
    domain: '',
    status: TenantStatus.ACTIVE,
    settings: {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load tenant data when available
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || '',
        domain: tenant.domain || '',
        status: tenant.status || TenantStatus.ACTIVE,
        settings: tenant.settings || {}
      });
    }
  }, [tenant]);

  const handleInputChange = (field: keyof UpdateTenantInput, value: string | TenantStatus) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên tenant là bắt buộc';
    }

    if (formData.domain && !/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/.test(formData.domain)) {
      newErrors.domain = 'Domain không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await updateTenant(tenantId, {
        ...formData,
        domain: formData.domain || undefined, // Send undefined if empty
      });

      if (result.success) {
        router.push('/system/tenants');
      } else {
        setErrors({ submit: result.error || 'Có lỗi xảy ra khi cập nhật tenant' });
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      setErrors({ submit: 'Có lỗi xảy ra khi cập nhật tenant' });
    }
  };

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Không tìm thấy tenant</h1>
          <p className="text-gray-600 mb-4">Tenant không tồn tại hoặc bạn không có quyền truy cập.</p>
          <Link href="/system/tenants">
            <Button>Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={['system_admin', 'super_admin']} requiredPermission={{ resource: 'tenants', action: 'update' }}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <Link href="/system/tenants" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    ← Quay lại danh sách
                  </Link>
                  <h1 className="mt-2 text-2xl font-bold text-gray-900">Chỉnh sửa Tenant</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Cập nhật thông tin tenant: {tenant.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-600">{errors.submit}</div>
                </div>
              )}

              {/* Tenant Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin Tenant</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên Tenant *
                      </label>
                      <Input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Nhập tên tenant"
                        error={errors.name}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug (chỉ đọc)
                      </label>
                      <Input
                        type="text"
                        value={tenant.slug}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Slug không thể thay đổi sau khi tạo
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subdomain (chỉ đọc)
                      </label>
                      <Input
                        type="text"
                        value={tenant.subdomain}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Subdomain không thể thay đổi sau khi tạo
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Domain
                      </label>
                      <Input
                        type="text"
                        value={formData.domain || ''}
                        onChange={(e) => handleInputChange('domain', e.target.value)}
                        placeholder="example.com (tùy chọn)"
                        error={errors.domain}
                      />
                      {errors.domain && (
                        <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trạng thái
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value as TenantStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={TenantStatus.ACTIVE}>Hoạt động</option>
                        <option value={TenantStatus.PENDING}>Chờ duyệt</option>
                        <option value={TenantStatus.SUSPENDED}>Tạm ngừng</option>
                        <option value={TenantStatus.INACTIVE}>Không hoạt động</option>
                      </select>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Current Plan Info (Read-only) */}
              {tenant.subscription && (
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin Plan hiện tại</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Plan hiện tại
                        </label>
                        <Input
                          type="text"
                          value={tenant.subscription.plan?.name || 'Không xác định'}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giá
                        </label>
                        <Input
                          type="text"
                          value={`$${tenant.subscription.plan?.price || 0}/tháng`}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Để thay đổi plan, vui lòng liên hệ quản trị viên hệ thống
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <Link href="/system/tenants">
                  <Button type="button" variant="outline">
                    Hủy
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  loading={updateLoading}
                  disabled={updateLoading}
                >
                  Cập nhật Tenant
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}