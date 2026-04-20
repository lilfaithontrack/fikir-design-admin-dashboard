'use client'

import { StaffSidebarNav } from '@/components/staff/StaffSidebarNav'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { canManageStaff } from '@/lib/staff-roles'
import { Loader2, UserCog } from 'lucide-react'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-green-600" size={36} />
      </div>
    )
  }

  if (!user || !canManageStaff(user.role)) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <UserCog className="mx-auto text-gray-300" size={56} />
        <h1 className="text-2xl font-bold text-gray-900">{t('navStaff')}</h1>
        <p className="text-gray-600">{t('staffAccessDenied')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      <StaffSidebarNav />
      <div className="flex-1 min-w-0 w-full">{children}</div>
    </div>
  )
}
