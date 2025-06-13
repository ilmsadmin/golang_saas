'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignInPage() {
  const [userType, setUserType] = useState<'system' | 'tenant' | 'customer'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        userType,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng');
      } else {
        // Get the session to determine redirect path
        const session = await getSession();
        if (session?.user?.role) {
          // Redirect based on user role
          if (session.user.role === 'super_admin' || session.user.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (session.user.role === 'tenant_admin') {
            router.push('/tenant/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          // Default redirect for customers
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Đăng nhập vào tài khoản
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Chọn loại tài khoản để đăng nhập
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* User Type Selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Loại tài khoản</label>
              
              {/* System Admin */}
              <div className="relative">
                <input
                  id="user-type-system"
                  name="user-type"
                  type="radio"
                  value="system"
                  checked={userType === 'system'}
                  onChange={(e) => setUserType(e.target.value as 'system')}
                  className="sr-only peer"
                />
                <label
                  htmlFor="user-type-system"
                  className="flex items-center justify-between w-full p-4 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <div className="font-medium">System Admin</div>
                      <div className="text-sm">Quản trị viên hệ thống</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Tenant Admin */}
              <div className="relative">
                <input
                  id="user-type-tenant"
                  name="user-type"
                  type="radio"
                  value="tenant"
                  checked={userType === 'tenant'}
                  onChange={(e) => setUserType(e.target.value as 'tenant')}
                  className="sr-only peer"
                />
                <label
                  htmlFor="user-type-tenant"
                  className="flex items-center justify-between w-full p-4 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <div className="font-medium">Tenant Admin</div>
                      <div className="text-sm">Quản trị viên thuê bao</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Customer */}
              <div className="relative">
                <input
                  id="user-type-customer"
                  name="user-type"
                  type="radio"
                  value="customer"
                  checked={userType === 'customer'}
                  onChange={(e) => setUserType(e.target.value as 'customer')}
                  className="sr-only peer"
                />
                <label
                  htmlFor="user-type-customer"
                  className="flex items-center justify-between w-full p-4 text-gray-500 bg-white border border-gray-200 rounded-lg cursor-pointer peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-gray-600 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="font-medium">Customer</div>
                      <div className="text-sm">Khách hàng</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Email */}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email của bạn"
            />

            {/* Password */}
            <Input
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />

            {/* Demo Login Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Login Information:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>System Admin:</strong> admin@system.com / password</p>
                <p><strong>Tenant Admin:</strong> admin@tenant.com / password</p>
                <p><strong>Customer:</strong> customer@example.com / password</p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!email || !password}
            >
              Đăng nhập
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-blue-600 hover:text-blue-500">
                ← Quay về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}