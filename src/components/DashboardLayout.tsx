'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Box, 
  FolderTree, 
  UserCog, 
  BarChart3,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'navDashboard' },
    { href: '/dashboard/products', icon: Package, label: 'navProducts' },
    { href: '/dashboard/orders', icon: ShoppingCart, label: 'navOrders' },
    { href: '/dashboard/customers', icon: Users, label: 'navCustomers' },
    { href: '/dashboard/inventory', icon: Box, label: 'navInventory' },
    { href: '/dashboard/categories', icon: FolderTree, label: 'navCategories' },
    { href: '/dashboard/users', icon: UserCog, label: 'navUsers' },
    { href: '/dashboard/reports', icon: BarChart3, label: 'navReports' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-green-700 to-green-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-green-600">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-yellow-400">✦</span>
            Fikir Design
          </h1>
          <p className="text-sm text-green-200 mt-1">{t('dashboard')}</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-green-700 font-semibold shadow-lg'
                        : 'text-green-100 hover:bg-green-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{t(item.label as any)}</span>
                    {isActive && <ChevronRight className="ml-auto" size={16} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-green-600">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-green-100 hover:bg-green-800 transition-colors"
          >
            <Globe size={20} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-300 hover:bg-red-900 transition-colors mt-2">
            <LogOut size={20} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-green-700 text-white p-4 pl-16">
          <h1 className="text-xl font-bold">Fikir Design</h1>
        </div>
        
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
