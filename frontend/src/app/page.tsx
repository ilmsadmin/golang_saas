import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
            ZPlus SaaS Platform
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Nền tảng SaaS Multi-Tenant - Giao diện mẫu
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Thiết kế giao diện cho frontend sử dụng công nghệ hiện đại
          </p>
        </div>

        {/* Interface Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Authentication Interfaces */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Authentication</dt>
                    <dd className="text-lg font-medium text-gray-900">Giao diện xác thực</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm space-y-2">
                <div>
                  <Link href="/auth/signin" className="text-blue-600 hover:text-blue-900 font-medium">
                    → Đăng nhập hệ thống
                  </Link>
                </div>
                <div className="text-gray-500">
                  • Đăng nhập đa dạng loại người dùng
                </div>
                <div className="text-gray-500">
                  • Xác thực & Phân quyền
                </div>
              </div>
            </div>
          </div>

          {/* System Admin Interfaces */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">System Admin</dt>
                    <dd className="text-lg font-medium text-gray-900">Quản trị hệ thống</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm space-y-2">
                <div>
                  <Link href="/system" className="text-blue-600 hover:text-blue-900 font-medium">
                    → Dashboard hệ thống
                  </Link>
                </div>
                <div className="text-gray-500">
                  • Quản lý Tenant
                </div>
                <div className="text-gray-500">
                  • Quản lý Module
                </div>
                <div className="text-gray-500">
                  • Báo cáo & Thống kê
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Admin Interfaces */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tenant Admin</dt>
                    <dd className="text-lg font-medium text-gray-900">Quản trị thuê bao</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-600 font-medium">→ Dashboard tenant (Subdomain)</span>
                </div>
                <div className="text-gray-500">
                  • Quản lý Người dùng
                </div>
                <div className="text-gray-500">
                  • Quản lý Khách hàng
                </div>
                <div className="text-gray-500">
                  • Phân quyền & Báo cáo
                </div>
              </div>
            </div>
          </div>

          {/* Customer Interfaces */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Customer Portal</dt>
                    <dd className="text-lg font-medium text-gray-900">Cổng khách hàng</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm space-y-2">
                <div>
                  <Link href="/dashboard" className="text-blue-600 hover:text-blue-900 font-medium">
                    → Dashboard khách hàng
                  </Link>
                </div>
                <div className="text-gray-500">
                  • Dịch vụ & Hóa đơn
                </div>
                <div className="text-gray-500">
                  • Hỗ trợ & Cài đặt
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Công nghệ sử dụng</h3>
          <div className="flex justify-center items-center space-x-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold text-lg">TS</span>
              </div>
              <span className="text-sm">Next.js + TypeScript</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-2">
                <span className="text-cyan-600 font-bold text-lg">CSS</span>
              </div>
              <span className="text-sm">Tailwind CSS</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <span className="text-green-600 font-bold text-lg">RWD</span>
              </div>
              <span className="text-sm">Responsive Design</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>ZPlus SaaS Platform - Frontend Demo</p>
          <p className="mt-1">Thiết kế giao diện sử dụng công nghệ hiện đại cho dự án</p>
        </div>
      </div>
    </div>
  );
}
