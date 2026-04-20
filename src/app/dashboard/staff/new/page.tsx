'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StaffMemberForm, type StaffFormState } from '@/components/staff/StaffMemberForm'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@prisma/client'

const empty: StaffFormState = {
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'staff' as UserRole,
  isActive: true,
}

export default function StaffNewPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user } = useAuth()
  const [form, setForm] = useState<StaffFormState>(empty)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim().toLowerCase(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || null,
          password: form.password,
          role: form.role,
          isActive: form.isActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFormError(typeof data.error === 'string' ? data.error : t('error'))
        return
      }
      router.push('/dashboard/staff')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="shadow-md border-green-100 max-w-3xl">
      <CardHeader className="border-b border-gray-100 bg-green-50/50">
        <CardTitle className="text-xl text-green-900">{t('staffCreateTitle')}</CardTitle>
        <p className="text-sm text-gray-600 font-normal">{t('staffCreateSubtitle')}</p>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <StaffMemberForm
          mode="create"
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          onCancel={() => router.push('/dashboard/staff')}
          formError={formError}
          saving={saving}
          currentUserRole={user?.role ?? 'staff'}
        />
      </CardContent>
    </Card>
  )
}
