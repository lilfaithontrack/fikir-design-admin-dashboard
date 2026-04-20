'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, UserPlus, Shield } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function StaffSidebarNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const items = [
    {
      href: '/dashboard/staff',
      labelKey: 'staffNavList' as const,
      icon: Users,
      active: pathname === '/dashboard/staff',
    },
    {
      href: '/dashboard/staff/new',
      labelKey: 'staffNavNew' as const,
      icon: UserPlus,
      active: pathname === '/dashboard/staff/new',
    },
  ]

  return (
    <aside className="w-full lg:w-56 shrink-0 rounded-xl border border-green-200 bg-gradient-to-b from-green-900 to-green-950 text-green-50 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-green-700/80">
        <div className="flex items-center gap-2 text-white font-semibold text-sm uppercase tracking-wide">
          <Shield className="text-yellow-400 shrink-0" size={18} />
          {t('staffSectionTitle')}
        </div>
        <p className="text-xs text-green-200/90 mt-1 leading-snug">{t('staffSubtitle')}</p>
      </div>
      <nav className="p-2 space-y-1">
        {items.map(({ href, labelKey, icon: Icon, active }) => {
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-green-900 shadow-md'
                  : 'text-green-100 hover:bg-green-800/80 hover:text-white'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
