'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Filter, Eye, Printer, ShoppingCart, Clock, CheckCircle, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiFetch } from '@/lib/api-fetch'
import { ExportDropdown } from '@/components/ExportDropdown'
import { exportToExcel, exportToPDF, ColumnHelpers } from '@/lib/export-utils'

function ModalShell({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}><X size={16} /></Button>
        </CardHeader>
        <CardContent className="pt-4">{children}</CardContent>
      </Card>
    </div>
  )
}

interface Order {
  id: number
  orderNumber: string
  status: string
  total: string
  createdAt: string
  customer?: {
    firstName: string
    lastName: string
  }
  items?: any[]
}

interface Customer { id: number; firstName: string; lastName: string; phone?: string }
interface Product { id: number; name: string; sku: string; price: string }
interface OrderItem { productId: number; productName: string; quantity: number; price: number }

export default function OrdersPage() {
  const { t } = useLanguage()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Add Order dialog state
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selCustomerId, setSelCustomerId] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selProductId, setSelProductId] = useState('')
  const [selQty, setSelQty] = useState('1')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderShipping, setOrderShipping] = useState('0')
  const [orderDiscount, setOrderDiscount] = useState('0')
  const [orderStatus, setOrderStatus] = useState('pending')

  // View dialog state
  const [viewOpen, setViewOpen] = useState(false)
  const [viewOrder, setViewOrder] = useState<any>(null)

  const statuses = ['all', 'pending', 'design_in_progress', 'sewing_in_progress', 'delivered', 'cancelled']

  const fetchOrders = useCallback(async () => {
    try {
      const response = await apiFetch('/api/orders')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load orders')
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const openAdd = async () => {
    setSelCustomerId(''); setOrderItems([]); setSelProductId(''); setSelQty('1')
    setOrderNotes(''); setOrderShipping('0'); setOrderDiscount('0'); setOrderStatus('pending')
    const [cRes, pRes] = await Promise.all([
      apiFetch('/api/customers?limit=500'),
      apiFetch('/api/products?limit=500'),
    ])
    const cData = await cRes.json()
    const pData = await pRes.json()
    setCustomers(cData.customers || [])
    setProducts(pData.products || [])
    setAddOpen(true)
  }

  const addItemToOrder = () => {
    if (!selProductId) return
    const product = products.find(p => String(p.id) === selProductId)
    if (!product) return
    const qty = Math.max(1, Number(selQty) || 1)
    setOrderItems(prev => {
      const existing = prev.findIndex(i => i.productId === product.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + qty }
        return updated
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: qty, price: Number(product.price) || 0 }]
    })
    setSelProductId(''); setSelQty('1')
  }

  const removeItem = (idx: number) => setOrderItems(prev => prev.filter((_, i) => i !== idx))

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = subtotal + Number(orderShipping || 0) - Number(orderDiscount || 0)

  const submitAdd = async () => {
    if (!selCustomerId) { alert('Select a customer'); return }
    if (orderItems.length === 0) { alert('Add at least one product'); return }
    setSaving(true)
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: Number(selCustomerId),
          status: orderStatus,
          notes: orderNotes || null,
          shipping: Number(orderShipping) || 0,
          discount: Number(orderDiscount) || 0,
          items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setAddOpen(false)
      await fetchOrders()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create order')
    } finally {
      setSaving(false)
    }
  }

  const openView = async (id: number) => {
    try {
      const res = await apiFetch(`/api/orders/${id}`)
      const data = await res.json()
      setViewOrder(data)
      setViewOpen(true)
    } catch (e) { console.error(e) }
  }

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const res = await apiFetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      await fetchOrders()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to update status')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (order.customer?.firstName + ' ' + order.customer?.lastName).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'design_in_progress' || o.status === 'sewing_in_progress').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
  }

  const orderStatusValues = [
    'pending',
    'assigned',
    'design_in_progress',
    'design_completed',
    'sewing_in_progress',
    'sewing_completed',
    'quality_check',
    'quality_passed',
    'ready_for_delivery',
    'delivery_in_progress',
    'delivered',
    'cancelled',
    'on_hold',
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    )
  }

  return (
      <div className="space-y-6">

        {/* ── Add Order Dialog ── */}
        <ModalShell open={addOpen} title="New Order" onClose={() => setAddOpen(false)}>
          <div className="space-y-4">
            {/* Customer */}
            <div>
              <label className="text-sm font-medium text-gray-700">Customer *</label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selCustomerId} onChange={e => setSelCustomerId(e.target.value)}>
                <option value="">— Select customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.phone ? ` · ${c.phone}` : ''}</option>
                ))}
              </select>
            </div>

            {/* Product picker */}
            <div>
              <label className="text-sm font-medium text-gray-700">Add Products</label>
              <div className="flex gap-2 mt-1">
                <select className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selProductId} onChange={e => setSelProductId(e.target.value)}>
                  <option value="">— Select product —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ETB {Number(p.price).toLocaleString()}</option>
                  ))}
                </select>
                <Input type="number" min="1" value={selQty} onChange={e => setSelQty(e.target.value)}
                  className="w-20" placeholder="Qty" />
                <Button type="button" onClick={addItemToOrder} className="bg-green-600 hover:bg-green-700 shrink-0">
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Items list */}
            {orderItems.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                      <th className="text-center px-3 py-2 font-medium text-gray-600">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Price</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="px-3 py-2 text-center">
                          <Input type="number" min="1" value={item.quantity}
                            onChange={e => setOrderItems(prev => prev.map((i, ii) => ii === idx ? { ...i, quantity: Math.max(1, Number(e.target.value)) } : i))}
                            className="w-16 text-center h-7 text-xs" />
                        </td>
                        <td className="px-3 py-2 text-right">{item.price.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold">{(item.price * item.quantity).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Fees & totals */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Shipping (ETB)</label>
                <Input type="number" min="0" value={orderShipping} onChange={e => setOrderShipping(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Discount (ETB)</label>
                <Input type="number" min="0" value={orderDiscount} onChange={e => setOrderDiscount(e.target.value)} className="mt-1" />
              </div>
            </div>

            {orderItems.length > 0 && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal: <b>{subtotal.toLocaleString()} ETB</b></span>
                <span className="text-green-700 font-bold text-base">Total: {total.toLocaleString()} ETB</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
                  value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                  {['pending','assigned','design_in_progress','sewing_in_progress','quality_check','ready_for_delivery'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <Input value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="mt-1" placeholder="Optional notes" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" disabled={saving} onClick={submitAdd}>
                {saving ? '…' : 'Create Order'}
              </Button>
            </div>
          </div>
        </ModalShell>

        {/* ── View Order Dialog ── */}
        <ModalShell open={viewOpen} title={`Order ${viewOrder?.orderNumber || ''}`} onClose={() => setViewOpen(false)}>
          {viewOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3"><p className="text-xs text-gray-400">Customer</p><p className="font-semibold">{viewOrder.customer?.firstName} {viewOrder.customer?.lastName}</p></div>
                <div className="bg-gray-50 rounded p-3"><p className="text-xs text-gray-400">Status</p><p className="font-semibold capitalize">{viewOrder.status?.replace(/_/g,' ')}</p></div>
                <div className="bg-gray-50 rounded p-3"><p className="text-xs text-gray-400">Total</p><p className="font-semibold text-green-700">ETB {Number(viewOrder.total).toLocaleString()}</p></div>
                <div className="bg-gray-50 rounded p-3"><p className="text-xs text-gray-400">Date</p><p className="font-semibold">{new Date(viewOrder.createdAt).toLocaleDateString()}</p></div>
              </div>
              {viewOrder.items?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Items</p>
                  <div className="rounded border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Product</th>
                        <th className="text-center px-3 py-2 font-medium text-gray-600">Qty</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
                      </tr></thead>
                      <tbody>
                        {viewOrder.items.map((item: any) => (
                          <tr key={item.id} className="border-t border-gray-100">
                            <td className="px-3 py-2">{item.product?.name || '—'}</td>
                            <td className="px-3 py-2 text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-right font-semibold">{Number(item.total).toLocaleString()} ETB</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {viewOrder.notes && <p className="text-gray-600 bg-yellow-50 border border-yellow-100 rounded p-2"><span className="font-semibold">Notes: </span>{viewOrder.notes}</p>}
            </div>
          )}
        </ModalShell>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="mr-3 text-green-600" size={32} />
              {t('navOrders')}
            </h1>
            <p className="text-gray-500 mt-1">Track and manage customer orders</p>
          </div>
          <div className="flex gap-3">
            <ExportDropdown
              label={t('export')}
              onExportExcel={() => {
                exportToExcel({
                  title: 'Orders Report',
                  subtitle: `Generated on ${new Date().toLocaleDateString('en-ET')}`,
                  filename: `fikir-orders-${new Date().toISOString().split('T')[0]}`,
                  companyName: 'Fikir Design',
                  companyInfo: ['Addis Ababa, Ethiopia', 'fikirdesign.et'],
                  columns: [
                    ColumnHelpers.text('Order #', 'orderNumber', 15),
                    ColumnHelpers.text('Customer', 'customerName', 20),
                    ColumnHelpers.status('Status', 'status', 12),
                    ColumnHelpers.number('Items', 'itemCount', 10),
                    ColumnHelpers.currency('Total', 'total', 15),
                    ColumnHelpers.date('Date', 'createdAt', 15),
                  ],
                  data: filteredOrders.map(o => ({
                    ...o,
                    customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Guest',
                    itemCount: o.items?.length || 0
                  }))
                })
              }}
              onExportPDF={() => {
                exportToPDF({
                  title: 'Orders Report',
                  subtitle: `Total: ${filteredOrders.length} orders`,
                  filename: `fikir-orders-${new Date().toISOString().split('T')[0]}`,
                  companyName: 'Fikir Design',
                  companyInfo: ['Addis Ababa, Ethiopia', 'fikirdesign.et'],
                  columns: [
                    ColumnHelpers.text('Order #', 'orderNumber', 20),
                    ColumnHelpers.text('Customer', 'customerName', 25),
                    ColumnHelpers.status('Status', 'status', 15),
                    ColumnHelpers.currency('Total', 'total', 18),
                    ColumnHelpers.date('Date', 'createdAt', 15),
                  ],
                  data: filteredOrders.map(o => ({
                    ...o,
                    customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'Guest'
                  }))
                })
              }}
            />
            <Button className="bg-green-600 hover:bg-green-700" onClick={openAdd}>
              <Plus className="mr-2" size={16} />{t('addOrder')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('totalOrders')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-600 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('pending')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="text-yellow-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-700 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="text-green-700" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('delivered')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.delivered}</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-600 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('revenue')}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ETB {stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <svg className="text-yellow-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder={t('search') + '...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="whitespace-nowrap"
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('navOrders')} ({filteredOrders.length})</span>
              <Button variant="ghost" size="sm">
                <Filter className="mr-2" size={16} />
                {t('filter')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderNumber')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>{t('total')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('orderDate')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono font-semibold text-green-600">{order.orderNumber}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-600">{order.items?.length || 0}</span>
                        </div>
                        <span className="text-sm text-gray-600">items</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        ETB {Number(order.total).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <select
                        className="h-9 max-w-[200px] rounded-md border border-input bg-background px-2 text-xs capitalize"
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        {orderStatusValues.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="icon" title="View Details" onClick={() => openView(order.id)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Print Invoice">
                          <Printer size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">{t('noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
