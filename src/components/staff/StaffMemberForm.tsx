'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { STAFF_ROLE_OPTIONS } from '@/lib/staff-roles'

export type StaffFormState = {
  username: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
}

type Props = {
  mode: 'create' | 'edit'
  form: StaffFormState
  setForm: Dispatch<SetStateAction<StaffFormState>>
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  formError: string | null
  saving: boolean
  currentUserRole: UserRole
}

export function StaffMemberForm({
  mode,
  form,
  setForm,
  onSubmit,
  onCancel,
  formError,
  saving,
  currentUserRole,
}: Props) {
  const { t } = useLanguage()
  const editing = mode === 'edit'

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-xl">
      {formError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-800">{t('staffUsername')}</label>
        <Input
          className="mt-1.5 font-mono"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
          minLength={2}
          autoComplete="off"
          disabled={editing}
        />
        {editing && <p className="text-xs text-gray-500 mt-1">{t('staffUsernameLocked')}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-800">{t('firstName')}</label>
          <Input
            className="mt-1.5"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-800">{t('lastName')}</label>
          <Input
            className="mt-1.5"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-800">{t('staffOptionalEmail')}</label>
        <Input
          className="mt-1.5"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="name@company.com"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-800">{t('role')}</label>
        <select
          className="mt-1.5 w-full border border-gray-300 rounded-md h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
        >
          {STAFF_ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value === 'admin' && currentUserRole !== 'admin'}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">{STAFF_ROLE_OPTIONS.find((o) => o.value === form.role)?.description}</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="staff-active"
          type="checkbox"
          className="rounded border-gray-300"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
        />
        <label htmlFor="staff-active" className="text-sm text-gray-700">
          {t('staffActiveLogin')}
        </label>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-800">
          {editing ? t('staffPasswordOptional') : t('password')}
        </label>
        <Input
          className="mt-1.5"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required={!editing}
          minLength={editing ? 0 : 6}
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : editing ? t('save') : t('addUser')}
        </Button>
      </div>
    </form>
  )
}
