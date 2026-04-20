'use client'

import { Bell, Search, Globe, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  language?: 'en' | 'am'
  onLanguageChange?: () => void
  onMenuClick?: () => void
}

export function Header({ 
  language = 'en', 
  onLanguageChange,
  onMenuClick
}: HeaderProps) {
  return (
    <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center space-x-3 lg:space-x-4 flex-1">
        {/* Hamburger Menu (Mobile) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu size={24} />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={language === 'am' ? 'ፈልግ...' : 'Search...'}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Language Switcher */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLanguageChange}
          className="relative"
          title="Change Language"
        >
          <Globe size={20} />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full animate-pulse"></span>
        </Button>

        {/* User Profile */}
        <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">admin@fikirdesign.com</p>
          </div>
          <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center shadow-sm">
            <User size={18} className="text-white" />
          </div>
        </div>

        {/* Mobile User Avatar */}
        <div className="sm:hidden w-9 h-9 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center shadow-sm">
          <User size={18} className="text-white" />
        </div>
      </div>
    </header>
  )
}
