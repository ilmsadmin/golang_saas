'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTenantSettings, useUpdateTenantSettings, useTenantModules, useUpdateTenantModules } from '@/hooks/use-tenant';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/providers/tenant-provider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validateTenantSlug } from '@/utils/slug-validation';
import type { TenantSettings, Module } from '@/types';

interface GeneralSettings {
  name: string;
  description: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

interface FeatureSettings {
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  twoFactorAuth: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function TenantSettingsPage() {
  const { isAuthenticated, storedUser, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const { tenant, isLoading: tenantLoading } = useTenant();
  
  // State for different settings sections
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'notifications' | 'modules'>('general');
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    name: '',
    description: '',
    logoUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
  });
  const [featureSettings, setFeatureSettings] = useState<FeatureSettings>({
    allowRegistration: true,
    requireEmailVerification: true,
    twoFactorAuth: false,
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
  });
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());

  // Fetch data
  const { data: settingsData, isLoading: settingsLoading, error: settingsError } = useTenantSettings();
  const { data: modulesData, isLoading: modulesLoading } = useTenantModules();
  const updateSettingsMutation = useUpdateTenantSettings();
  const updateModulesMutation = useUpdateTenantModules();

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

  // Load settings data when available
  React.useEffect(() => {
    if (settingsData) {
      if (settingsData.general) {
        setGeneralSettings({
          name: settingsData.general.name || tenant?.name || '',
          description: settingsData.general.description || '',
          logoUrl: settingsData.general.logo_url || '',
          primaryColor: settingsData.general.primary_color || '#3B82F6',
          secondaryColor: settingsData.general.secondary_color || '#10B981',
        });
      }
      if (settingsData.features) {
        setFeatureSettings({
          allowRegistration: settingsData.features.allow_registration ?? true,
          requireEmailVerification: settingsData.features.require_email_verification ?? true,
          twoFactorAuth: settingsData.features.two_factor_auth ?? false,
        });
      }
      if (settingsData.notifications) {
        setNotificationSettings({
          emailNotifications: settingsData.notifications.email_notifications ?? true,
          smsNotifications: settingsData.notifications.sms_notifications ?? false,
        });
      }
    }
  }, [settingsData, tenant?.name]);

  // Load modules data when available
  React.useEffect(() => {
    if (modulesData) {
      const enabled = new Set(
        modulesData.filter((module: Module & { isEnabled?: boolean }) => module.isEnabled)
          .map((module: Module) => module.id)
      );
      setEnabledModules(enabled);
    }
  }, [modulesData]);

  // Handle settings updates
  const handleGeneralSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        general: {
          name: generalSettings.name,
          description: generalSettings.description,
          logo_url: generalSettings.logoUrl,
          primary_color: generalSettings.primaryColor,
          secondary_color: generalSettings.secondaryColor,
        }
      });
    } catch (error) {
      console.error('Failed to update general settings:', error);
    }
  };

  const handleFeaturesSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        features: {
          allow_registration: featureSettings.allowRegistration,
          require_email_verification: featureSettings.requireEmailVerification,
          two_factor_auth: featureSettings.twoFactorAuth,
        }
      });
    } catch (error) {
      console.error('Failed to update feature settings:', error);
    }
  };

  const handleNotificationsSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        notifications: {
          email_notifications: notificationSettings.emailNotifications,
          sms_notifications: notificationSettings.smsNotifications,
        }
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setEnabledModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleModulesSave = async () => {
    try {
      await updateModulesMutation.mutateAsync({
        enabledModules: Array.from(enabledModules)
      });
    } catch (error) {
      console.error('Failed to update modules:', error);
    }
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
      active: true,
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

  const tabs = [
    { id: 'general' as const, name: 'Tổng quan', icon: '⚙️' },
    { id: 'features' as const, name: 'Tính năng', icon: '🛠️' },
    { id: 'notifications' as const, name: 'Thông báo', icon: '🔔' },
    { id: 'modules' as const, name: 'Modules', icon: '🧩' },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">Cài đặt Tenant</h1>
              <p className="text-gray-600">
                Quản lý cài đặt và cấu hình cho {tenant?.name || 'tenant'}
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'general' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt tổng quan</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tên tenant</label>
                      <Input
                        value={generalSettings.name}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, name: e.target.value })}
                        placeholder="Tên tenant"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                      <Input
                        value={generalSettings.description}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, description: e.target.value })}
                        placeholder="Mô tả về tenant"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL Logo</label>
                      <Input
                        value={generalSettings.logoUrl}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, logoUrl: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Màu chính</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            value={generalSettings.primaryColor}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, primaryColor: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={generalSettings.primaryColor}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, primaryColor: e.target.value })}
                            placeholder="#3B82F6"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Màu phụ</label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="color"
                            value={generalSettings.secondaryColor}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, secondaryColor: e.target.value })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={generalSettings.secondaryColor}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, secondaryColor: e.target.value })}
                            placeholder="#10B981"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <PermissionGuard resource="settings" action="update">
                      <Button
                        onClick={handleGeneralSave}
                        disabled={updateSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updateSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'features' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt tính năng</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Cho phép đăng ký</h4>
                        <p className="text-sm text-gray-500">Cho phép người dùng tự đăng ký tài khoản</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureSettings.allowRegistration}
                          onChange={(e) => setFeatureSettings({ ...featureSettings, allowRegistration: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Xác thực email</h4>
                        <p className="text-sm text-gray-500">Yêu cầu xác thực email khi đăng ký</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureSettings.requireEmailVerification}
                          onChange={(e) => setFeatureSettings({ ...featureSettings, requireEmailVerification: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Xác thực hai yếu tố</h4>
                        <p className="text-sm text-gray-500">Kích hoạt xác thực hai yếu tố cho tài khoản</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureSettings.twoFactorAuth}
                          onChange={(e) => setFeatureSettings({ ...featureSettings, twoFactorAuth: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <PermissionGuard resource="settings" action="update">
                      <Button
                        onClick={handleFeaturesSave}
                        disabled={updateSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updateSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt thông báo</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Thông báo email</h4>
                        <p className="text-sm text-gray-500">Gửi thông báo qua email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Thông báo SMS</h4>
                        <p className="text-sm text-gray-500">Gửi thông báo qua tin nhắn SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <PermissionGuard resource="settings" action="update">
                      <Button
                        onClick={handleNotificationsSave}
                        disabled={updateSettingsMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updateSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'modules' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quản lý Modules</h3>
                  {modulesLoading ? (
                    <div className="text-center py-8">
                      <div className="loading-spinner mx-auto"></div>
                      <p className="mt-2 text-gray-600">Đang tải modules...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modulesData?.map((module: Module) => (
                        <div key={module.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="text-sm font-medium text-gray-900">{module.name}</h4>
                              <span className="ml-2 badge badge-info">v{module.version}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                            {module.dependencies && module.dependencies.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Phụ thuộc: {module.dependencies.join(', ')}
                              </p>
                            )}
                          </div>
                          <PermissionGuard resource="modules" action="update">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={enabledModules.has(module.id)}
                                onChange={() => handleModuleToggle(module.id)}
                                disabled={!module.is_active}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                            </label>
                          </PermissionGuard>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-6">
                    <PermissionGuard resource="modules" action="update">
                      <Button
                        onClick={handleModulesSave}
                        disabled={updateModulesMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {updateModulesMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}