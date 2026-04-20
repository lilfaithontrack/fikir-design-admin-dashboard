'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Search,
  Filter,
  Download,
  Plus,
  Users,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  DollarSign,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiFetch } from '@/lib/api-fetch'
import FileUpload from '@/components/FileUpload'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone?: string
  // Location
  address?: string | null
  houseNumber?: string | null
  city?: string | null
  // Photos: URLs (front, back, side_left, side_right, detail…)
  photos?: string[] | null
  // Body measurements JSON
  bodyMeasurements?: Record<string, unknown> | null
  status: string
  totalOrders: number
  totalSpent: string
  createdAt: string
}

const MEASUREMENT_FIELDS = [
  { key: 'height', label: 'Height (cm)' },
  { key: 'chest', label: 'Chest / Bust (cm)' },
  { key: 'waist', label: 'Waist (cm)' },
  { key: 'hips', label: 'Hips (cm)' },
  { key: 'shoulderWidth', label: 'Shoulder Width (cm)' },
  { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
  { key: 'neckCircumference', label: 'Neck Circum. (cm)' },
  { key: 'backLength', label: 'Back Length (cm)' },
  { key: 'frontLength', label: 'Front Length (cm)' },
  { key: 'hipLength', label: 'Hip / Dress Length (cm)' },
  { key: 'armCircumference', label: 'Arm Circum. (cm)' },
  { key: 'wristCircumference', label: 'Wrist Circum. (cm)' },
]

const PHOTO_POSITIONS = ['Front', 'Back', 'Side Left', 'Side Right', 'Detail 1', 'Detail 2']

function ModalShell({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="pt-4">{children}</CardContent>
      </Card>
    </div>
  )
}

export default function CustomersPage() {
  const { t } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [saving, setSaving] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [afirst, setAfirst] = useState('')
  const [alast, setAlast] = useState('')
  const [aemail, setAemail] = useState('')
  const [aphone, setAphone] = useState('')
  const [aaddress, setAaddress] = useState('')
  const [ahouseNumber, setAhouseNumber] = useState('')
  const [acity, setAcity] = useState('')
  const [aphotos, setAphotos] = useState<string[]>(['', '', '', '', '', ''])
  const [ameasurements, setAmeasurements] = useState<Record<string, string>>({})

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [efirst, setEfirst] = useState('')
  const [elast, setElast] = useState('')
  const [eemail, setEemail] = useState('')
  const [ephone, setEphone] = useState('')
  const [eaddress, setEaddress] = useState('')
  const [ehouseNumber, setEhouseNumber] = useState('')
  const [ecity, setEcity] = useState('')
  const [ephotos, setEphotos] = useState<string[]>(['', '', '', '', '', ''])
  const [emeasurements, setEmeasurements] = useState<Record<string, string>>({})
  const [estatus, setEstatus] = useState('active')

  const [viewOpen, setViewOpen] = useState(false)
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [viewTab, setViewTab] = useState<'info' | 'photos' | 'measurements'>('info')

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await apiFetch('/api/customers?limit=500')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load')
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const submitAdd = async () => {
    setSaving(true)
    try {
      const res = await apiFetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: afirst.trim(),
          lastName: alast.trim(),
          email: aemail.trim() || null,
          phone: aphone.trim() || null,
          address: aaddress.trim() || null,
          houseNumber: ahouseNumber.trim() || null,
          city: acity.trim() || null,
          photos: aphotos.filter(Boolean),
          bodyMeasurements: Object.keys(ameasurements).length > 0 ? ameasurements : undefined,
          status: 'active',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setAddOpen(false)
      setAfirst('')
      setAlast('')
      setAemail('')
      setAphone('')
      setAaddress('')
      setAhouseNumber('')
      setAcity('')
      setAphotos(['', '', '', '', '', ''])
      setAmeasurements({})
      await fetchCustomers()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (c: Customer) => {
    setEditId(c.id)
    setEfirst(c.firstName)
    setElast(c.lastName)
    setEemail(c.email ?? '')
    setEphone(c.phone || '')
    setEaddress(c.address ?? '')
    setEhouseNumber(c.houseNumber ?? '')
    setEcity(c.city ?? '')
    const ph = Array.isArray(c.photos) ? [...c.photos] : []
    while (ph.length < 6) ph.push('')
    setEphotos(ph)
    const bm: Record<string, string> = {}
    if (c.bodyMeasurements) Object.entries(c.bodyMeasurements).forEach(([k, v]) => { bm[k] = String(v) })
    setEmeasurements(bm)
    setEstatus(c.status)
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (editId == null) return
    setSaving(true)
    try {
      const res = await apiFetch(`/api/customers/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: efirst.trim(),
          lastName: elast.trim(),
          email: eemail.trim() || null,
          phone: ephone.trim() || null,
          address: eaddress.trim() || null,
          houseNumber: ehouseNumber.trim() || null,
          city: ecity.trim() || null,
          photos: ephotos.filter(Boolean),
          bodyMeasurements: Object.keys(emeasurements).length > 0 ? emeasurements : undefined,
          status: estatus,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setEditOpen(false)
      await fetchCustomers()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const removeCustomer = async (id: number) => {
    if (!confirm('Delete this customer? Orders may block deletion.')) return
    try {
      const res = await apiFetch(`/api/customers/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      await fetchCustomers()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const openView = async (id: number) => {
    try {
      const res = await apiFetch(`/api/customers/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Load failed')
      setViewCustomer(data)
      setViewTab('info')
      setViewOpen(true)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to load')
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (customer.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.status === 'active').length,
    totalSpent: customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ModalShell open={addOpen} title={t('addCustomer')} onClose={() => setAddOpen(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('firstName')} *</label>
              <Input value={afirst} onChange={(e) => setAfirst(e.target.value)} className="mt-1" placeholder="First name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Name *</label>
              <Input value={alast} onChange={(e) => setAlast(e.target.value)} className="mt-1" placeholder="Last name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('email')}</label>
              <Input type="email" value={aemail} onChange={(e) => setAemail(e.target.value)} className="mt-1" placeholder="optional" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('phone')}</label>
              <Input value={aphone} onChange={(e) => setAphone(e.target.value)} className="mt-1" placeholder="+251..." />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase pt-1">Location</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Address / Sub-City</label>
              <Input value={aaddress} onChange={(e) => setAaddress(e.target.value)} className="mt-1" placeholder="e.g. Bole, Addis Ababa" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">House No.</label>
              <Input value={ahouseNumber} onChange={(e) => setAhouseNumber(e.target.value)} className="mt-1" placeholder="e.g. 42B" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">City</label>
            <Input value={acity} onChange={(e) => setAcity(e.target.value)} className="mt-1" placeholder="e.g. Addis Ababa" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase pt-1">Customer Photos</p>
          <FileUpload
            value={aphotos}
            onChange={setAphotos}
            maxFiles={6}
            folder="customers"
          />
          <p className="text-xs font-bold text-gray-500 uppercase pt-1">Body Measurements (cm) — for design</p>
          <div className="grid grid-cols-2 gap-2">
            {MEASUREMENT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-500">{f.label}</label>
                <Input type="number" step="0.5" value={ameasurements[f.key] ?? ''} onChange={(e) => setAmeasurements({ ...ameasurements, [f.key]: e.target.value })} className="mt-0.5 text-xs" placeholder="cm" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" type="button" disabled={saving} onClick={submitAdd}>
              {saving ? '…' : 'Save Customer'}
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={editOpen} title="Edit Customer" onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('firstName')}</label>
              <Input value={efirst} onChange={(e) => setEfirst(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <Input value={elast} onChange={(e) => setElast(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('email')}</label>
              <Input type="email" value={eemail} onChange={(e) => setEemail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('phone')}</label>
              <Input value={ephone} onChange={(e) => setEphone(e.target.value)} className="mt-1" />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase pt-1">Location</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <Input value={eaddress} onChange={(e) => setEaddress(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">House No.</label>
              <Input value={ehouseNumber} onChange={(e) => setEhouseNumber(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">City</label>
            <Input value={ecity} onChange={(e) => setEcity(e.target.value)} className="mt-1" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase pt-1">Customer Photos</p>
          <FileUpload
            value={ephotos}
            onChange={setEphotos}
            maxFiles={6}
            folder="customers"
          />
          <p className="text-xs font-bold text-gray-500 uppercase pt-1">Body Measurements (cm)</p>
          <div className="grid grid-cols-2 gap-2">
            {MEASUREMENT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-500">{f.label}</label>
                <Input type="number" step="0.5" value={emeasurements[f.key] ?? ''} onChange={(e) => setEmeasurements({ ...emeasurements, [f.key]: e.target.value })} className="mt-0.5 text-xs" placeholder="cm" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('status')}</label>
            <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize" value={estatus} onChange={(e) => setEstatus(e.target.value)}>
              {['active', 'inactive'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" type="button" disabled={saving} onClick={submitEdit}>
              {saving ? '…' : 'Update'}
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={viewOpen} title="Customer Profile" onClose={() => setViewOpen(false)}>
        {viewCustomer && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {viewCustomer.firstName[0]}{viewCustomer.lastName[0]}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{viewCustomer.firstName} {viewCustomer.lastName}</p>
                <p className="text-sm text-gray-500">{viewCustomer.email ?? '—'} · {viewCustomer.phone ?? '—'}</p>
                {(viewCustomer.address || viewCustomer.city) && (
                  <p className="text-xs text-gray-400">{[viewCustomer.address, viewCustomer.houseNumber, viewCustomer.city].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 border-b">
              {(['info', 'photos', 'measurements'] as const).map((tab) => (
                <button key={tab} onClick={() => setViewTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold border-b-2 capitalize ${viewTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500'}`}>
                  {tab}
                </button>
              ))}
            </div>
            {viewTab === 'info' && (
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded p-2"><p className="text-xs text-gray-400">Status</p><p className="font-semibold capitalize">{viewCustomer.status}</p></div>
                  <div className="bg-gray-50 rounded p-2"><p className="text-xs text-gray-400">Total Orders</p><p className="font-semibold">{viewCustomer.totalOrders}</p></div>
                  <div className="bg-gray-50 rounded p-2"><p className="text-xs text-gray-400">Total Spent</p><p className="font-semibold">ETB {Number(viewCustomer.totalSpent).toLocaleString()}</p></div>
                  <div className="bg-gray-50 rounded p-2"><p className="text-xs text-gray-400">Member Since</p><p className="font-semibold">{new Date(viewCustomer.createdAt).toLocaleDateString()}</p></div>
                </div>
              </div>
            )}
            {viewTab === 'photos' && (
              <div>
                {Array.isArray(viewCustomer.photos) && viewCustomer.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(viewCustomer.photos as string[]).map((url, i) => (
                      <div key={i} className="relative">
                        <p className="text-xs text-gray-400 mb-1">{PHOTO_POSITIONS[i] ?? `Photo ${i+1}`}</p>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={`pos-${i}`} className="w-full h-28 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 py-4 text-center">No photos uploaded yet.</p>}
              </div>
            )}
            {viewTab === 'measurements' && (
              <div>
                {viewCustomer.bodyMeasurements && Object.keys(viewCustomer.bodyMeasurements).length > 0 ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {MEASUREMENT_FIELDS.filter((f) => viewCustomer.bodyMeasurements![f.key] != null).map((f) => (
                      <div key={f.key} className="flex justify-between bg-gray-50 rounded px-2 py-1.5">
                        <span className="text-xs text-gray-500">{f.label.split('(')[0].trim()}</span>
                        <span className="text-xs font-bold text-green-700">{String(viewCustomer.bodyMeasurements![f.key])} cm</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 py-4 text-center">No measurements recorded yet.</p>}
              </div>
            )}
          </div>
        )}
      </ModalShell>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <Users className="mr-3 text-green-600" size={28} />
            {t('navCustomers')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your customer database</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <Download className="mr-2" size={18} />
            {t('export')}
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" type="button" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2" size={18} />
            {t('addCustomer')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('totalCustomers')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('active')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <UserPlus className="text-yellow-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-white shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('totalSpent')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">
                  ETB {stats.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <DollarSign className="text-red-500" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder={t('search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'active', 'inactive'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={`whitespace-nowrap capitalize ${statusFilter === status ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {t('navCustomers')} ({filteredCustomers.length})
            </span>
            <Button variant="ghost" size="sm">
              <Filter className="mr-2" size={16} />
              {t('filter')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('firstName')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('phone')}</TableHead>
                  <TableHead>{t('totalOrders')}</TableHead>
                  <TableHead>{t('totalSpent')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">
                            {customer.firstName[0]}
                            {customer.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail size={14} className="text-gray-400 flex-shrink-0" />
                        <span>{customer.email ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.phone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400 flex-shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-gray-900">{customer.totalOrders}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        ETB {Number(customer.totalSpent).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={(customer.status === 'active' ? 'success' : 'outline') as BadgeProps['variant']}
                        className="capitalize"
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="icon" type="button" onClick={() => openView(customer.id)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(customer)}>
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-600"
                          type="button"
                          onClick={() => removeCustomer(customer.id)}
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

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">{t('noData')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
