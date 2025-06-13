'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTenant, usePlans } from '@/lib/graphql/hooks';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateTenantInput, Plan } from '@/types/graphql';
import Link from 'next/link';

export default function CreateTenant() {
  const router = useRouter();
  const { createTenant, loading } = useCreateTenant();
  const { data: plansData, loading: plansLoading } = usePlans();
  
  const [formData, setFormData] = useState<CreateTenantInput>({
    name: '',
    slug: '',
    subdomain: '',
    domain: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
    planId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateTenantInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug and subdomain from name
    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        slug: slug,
        subdomain: slug
      }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên tenant là bắt buộc';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug là bắt buộc';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain là bắt buộc';
    } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain chỉ được chứa chữ thường, số và dấu gạch ngang';
    }

    if (formData.domain && !/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/.test(formData.domain)) {
      newErrors.domain = 'Domain không hợp lệ';
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Email admin là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Email không hợp lệ';
    }

    if (!formData.adminPassword.trim()) {
      newErrors.adminPassword = 'Mật khẩu admin là bắt buộc';
    } else if (formData.adminPassword.length < 8) {
      newErrors.adminPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (!formData.adminFirstName.trim()) {
      newErrors.adminFirstName = 'Tên admin là bắt buộc';
    }

    if (!formData.adminLastName.trim()) {
      newErrors.adminLastName = 'Họ admin là bắt buộc';
    }

    if (!formData.planId) {
      newErrors.planId = 'Vui lòng chọn plan';
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
      const result = await createTenant({
        ...formData,
        domain: formData.domain || undefined, // Send undefined if empty
      });

      if (result.success) {
        router.push('/system/tenants');
      } else {
        setErrors({ submit: result.error || 'Có lỗi xảy ra khi tạo tenant' });
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      setErrors({ submit: 'Có lỗi xảy ra khi tạo tenant' });
    }
  };

  return (
    <ProtectedRoute requiredRole={['system_admin', 'super_admin']} requiredPermission={{ resource: 'tenants', action: 'create' }}>
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
                  <h1 className="mt-2 text-2xl font-bold text-gray-900">Tạo Tenant mới</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Tạo một tenant mới với admin account và plan
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
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="VD: Công ty ABC"
                        error={errors.name}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug *
                      </label>
                      <Input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="cong-ty-abc"
                        error={errors.slug}
                      />
                      {errors.slug && (
                        <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Chỉ chữ thường, số và dấu gạch ngang. Sẽ được tự động tạo từ tên.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subdomain *
                      </label>
                      <div className="flex">
                        <Input
                          type="text"
                          value={formData.subdomain}
                          onChange={(e) => handleInputChange('subdomain', e.target.value)}
                          placeholder="cong-ty-abc"
                          error={errors.subdomain}
                          className="rounded-r-none"
                        />
                        <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                          .zplus.vn
                        </span>
                      </div>
                      {errors.subdomain && (
                        <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Domain tùy chỉnh
                      </label>
                      <Input
                        type="text"
                        value={formData.domain}
                        onChange={(e) => handleInputChange('domain', e.target.value)}
                        placeholder="congtyadb.com"
                        error={errors.domain}
                      />
                      {errors.domain && (
                        <p className="mt-1 text-sm text-red-600">{errors.domain}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Tùy chọn. Nếu không có, sẽ sử dụng subdomain.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Admin Account */}
              <Card>
                <CardHeader>
                  <CardTitle>Tài khoản Admin</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ *
                      </label>
                      <Input
                        type="text"
                        value={formData.adminFirstName}
                        onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                        placeholder="Nguyễn"
                        error={errors.adminFirstName}
                      />
                      {errors.adminFirstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.adminFirstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên *
                      </label>
                      <Input
                        type="text"
                        value={formData.adminLastName}
                        onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                        placeholder="Văn A"
                        error={errors.adminLastName}
                      />
                      {errors.adminLastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.adminLastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                        placeholder="admin@congtyadb.com"
                        error={errors.adminEmail}
                      />
                      {errors.adminEmail && (
                        <p className="mt-1 text-sm text-red-600">{errors.adminEmail}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu *
                      </label>
                      <Input
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                        placeholder="Ít nhất 8 ký tự"
                        error={errors.adminPassword}
                      />
                      {errors.adminPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.adminPassword}</p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Plan Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Chọn Plan</CardTitle>
                </CardHeader>
                <CardBody>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan *
                    </label>
                    {plansLoading ? (
                      <div className="border border-gray-300 rounded-md p-3 bg-gray-50 text-gray-500">
                        Đang tải plans...
                      </div>
                    ) : (
                      <select
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                        value={formData.planId}
                        onChange={(e) => handleInputChange('planId', e.target.value)}
                      >
                        <option value="">Chọn plan</option>
                        {plansData?.map((plan: Plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - ${plan.price}/tháng (Max {plan.maxUsers} users)
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.planId && (
                      <p className="mt-1 text-sm text-red-600">{errors.planId}</p>
                    )}
                  </div>
                  
                  {/* Plan preview */}
                  {formData.planId && plansData && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      {(() => {
                        const selectedPlan = plansData.find((p: Plan) => p.id === formData.planId);
                        if (!selectedPlan) return null;
                        
                        return (
                          <div>
                            <h4 className="font-medium text-blue-900">{selectedPlan.name}</h4>
                            <p className="text-sm text-blue-700 mt-1">{selectedPlan.description}</p>
                            <div className="mt-2 text-sm text-blue-600">
                              <p>Giá: ${selectedPlan.price}/tháng</p>
                              <p>Tối đa: {selectedPlan.maxUsers} users</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4">
                <Link href="/system/tenants">
                  <Button variant="outline" type="button">
                    Hủy
                  </Button>
                </Link>
                <Button type="submit" loading={loading}>
                  Tạo Tenant
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}