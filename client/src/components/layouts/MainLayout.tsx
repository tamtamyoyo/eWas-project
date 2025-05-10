import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', active: location === '/dashboard' || location === '/' },
    { label: 'Social Accounts', path: '/social-accounts', active: location === '/social-accounts' },
    { label: 'New Post', path: '/posts/create', active: location === '/posts/create' },
    { label: 'Profile', path: '/profile', active: location === '/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <a className="flex items-center">
                  <span className="text-2xl font-bold text-blue-600">eWas</span>
                  <span className="text-2xl font-bold text-gray-800">.com</span>
                </a>
              </Link>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigationItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        item.active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="relative ml-3">
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.user_metadata?.full_name || user?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => logout()}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile navigation */}
      <div className="md:hidden bg-white shadow-sm">
        <div className="px-2 py-2 flex overflow-x-auto">
          {navigationItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`px-3 py-2 rounded-md text-sm font-medium flex-shrink-0 ${
                  item.active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </a>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <main className="py-6">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 