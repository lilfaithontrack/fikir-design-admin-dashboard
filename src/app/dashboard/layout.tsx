'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { canManageStaff } from '@/lib/staff-roles'
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
  ChevronRight,
  Bell,
  Search,
  Loader2,
  Wallet,
  FileText,
  GitBranch,
  UserCheck,
  Scissors,
} from 'lucide-react'

const baseNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'navDashboard' },
  { href: '/dashboard/products', icon: Package, label: 'navProducts' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'navOrders' },
  { href: '/dashboard/customers', icon: Users, label: 'navCustomers' },
  { href: '/dashboard/inventory', icon: Box, label: 'navInventory' },
  { href: '/dashboard/categories', icon: FolderTree, label: 'navCategories' },
  { href: '/dashboard/staff', icon: UserCog, label: 'navStaff' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'navWallet' },
  { href: '/dashboard/sales-reports', icon: FileText, label: 'navSalesReports' },
  { href: '/dashboard/workflow', icon: GitBranch, label: 'navWorkflow' },
  { href: '/dashboard/orders/assign', icon: UserCheck, label: 'navAssign' },
  { href: '/dashboard/raw-materials', icon: Scissors, label: 'navRawMaterials' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'navReports' },
] as const

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const { user, loading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  const navItems = baseNavItems.filter((item) => {
    if (item.href === '/dashboard/staff') {
      return user ? canManageStaff(user.role) : false
    }
    return true
  })

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en')
  }

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const initials =
    user && (user.firstName || user.lastName)
      ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
      : '?'

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-green-700 text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-green-700 to-green-900 text-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-green-600">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-green-900 font-bold text-sm">FD</span>
            Fikir Design
          </h1>
          <p className="text-xs text-green-300 mt-1 ml-10">{t('dashboard')}</p>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/dashboard/staff'
                  ? pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/staff/')
                  : item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-white text-green-700 font-semibold shadow-md'
                        : 'text-green-100 hover:bg-green-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{t(item.label as import('@/lib/i18n').TranslationKey)}</span>
                    {isActive && <ChevronRight className="ml-auto" size={14} />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-green-600 space-y-1">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-green-100 hover:bg-green-800 transition-colors text-sm"
          >
            <Globe size={18} />
            <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-red-300 hover:bg-red-900/50 transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="lg:hidden w-10" />
          <div className="hidden lg:flex items-center gap-3 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t('search') + '...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Globe size={20} className="text-green-600" />
            </button>
            <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{displayName || '—'}</p>
                <p className="text-xs text-gray-500">{user ? `@${user.username}` : ''}</p>
                {user && (
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{user.role.replace(/_/g, ' ')}</p>
                )}
              </div>
              <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AuthProvider>
  )
}
