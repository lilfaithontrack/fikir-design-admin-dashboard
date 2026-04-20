'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Menu
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Home', labelAm: 'ዳሽቦርድ', href: '/dashboard' },
  { icon: Package, label: 'Products', labelAm: 'ምርቶች', href: '/dashboard/products' },
  { icon: ShoppingCart, label: 'Orders', labelAm: 'ትዕዛዞች', href: '/dashboard/orders' },
  { icon: Users, label: 'Customers', labelAm: 'ደንበኞች', href: '/dashboard/customers' },
]

interface MobileNavProps {
  language?: 'en' | 'am'
  onMenuClick?: () => void
}

export function MobileNav({ language = 'en', onMenuClick }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center space-y-1
                transition-all duration-200
                ${isActive 
                  ? 'text-primary' 
                  : 'text-gray-600 active:bg-gray-100'
                }
              `}
            >
              <Icon 
                size={22} 
                className={`transition-transform ${isActive ? 'scale-110' : ''}`}
              />
              <span className={`text-xs font-medium ${language === 'am' ? 'font-amharic' : ''}`}>
                {language === 'am' ? item.labelAm : item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
              )}
            </Link>
          )
        })}
        
        {/* More Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center space-y-1 text-gray-600 active:bg-gray-100 transition-colors"
        >
          <Menu size={22} />
          <span className={`text-xs font-medium ${language === 'am' ? 'font-amharic' : ''}`}>
            {language === 'am' ? 'ተጨማሪ' : 'More'}
          </span>
        </button>
      </div>
    </nav>
  )
}
