'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Warehouse, 
  BarChart3,
  Settings,
  LogOut,
  X
} from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', labelAm: 'ዳሽቦርድ', href: '/dashboard' },
  { icon: Package, label: 'Products', labelAm: 'ምርቶች', href: '/dashboard/products' },
  { icon: ShoppingCart, label: 'Orders', labelAm: 'ትዕዛዞች', href: '/dashboard/orders' },
  { icon: Users, label: 'Customers', labelAm: 'ደንበኞች', href: '/dashboard/customers' },
  { icon: Warehouse, label: 'Inventory', labelAm: 'ክምችት', href: '/dashboard/inventory' },
  { icon: BarChart3, label: 'Analytics', labelAm: 'ትንተና', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', labelAm: 'ቅንብሮች', href: '/dashboard/settings' },
]

interface SidebarProps {
  language?: 'en' | 'am'
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ language = 'en', isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xl font-bold text-white">FD</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Fikir Design</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg 
                  transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-white shadow-sm scale-[1.02]'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary hover:scale-[1.01]'
                  }
                `}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className={`font-medium ${language === 'am' ? 'font-amharic' : ''}`}>
                  {language === 'am' ? item.labelAm : item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 lg:p-4 border-t border-gray-200">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-accent hover:bg-accent-50 transition-all duration-200 hover:scale-[1.01]"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`font-medium ${language === 'am' ? 'font-amharic' : ''}`}>
              {language === 'am' ? 'ውጣ' : 'Logout'}
            </span>
          </Link>
        </div>
      </aside>
    </>
  )
}
