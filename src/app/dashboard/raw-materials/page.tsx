'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Package, RefreshCw, Loader2, Plus, TrendingUp, TrendingDown,
  AlertTriangle, Scissors, ArrowDownCircle, ArrowUpCircle, X,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
interface RawMaterial {
  id: number; name: string; clothType: string; colorOrPattern: string | null
  supplier: string | null; quantityInStock: string; lowStockAlert: string
  costPerMeter: string; widthCm: string | null; notes: string | null
  isActive: boolean; isLowStock: boolean
  _count: { fabricCuts: number; stockMovements: number }
}

interface StockMovement {
  id: number; type: string; direction: string
  quantityChange: string; quantityBefore: string; quantityAfter: string
  unitCost: string | null; totalCost: string | null
  supplier: string | null; invoiceNumber: string | null; note: string | null
  createdAt: string
  rawMaterial: { id: number; name: string; clothType: string; colorOrPattern: string | null }
  createdBy: { firstName: string; lastName: string } | null
}

interface MovementSummary { totalIncome: number; totalExpense: number; net: number }

const CLOTH_TYPES = [
  { value: 'habesha_cotton', label: 'Habesha Cotton', color: 'bg-green-100 text-green-700' },
  { value: 'chiffon', label: 'Chiffon', color: 'bg-pink-100 text-pink-700' },
  { value: 'silk', label: 'Silk', color: 'bg-purple-100 text-purple-700' },
  { value: 'satin', label: 'Satin', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'linen', label: 'Linen', color: 'bg-amber-100 text-amber-700' },
  { value: 'polyester', label: 'Polyester', color: 'bg-blue-100 text-blue-700' },
  { value: 'velvet', label: 'Velvet', color: 'bg-violet-100 text-violet-700' },
  { value: 'organza', label: 'Organza', color: 'bg-rose-100 text-rose-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-600' },
]
const MOVEMENT_TYPES = ['purchase', 'fabric_cut', 'return', 'adjustment', 'waste']

const clothLabel = (v: string) => CLOTH_TYPES.find((c) => c.value === v)?.label ?? v
const clothColor = (v: string) => CLOTH_TYPES.find((c) => c.value === v)?.color ?? 'bg-gray-100 text-gray-600'

const defaultMat = { name: '', clothType: 'habesha_cotton', colorOrPattern: '', supplier: '', quantityInStock: '0', lowStockAlert: '5', costPerMeter: '0', widthCm: '', notes: '' }
const defaultMove = { rawMaterialId: '', type: 'purchase', direction: 'in', quantityChange: '', unitCost: '', supplier: '', invoiceNumber: '', note: '' }

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [summary, setSummary] = useState<MovementSummary>({ totalIncome: 0, totalExpense: 0, net: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'stock' | 'ledger'>('stock')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [editMat, setEditMat] = useState<RawMaterial | null>(null)
  const [matForm, setMatForm] = useState(defaultMat)
  const [moveForm, setMoveForm] = useState(defaultMove)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [showLowOnly, setShowLowOnly] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [matRes, moveRes] = await Promise.all([
        fetch('/api/raw-materials', { credentials: 'include' }),
        fetch('/api/stock-movements?limit=100', { credentials: 'include' }),
      ])
      if (matRes.ok) {
        const d = await matRes.json()
        setMaterials(d.materials ?? [])
      }
      if (moveRes.ok) {
        const d = await moveRes.json()
        setMovements(d.movements ?? [])
        setSummary(d.summary ?? { totalIncome: 0, totalExpense: 0, net: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const handleSaveMaterial = async () => {
    setSaving(true)
    try {
      const url = '/api/raw-materials'
      const method = editMat ? 'PATCH' : 'POST'
      const body = editMat ? { id: editMat.id, ...matForm } : matForm
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowAddModal(false); setEditMat(null); setMatForm(defaultMat)
        await fetchAll()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleMovement = async () => {
    if (!moveForm.rawMaterialId || !moveForm.quantityChange) return
    setSaving(true)
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveForm),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? 'Failed'); return }
      setShowMoveModal(false); setMoveForm(defaultMove)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (m: RawMaterial) => {
    setEditMat(m)
    setMatForm({
      name: m.name, clothType: m.clothType, colorOrPattern: m.colorOrPattern ?? '',
      supplier: m.supplier ?? '', quantityInStock: m.quantityInStock, lowStockAlert: m.lowStockAlert,
      costPerMeter: m.costPerMeter, widthCm: m.widthCm ?? '', notes: m.notes ?? '',
    })
    setShowAddModal(true)
  }

  const filteredMats = materials
    .filter((m) => filterType === 'all' || m.clothType === filterType)
    .filter((m) => !showLowOnly || m.isLowStock)

  const totalStock = materials.reduce((s, m) => s + Number(m.quantityInStock), 0)
  const totalValue = materials.reduce((s, m) => s + Number(m.quantityInStock) * Number(m.costPerMeter), 0)
  const lowCount = materials.filter((m) => m.isLowStock).length

  if (loading) return <div className="flex items-center justify-center min-h-[320px]"><Loader2 className="animate-spin text-green-600" size={48} /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-green-600" size={28} /> Raw Materials & Stock
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage cloth inventory, cuts, and financial ledger</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchAll()}><RefreshCw size={15} className="mr-1" />Refresh</Button>
          <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50"
            onClick={() => { setMoveForm(defaultMove); setShowMoveModal(true) }}>
            <ArrowDownCircle size={15} className="mr-1" />Stock Movement
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => { setEditMat(null); setMatForm(defaultMat); setShowAddModal(true) }}>
            <Plus size={15} className="mr-1" />Add Material
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Materials</p>
            <p className="text-2xl font-black text-green-700">{materials.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Total Stock</p>
            <p className="text-2xl font-black text-blue-700">{totalStock.toFixed(1)}m</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Stock Value</p>
            <p className="text-2xl font-black text-amber-700">ETB {totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${lowCount > 0 ? 'border-l-red-500' : 'border-l-gray-300'}`}>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1">
              {lowCount > 0 && <AlertTriangle size={11} className="text-red-500" />}Low Stock
            </p>
            <p className={`text-2xl font-black ${lowCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{lowCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1"><TrendingUp size={11} className="text-green-500" />Total Purchased (In)</p>
            <p className="text-xl font-black text-green-700">ETB {summary.totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-1"><TrendingDown size={11} className="text-red-500" />Total Used / Out</p>
            <p className="text-xl font-black text-red-700">ETB {summary.totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${summary.net >= 0 ? 'border-l-blue-400' : 'border-l-orange-400'}`}>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">Net (Purchase − Cut Value)</p>
            <p className={`text-xl font-black ${summary.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>ETB {summary.net.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[['stock', 'Stock List'], ['ledger', 'Movement Ledger']] .map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as 'stock' | 'ledger')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── STOCK TAB ── */}
      {tab === 'stock' && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <CardTitle>Cloth Inventory</CardTitle>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="flex items-center gap-1 text-xs font-semibold text-red-600 cursor-pointer">
                  <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} />
                  Low stock only
                </label>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setFilterType('all')}
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${filterType === 'all' ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600'}`}>
                    All
                  </button>
                  {CLOTH_TYPES.map((ct) => (
                    <button key={ct.value} onClick={() => setFilterType(ct.value)}
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${filterType === ct.value ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600'}`}>
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMats.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No materials found. Add some to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Color / Pattern</TableHead>
                      <TableHead>Supplier</TableHead><TableHead>Width</TableHead>
                      <TableHead>In Stock</TableHead><TableHead>Low Alert</TableHead>
                      <TableHead>Cost/m</TableHead><TableHead>Stock Value</TableHead>
                      <TableHead>Cuts</TableHead><TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMats.map((m) => (
                      <TableRow key={m.id} className={`hover:bg-green-50/20 ${m.isLowStock ? 'bg-red-50/30' : ''}`}>
                        <TableCell className="font-semibold text-gray-900">{m.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${clothColor(m.clothType)}`}>
                            {clothLabel(m.clothType)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{m.colorOrPattern ?? '—'}</TableCell>
                        <TableCell className="text-sm text-gray-500">{m.supplier ?? '—'}</TableCell>
                        <TableCell className="text-sm">{m.widthCm ? `${m.widthCm} cm` : '—'}</TableCell>
                        <TableCell>
                          <span className={`font-bold text-sm ${m.isLowStock ? 'text-red-600' : 'text-green-700'}`}>
                            {Number(m.quantityInStock).toFixed(1)}m
                          </span>
                          {m.isLowStock && <AlertTriangle size={13} className="inline ml-1 text-red-500" />}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{Number(m.lowStockAlert).toFixed(1)}m</TableCell>
                        <TableCell className="text-sm">ETB {Number(m.costPerMeter).toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-semibold text-amber-700">
                          ETB {(Number(m.quantityInStock) * Number(m.costPerMeter)).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{m._count.fabricCuts}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => openEdit(m)} className="text-xs">Edit</Button>
                            <Button size="sm" variant="outline"
                              className="text-xs border-amber-300 text-amber-700"
                              onClick={() => { setMoveForm({ ...defaultMove, rawMaterialId: String(m.id) }); setShowMoveModal(true) }}>
                              <Scissors size={11} className="mr-1" />Cut
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── LEDGER TAB ── */}
      {tab === 'ledger' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp size={18} className="text-green-600" />Stock Movement Ledger</CardTitle></CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No movements recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead><TableHead>Material</TableHead>
                      <TableHead>Type</TableHead><TableHead>Direction</TableHead>
                      <TableHead>Qty Change</TableHead><TableHead>Before</TableHead>
                      <TableHead>After</TableHead><TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead><TableHead>Note</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mv) => (
                      <TableRow key={mv.id} className={`hover:bg-gray-50/40 ${mv.direction === 'in' ? 'bg-green-50/10' : 'bg-red-50/10'}`}>
                        <TableCell className="text-xs text-gray-400 whitespace-nowrap">{new Date(mv.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-semibold">{mv.rawMaterial.name}
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${clothColor(mv.rawMaterial.clothType)}`}>
                            {clothLabel(mv.rawMaterial.clothType)}
                          </span>
                        </TableCell>
                        <TableCell><span className="text-xs capitalize px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{mv.type.replace(/_/g, ' ')}</span></TableCell>
                        <TableCell>
                          {mv.direction === 'in'
                            ? <span className="flex items-center gap-1 text-green-600 text-xs font-bold"><ArrowUpCircle size={13} />IN</span>
                            : <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><ArrowDownCircle size={13} />OUT</span>
                          }
                        </TableCell>
                        <TableCell className={`font-bold text-sm ${mv.direction === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                          {mv.direction === 'in' ? '+' : '-'}{Number(mv.quantityChange).toFixed(2)}m
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{Number(mv.quantityBefore).toFixed(2)}m</TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">{Number(mv.quantityAfter).toFixed(2)}m</TableCell>
                        <TableCell className="text-xs">{mv.unitCost ? `ETB ${Number(mv.unitCost).toLocaleString()}` : '—'}</TableCell>
                        <TableCell className={`text-sm font-semibold ${mv.direction === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                          {mv.totalCost ? `ETB ${Number(mv.totalCost).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 max-w-[120px] truncate">{mv.note ?? mv.rawMaterial.colorOrPattern ?? '—'}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {mv.createdBy ? `${mv.createdBy.firstName} ${mv.createdBy.lastName}` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── ADD / EDIT MATERIAL MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editMat ? 'Edit' : 'Add'} Raw Material</h2>
              <button onClick={() => { setShowAddModal(false); setEditMat(null) }}><X size={20} className="text-gray-400 hover:text-gray-700" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Material Name *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Habesha Cotton White" value={matForm.name} onChange={(e) => setMatForm({ ...matForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cloth Type *</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={matForm.clothType} onChange={(e) => setMatForm({ ...matForm, clothType: e.target.value })}>
                    {CLOTH_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Color / Pattern</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. White with gold border" value={matForm.colorOrPattern} onChange={(e) => setMatForm({ ...matForm, colorOrPattern: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Supplier name" value={matForm.supplier} onChange={(e) => setMatForm({ ...matForm, supplier: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fabric Width (cm)</label>
                  <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 140" value={matForm.widthCm} onChange={(e) => setMatForm({ ...matForm, widthCm: e.target.value })} />
                </div>
                {!editMat && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Initial Stock (meters)</label>
                    <input type="number" step="0.5" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" value={matForm.quantityInStock} onChange={(e) => setMatForm({ ...matForm, quantityInStock: e.target.value })} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Low Stock Alert (m)</label>
                  <input type="number" step="0.5" className="w-full border rounded-lg px-3 py-2 text-sm" value={matForm.lowStockAlert} onChange={(e) => setMatForm({ ...matForm, lowStockAlert: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cost per Meter (ETB)</label>
                  <input type="number" step="1" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" value={matForm.costPerMeter} onChange={(e) => setMatForm({ ...matForm, costPerMeter: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={matForm.notes} onChange={(e) => setMatForm({ ...matForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); setEditMat(null) }}>Cancel</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => void handleSaveMaterial()} disabled={saving}>
                  {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
                  {editMat ? 'Save Changes' : 'Add Material'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STOCK MOVEMENT MODAL ── */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><ArrowDownCircle size={18} className="text-amber-600" />Record Stock Movement</h2>
              <button onClick={() => setShowMoveModal(false)}><X size={20} className="text-gray-400 hover:text-gray-700" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Material *</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={moveForm.rawMaterialId} onChange={(e) => setMoveForm({ ...moveForm, rawMaterialId: e.target.value })}>
                  <option value="">— Select material —</option>
                  {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({Number(m.quantityInStock).toFixed(1)}m in stock)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Movement Type</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={moveForm.type}
                    onChange={(e) => {
                      const t = e.target.value
                      const dir = ['purchase', 'return'].includes(t) ? 'in' : 'out'
                      setMoveForm({ ...moveForm, type: t, direction: dir })
                    }}>
                    {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Direction</label>
                  <div className="flex gap-2">
                    {['in', 'out'].map((d) => (
                      <button key={d} onClick={() => setMoveForm({ ...moveForm, direction: d })}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold capitalize ${moveForm.direction === d ? (d === 'in' ? 'border-green-600 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-gray-200 text-gray-500'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (meters) *</label>
                  <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 20" value={moveForm.quantityChange} onChange={(e) => setMoveForm({ ...moveForm, quantityChange: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Cost (ETB)</label>
                  <input type="number" step="1" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="per meter" value={moveForm.unitCost} onChange={(e) => setMoveForm({ ...moveForm, unitCost: e.target.value })} />
                </div>
              </div>
              {moveForm.type === 'purchase' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" value={moveForm.supplier} onChange={(e) => setMoveForm({ ...moveForm, supplier: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice #</label>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" value={moveForm.invoiceNumber} onChange={(e) => setMoveForm({ ...moveForm, invoiceNumber: e.target.value })} />
                  </div>
                </div>
              )}
              {moveForm.quantityChange && moveForm.rawMaterialId && (
                <div className={`rounded-lg p-3 text-sm font-semibold ${moveForm.direction === 'in' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  Total Cost: ETB {(Number(moveForm.quantityChange) * Number(moveForm.unitCost || materials.find((m) => m.id === Number(moveForm.rawMaterialId))?.costPerMeter || 0)).toLocaleString()}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Note</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Optional note..." value={moveForm.note} onChange={(e) => setMoveForm({ ...moveForm, note: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowMoveModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => void handleMovement()} disabled={saving}>
                  {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : null}Record Movement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
