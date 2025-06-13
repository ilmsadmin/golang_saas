import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current?: boolean;
}

interface SidebarProps {
  title: string;
  items: SidebarItem[];
  userInfo: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogout?: () => void;
}

export function Sidebar({ title, items, userInfo, onLogout }: SidebarProps) {
  const pathname = usePathname();
  
  return (
    <div className="w-64 bg-white shadow-sm h-full flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span className="ml-2 text-lg font-semibold text-gray-900 truncate">{title}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'sidebar-link',
                isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            {userInfo.avatar ? (
              <Image src={userInfo.avatar} alt={userInfo.name} className="w-full h-full rounded-full" width={40} height={40} />
            ) : (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{userInfo.name}</p>
            <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}