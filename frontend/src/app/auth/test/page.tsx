'use client';

import React from 'react';
import { AuthStatus } from '@/components/auth/AuthStatus';
import Link from 'next/link';

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Authentication Test</h1>
          <p className="text-gray-600 mt-2">Test GraphQL authentication functionality</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auth Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Current Authentication Status</h2>
            <AuthStatus />
          </div>

          {/* Quick Links */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <div className="space-y-3">
              <Link 
                href="/auth/signin" 
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
              >
                Register
              </Link>
              <Link 
                href="/system" 
                className="block w-full text-center bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
              >
                System Dashboard
              </Link>
              <Link 
                href="/demo-tenant" 
                className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
              >
                Tenant Dashboard (Demo)
              </Link>
              <Link 
                href="/dashboard" 
                className="block w-full text-center bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 transition-colors"
              >
                Customer Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Demo Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium text-blue-900">System Admin</h3>
              <p className="text-sm text-blue-700 mt-1">
                <strong>Email:</strong> admin@system.com<br />
                <strong>Password:</strong> password
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-medium text-purple-900">Tenant Admin</h3>
              <p className="text-sm text-purple-700 mt-1">
                <strong>Email:</strong> admin@tenant.com<br />
                <strong>Password:</strong> password
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <h3 className="font-medium text-orange-900">Customer</h3>
              <p className="text-sm text-orange-700 mt-1">
                <strong>Email:</strong> customer@example.com<br />
                <strong>Password:</strong> password
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
