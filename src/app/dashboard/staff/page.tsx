'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, UserCog, Edit, Trash2, Loader2, Shield, AtSign } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@prisma/client'
import { ALL_ROLE_VALUES, roleLabel } from '@/lib/staff-roles'

interface UserRow {
  id: number
  username: string
  firstName: string
  lastName: string
  email: string | null
  role: UserRole
  isActive: boolean
  createdAt: string
}

export default function StaffDirectoryPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' })
      if (!response.ok) {
        setUsers([])
        return
      }
      const data = await response.json()
      const list = Array.isArray(data.users) ? data.users : []
      setUsers(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteTarget.id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        setDeleteTarget(null)
        await fetchUsers()
      }
    } finally {
      setDeleting(false)
    }
  }

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    const name = `${u.firstName} ${u.lastName}`.toLowerCase()
    const matchQ = name.includes(q) || u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q))
    const matchR = roleFilter === 'all' || u.role === roleFilter
    return matchQ && matchR
  })

  const getRoleColor = (role: string): BadgeProps['variant'] => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'manager':
        return 'warning'
      case 'designer':
        return 'success'
      case 'sales':
        return 'default'
      default:
        return 'outline'
    }
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === 'admin').length,
    nonAdmin: users.filter((u) => u.role !== 'admin').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="text-green-600 shrink-0" size={32} />
            {t('staffPageTitle')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{t('staffPageDescription')}</p>
        </div>
        <Button
          type="button"
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          onClick={() => router.push('/dashboard/staff/new')}
        >
          <Plus className="mr-2" size={18} />
          {t('staffNavNew')}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">{t('totalUsers')}</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">{t('active')}</p>
            <p className="text-xl font-bold text-gray-900">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">{t('admin')}</p>
            <p className="text-xl font-bold text-gray-900">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-800 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">{t('staff')}</p>
            <p className="text-xl font-bold text-gray-900">{stats.nonAdmin}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                className="pl-10"
                placeholder={t('search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                size="sm"
                variant={roleFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setRoleFilter('all')}
                className={roleFilter === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {t('filter')} — {t('staffAllRoles')}
              </Button>
              {ALL_ROLE_VALUES.map((role) => (
                <Button
                  key={role}
                  type="button"
                  size="sm"
                  variant={roleFilter === role ? 'default' : 'outline'}
                  onClick={() => setRoleFilter(role)}
                  className={`whitespace-nowrap ${roleFilter === role ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {roleLabel(role)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {t('staffDirectoryTable')} ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>{t('staffColName')}</TableHead>
                  <TableHead>{t('staffUsername')}</TableHead>
                  <TableHead>{t('staffOptionalEmail')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('staffJoined')}</TableHead>
                  <TableHead className="text-right w-[120px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} className="hover:bg-green-50/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-gray-800 inline-flex items-center gap-1">
                        <AtSign size={14} className="text-gray-400" />
                        {u.username}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{u.email ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleColor(u.role)}>
                        <Shield size={12} className="mr-1" />
                        {roleLabel(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'success' : 'outline'}>{u.isActive ? t('active') : t('staffInactive')}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t('edit')}
                          onClick={() => router.push(`/dashboard/staff/${u.id}/edit`)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          disabled={currentUser?.id === u.id}
                          onClick={() => setDeleteTarget(u)}
                          aria-label={t('delete')}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-14 text-gray-500">
              <UserCog className="mx-auto mb-3 text-gray-300" size={44} />
              {t('noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="p-6 space-y-4">
              <p className="font-medium text-gray-900">
                {t('staffDeleteQuestion')}{' '}
                <span className="font-mono text-green-800">@{deleteTarget.username}</span>?
              </p>
              <p className="text-sm text-gray-600">{t('staffDeleteWarning')}</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                  {t('cancel')}
                </Button>
                <Button type="button" variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
                  {deleting ? <Loader2 className="animate-spin" size={18} /> : t('delete')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
