'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StaffMemberForm, type StaffFormState } from '@/components/staff/StaffMemberForm'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@prisma/client'
import { Loader2 } from 'lucide-react'

const emptyForm = (): StaffFormState => ({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'staff',
  isActive: true,
})

export default function StaffEditPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN
  const { t } = useLanguage()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [form, setForm] = useState<StaffFormState>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (Number.isNaN(id)) {
      setNotFound(true)
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/users/${id}`, { credentials: 'include' })
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const u = await res.json()
      if (!u.username) {
        setNotFound(true)
        return
      }
      setForm({
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email ?? '',
        password: '',
        role: u.role as UserRole,
        isActive: u.isActive,
      })
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        role: form.role,
        isActive: form.isActive,
      }
      if (form.password.trim().length > 0) {
        body.password = form.password
      }
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    )
  }

  if (notFound) {
    return (
      <Card className="max-w-lg border-amber-200 bg-amber-50/40">
        <CardContent className="p-8 text-center text-gray-700">{t('staffNotFound')}</CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md border-green-100 max-w-3xl">
      <CardHeader className="border-b border-gray-100 bg-green-50/50">
        <CardTitle className="text-xl text-green-900">{t('staffEditTitle')}</CardTitle>
        <p className="text-sm text-gray-600 font-normal">
          @{form.username} — {t('staffEditSubtitle')}
        </p>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <StaffMemberForm
          mode="edit"
          form={form}
          setForm={setForm}
          onSubmit={onSubmit}
          onCancel={() => router.push('/dashboard/staff')}
          formError={formError}
          saving={saving}
          currentUserRole={currentUser?.role ?? 'staff'}
        />
      </CardContent>
    </Card>
  )
}
