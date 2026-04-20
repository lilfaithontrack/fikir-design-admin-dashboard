'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserCheck, RefreshCw, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, Ruler, Scissors, AlertCircle } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
interface Sewer { id: number; firstName: string; lastName: string; phone: string | null }
interface Order {
  id: number; orderNumber: string; status: string; currentStage: string
  customer: { id: number; firstName: string; lastName: string; phone: string | null; photos: string[] | null; bodyMeasurements: Record<string, unknown> | null }
}
interface Assignment {
  id: number; orderId: number; sewerId: number; method: string; status: string
  fabricMetersRequired: string | null; measurements: Record<string, unknown> | null
  sewerNotes: string | null; rejectReason: string | null
  estimatedDoneAt: string | null; createdAt: string
  order: Order; sewer: Sewer; assignedBy: { firstName: string; lastName: string } | null
}

// ── Habesha/Chiffon measurement fields ────────────────────────────────
const MEASUREMENT_FIELDS = [
  { key: 'height', label: 'Height (cm)', hint: 'Full body height' },
  { key: 'chest', label: 'Chest / Bust (cm)', hint: 'Around fullest part of chest' },
  { key: 'waist', label: 'Waist (cm)', hint: 'Natural waistline' },
  { key: 'hips', label: 'Hips (cm)', hint: 'Fullest part of hips' },
  { key: 'shoulderWidth', label: 'Shoulder Width (cm)', hint: 'Across shoulders (back)' },
  { key: 'sleeveLength', label: 'Sleeve Length (cm)', hint: 'Shoulder to wrist' },
  { key: 'neckCircumference', label: 'Neck Circumference (cm)', hint: 'Around base of neck' },
  { key: 'backLength', label: 'Back Length (cm)', hint: 'Nape to waist (back)' },
  { key: 'frontLength', label: 'Front Length (cm)', hint: 'Collarbone to waist (front)' },
  { key: 'hipLength', label: 'Hip / Dress Length (cm)', hint: 'Waist to desired hem' },
  { key: 'armCircumference', label: 'Arm Circumference (cm)', hint: 'Around bicep' },
  { key: 'wristCircumference', label: 'Wrist Circumference (cm)', hint: 'Around wrist' },
]

const GARMENT_TYPES = [
  { value: 'full_dress', label: 'Full Dress' },
  { value: 'kemis', label: 'Habesha Kemis' },
  { value: 'habesha_set', label: 'Habesha Set (dress + netela)' },
  { value: 'top', label: 'Top / Blouse' },
  { value: 'skirt', label: 'Skirt' },
  { value: 'chiffon_dress', label: 'Chiffon Dress' },
  { value: 'other', label: 'Other' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
}

// ── Fabric meter preview (mirrors server formula) ──────────────────────
function previewMeters(measurements: Record<string, string>, garmentType: string): number {
  const height = Number(measurements.height ?? 165)
  const waist = Number(measurements.waist ?? 70)
  const hips = Number(measurements.hips ?? 95)
  const heightM = height / 100
  const maxC = Math.max(waist, hips) / 100
  switch (garmentType) {
    case 'full_dress': return Math.round((heightM * 0.6 * 2 + 0.5 + maxC * 0.3) * 10) / 10
    case 'top': return Math.round((heightM * 0.35 * 2 + 0.3 + maxC * 0.15) * 10) / 10
    case 'skirt': return Math.round((heightM * 0.55 * 1.5 + 0.4) * 10) / 10
    case 'kemis': return Math.round((heightM * 1.2 + maxC * 0.5 + 0.8) * 10) / 10
    case 'habesha_set': return Math.round((heightM * 1.4 + maxC * 0.6 + 1.2) * 10) / 10
    case 'chiffon_dress': return Math.round((heightM * 1.1 + maxC * 0.8 + 0.6) * 10) / 10
    default: return 4.0
  }
}

// ══════════════════════════════════════════════════════════════════════
export default function AssignOrderPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [unassignedOrders, setUnassignedOrders] = useState<Order[]>([])
  const [sewers, setSewers] = useState<Sewer[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'queue' | 'active' | 'completed'>('queue')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Assignment form state
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null)
  const [selectedSewer, setSelectedSewer] = useState('')
  const [assignMethod, setAssignMethod] = useState<'manual' | 'automatic'>('manual')
  const [garmentType, setGarmentType] = useState('full_dress')
  const [estimatedDoneAt, setEstimatedDoneAt] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [fabricPreview, setFabricPreview] = useState(0)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState('')

  // Sewer action state
  const [actioningId, setActioningId] = useState<number | null>(null)
  const [sewerNote, setSewerNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [assignRes, ordersRes, sewersRes] = await Promise.all([
        fetch('/api/orders/assign', { credentials: 'include' }),
        fetch('/api/orders?limit=100&status=pending', { credentials: 'include' }),
        fetch('/api/users?role=sewer&isActive=true', { credentials: 'include' }),
      ])
      if (assignRes.ok) {
        const d = await assignRes.json()
        setAssignments(d.assignments ?? [])
      }
      if (ordersRes.ok) {
        const d = await ordersRes.json()
        const all: Order[] = d.orders ?? []
        setUnassignedOrders(all.filter((o) => o.status === 'pending'))
      }
      if (sewersRes.ok) {
        const d = await sewersRes.json()
        setSewers(d.users ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  // Live fabric preview
  useEffect(() => {
    setFabricPreview(previewMeters(measurements, garmentType))
  }, [measurements, garmentType])

  // Pre-fill measurements from customer body measurements
  useEffect(() => {
    if (assigningOrder?.customer?.bodyMeasurements) {
      const bm = assigningOrder.customer.bodyMeasurements as Record<string, unknown>
      const filled: Record<string, string> = {}
      MEASUREMENT_FIELDS.forEach(({ key }) => {
        if (bm[key] != null) filled[key] = String(bm[key])
      })
      setMeasurements(filled)
    } else {
      setMeasurements({})
    }
  }, [assigningOrder])

  const handleAssign = async () => {
    if (!assigningOrder) return
    if (assignMethod === 'manual' && !selectedSewer) { setError('Please select a sewer'); return }
    setAssigning(true); setError('')
    try {
      const res = await fetch('/api/orders/assign', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: assigningOrder.id,
          sewerId: selectedSewer ? Number(selectedSewer) : undefined,
          method: assignMethod,
          garmentType,
          estimatedDoneAt: estimatedDoneAt || undefined,
          measurements,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Assignment failed'); return }
      setAssigningOrder(null)
      await fetchData()
    } catch {
      setError('Network error')
    } finally {
      setAssigning(false)
    }
  }

  const handleAction = async (assignmentId: number, action: string) => {
    setActioningId(assignmentId)
    try {
      await fetch('/api/orders/assign', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, action, sewerNotes: sewerNote || undefined, rejectReason: rejectReason || undefined }),
      })
      setSewerNote(''); setRejectReason('')
      await fetchData()
    } finally {
      setActioningId(null)
    }
  }

  const tabData = {
    queue: unassignedOrders,
    active: assignments.filter((a) => ['pending', 'accepted', 'in_progress'].includes(a.status)),
    completed: assignments.filter((a) => ['completed', 'rejected'].includes(a.status)),
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[320px]">
      <Loader2 className="animate-spin text-green-600" size={48} />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="text-green-600" size={28} /> Order Assignment
          </h1>
          <p className="text-sm text-gray-500 mt-1">Assign orders to sewers with body measurements and fabric calculation</p>
        </div>
        <Button variant="outline" onClick={() => void fetchData()}><RefreshCw size={15} className="mr-1" />Refresh</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([['queue', `Queue (${unassignedOrders.length})`], ['active', `Active (${tabData.active.length})`], ['completed', `Completed (${tabData.completed.length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── QUEUE TAB (unassigned orders) ── */}
      {tab === 'queue' && (
        <Card>
          <CardHeader><CardTitle>Pending Orders — Awaiting Assignment</CardTitle></CardHeader>
          <CardContent>
            {unassignedOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No pending orders to assign.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Order</TableHead><TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead><TableHead>Has Measurements</TableHead>
                      <TableHead>Photos</TableHead><TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-green-50/30">
                        <TableCell><span className="font-mono font-bold text-green-800">{order.orderNumber}</span></TableCell>
                        <TableCell>{order.customer.firstName} {order.customer.lastName}</TableCell>
                        <TableCell className="text-sm text-gray-500">{order.customer.phone ?? '—'}</TableCell>
                        <TableCell>
                          {order.customer.bodyMeasurements ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle size={13} /> Yes</span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-500 text-xs"><AlertCircle size={13} /> None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {Array.isArray(order.customer.photos) && order.customer.photos.length > 0 ? (
                            <div className="flex gap-1">
                              {(order.customer.photos as string[]).slice(0, 3).map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt="customer" className="w-8 h-8 rounded object-cover border" />
                                </a>
                              ))}
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => { setAssigningOrder(order); setSelectedSewer(''); setGarmentType('full_dress'); setEstimatedDoneAt('') }}>
                            <UserCheck size={14} className="mr-1" /> Assign
                          </Button>
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

      {/* ── ACTIVE / COMPLETED TABS ── */}
      {(tab === 'active' || tab === 'completed') && (
        <Card>
          <CardContent className="pt-4">
            {tabData[tab].length === 0 ? (
              <p className="text-center text-gray-400 py-10">Nothing here yet.</p>
            ) : (
              <div className="space-y-3">
                {(tabData[tab] as Assignment[]).map((a) => (
                  <div key={a.id} className="border rounded-xl overflow-hidden">
                    {/* Summary row */}
                    <div
                      className="flex flex-wrap items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    >
                      <span className="font-mono font-bold text-green-800">{a.order.orderNumber}</span>
                      <span className="text-sm text-gray-700">{a.order.customer.firstName} {a.order.customer.lastName}</span>
                      <span className="text-sm text-gray-500">→ {a.sewer.firstName} {a.sewer.lastName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{a.method}</span>
                      {a.fabricMetersRequired && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                          <Scissors size={12} /> {Number(a.fabricMetersRequired).toFixed(1)}m
                        </span>
                      )}
                      <span className="ml-auto">{expandedId === a.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                    </div>

                    {/* Expanded detail */}
                    {expandedId === a.id && (
                      <div className="border-t bg-gray-50/60 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Measurements */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Ruler size={13} />Body Measurements</p>
                            {a.measurements && Object.keys(a.measurements).length > 0 ? (
                              <div className="grid grid-cols-2 gap-1">
                                {MEASUREMENT_FIELDS.filter((f) => (a.measurements as Record<string, unknown>)[f.key] != null).map((f) => (
                                  <div key={f.key} className="flex justify-between bg-white rounded px-2 py-1 text-xs border">
                                    <span className="text-gray-500">{f.label.split(' (')[0]}</span>
                                    <span className="font-bold text-green-700">{String((a.measurements as Record<string, unknown>)[f.key])} cm</span>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-xs text-gray-400">No measurements recorded</p>}
                          </div>

                          {/* Customer photos */}
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Customer Photos</p>
                            {Array.isArray(a.order.customer.photos) && a.order.customer.photos.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(a.order.customer.photos as string[]).map((url, i) => (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                    <img src={url} alt={`pos-${i}`} className="w-20 h-24 object-cover rounded-lg border-2 border-green-200 hover:border-green-500 transition-colors" />
                                  </a>
                                ))}
                              </div>
                            ) : <p className="text-xs text-gray-400">No photos uploaded</p>}
                          </div>
                        </div>

                        {/* Sewer notes / reject reason */}
                        {a.rejectReason && <p className="text-xs text-red-600 bg-red-50 rounded p-2"><strong>Reject reason:</strong> {a.rejectReason}</p>}
                        {a.sewerNotes && <p className="text-xs text-gray-600 bg-white rounded p-2 border"><strong>Sewer notes:</strong> {a.sewerNotes}</p>}

                        {/* Action buttons for pending assignments */}
                        {a.status === 'pending' && (
                          <div className="flex flex-wrap gap-2 items-start">
                            <input className="border rounded px-2 py-1 text-xs flex-1 min-w-[180px]" placeholder="Sewer note (optional)" value={sewerNote} onChange={(e) => setSewerNote(e.target.value)} />
                            <Button size="sm" className="bg-green-600 text-white" onClick={() => void handleAction(a.id, 'accept')} disabled={actioningId === a.id}>
                              <CheckCircle size={13} className="mr-1" /> Accept
                            </Button>
                            <div className="flex gap-1">
                              <input className="border rounded px-2 py-1 text-xs w-40" placeholder="Reject reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                              <Button size="sm" variant="destructive" onClick={() => void handleAction(a.id, 'reject')} disabled={actioningId === a.id}>
                                <XCircle size={13} className="mr-1" /> Reject
                              </Button>
                            </div>
                          </div>
                        )}
                        {a.status === 'accepted' && (
                          <Button size="sm" className="bg-orange-500 text-white" onClick={() => void handleAction(a.id, 'start')} disabled={actioningId === a.id}>
                            Start Sewing
                          </Button>
                        )}
                        {a.status === 'in_progress' && (
                          <div className="flex gap-2 items-center">
                            <input className="border rounded px-2 py-1 text-xs flex-1" placeholder="Completion notes..." value={sewerNote} onChange={(e) => setSewerNote(e.target.value)} />
                            <Button size="sm" className="bg-green-700 text-white" onClick={() => void handleAction(a.id, 'complete')} disabled={actioningId === a.id}>
                              <CheckCircle size={13} className="mr-1" /> Mark Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── ASSIGNMENT MODAL ── */}
      {assigningOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="text-green-600" size={20} />
                Assign: {assigningOrder.orderNumber}
              </h2>
              <button onClick={() => setAssigningOrder(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

              {/* Customer info */}
              <div className="bg-green-50 rounded-xl p-4 flex gap-4">
                <div className="flex-1">
                  <p className="font-bold text-green-800">{assigningOrder.customer.firstName} {assigningOrder.customer.lastName}</p>
                  <p className="text-sm text-gray-500">{assigningOrder.customer.phone ?? 'No phone'}</p>
                </div>
                {Array.isArray(assigningOrder.customer.photos) && assigningOrder.customer.photos.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {(assigningOrder.customer.photos as string[]).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`pos-${i}`} className="w-14 h-16 object-cover rounded border border-green-300" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignment method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Assignment Method</label>
                  <div className="flex gap-2">
                    {(['manual', 'automatic'] as const).map((m) => (
                      <button key={m} onClick={() => setAssignMethod(m)}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-all capitalize ${assignMethod === m ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {assignMethod === 'manual' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Select Sewer</label>
                    <select value={selectedSewer} onChange={(e) => setSelectedSewer(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">— Choose sewer —</option>
                      {sewers.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Garment type + estimated date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Garment Type</label>
                  <select value={garmentType} onChange={(e) => setGarmentType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    {GARMENT_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Estimated Done By</label>
                  <input type="date" value={estimatedDoneAt} onChange={(e) => setEstimatedDoneAt(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Measurements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1"><Ruler size={13} />Body Measurements (cm)</p>
                  {assigningOrder.customer.bodyMeasurements && (
                    <span className="text-xs text-green-600 font-semibold">✓ Pre-filled from customer profile</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {MEASUREMENT_FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs text-gray-500 mb-0.5">{f.label.split('(')[0].trim()}</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder={f.hint}
                        value={measurements[f.key] ?? ''}
                        onChange={(e) => setMeasurements({ ...measurements, [f.key]: e.target.value })}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fabric prediction */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <Scissors className="text-amber-600" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-800">Fabric Required (Predicted)</p>
                  <p className="text-2xl font-black text-amber-700">{fabricPreview.toFixed(1)} meters</p>
                  <p className="text-xs text-amber-600">Based on {GARMENT_TYPES.find((g) => g.value === garmentType)?.label} — adjust measurements for accurate calculation</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setAssigningOrder(null)}>Cancel</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => void handleAssign()} disabled={assigning}>
                  {assigning ? <Loader2 size={16} className="animate-spin mr-2" /> : <UserCheck size={16} className="mr-2" />}
                  Assign to Sewer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
