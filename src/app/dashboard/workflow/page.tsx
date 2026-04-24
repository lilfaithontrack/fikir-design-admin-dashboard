'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GitBranch, RefreshCw, Loader2, ChevronRight, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { apiFetch } from '@/lib/api-fetch'

interface WorkflowEvent {
  id: number
  orderId: number
  fromStage: string | null
  toStage: string
  comment: string | null
  createdAt: string
  actor: { firstName: string; lastName: string; role: string } | null
  order: {
    orderNumber: string
    status: string
    currentStage: string
    customer: { firstName: string; lastName: string }
  }
}

interface OrderWithWorkflow {
  id: number
  orderNumber: string
  status: string
  currentStage: string
  isHighPriority: boolean
  createdAt: string
  customer: { firstName: string; lastName: string }
  workflowEvents: WorkflowEvent[]
}

const STAGE_LABELS: Record<string, string> = {
  crm_data: 'CRM Data Entry',
  sales_staff: 'Sales Staff',
  designer: 'Designer',
  sewer_production_team: 'Sewer / Production',
  store_manager: 'Store Manager',
  production: 'Production',
  quality_control: 'Quality Control',
  delivery_team: 'Delivery Team',
}

const STAGE_COLORS: Record<string, string> = {
  crm_data: 'bg-gray-100 text-gray-700',
  sales_staff: 'bg-blue-100 text-blue-700',
  designer: 'bg-purple-100 text-purple-700',
  sewer_production_team: 'bg-orange-100 text-orange-700',
  store_manager: 'bg-yellow-100 text-yellow-700',
  production: 'bg-amber-100 text-amber-700',
  quality_control: 'bg-teal-100 text-teal-700',
  delivery_team: 'bg-green-100 text-green-700',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  design_in_progress: 'bg-purple-100 text-purple-700',
  design_completed: 'bg-purple-200 text-purple-800',
  sewing_in_progress: 'bg-orange-100 text-orange-700',
  sewing_completed: 'bg-orange-200 text-orange-800',
  quality_check: 'bg-teal-100 text-teal-700',
  quality_passed: 'bg-teal-200 text-teal-800',
  ready_for_delivery: 'bg-green-100 text-green-700',
  delivery_in_progress: 'bg-green-200 text-green-800',
  delivered: 'bg-green-600 text-white',
  cancelled: 'bg-red-100 text-red-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
}

const WORKFLOW_STAGES = [
  'crm_data',
  'sales_staff',
  'designer',
  'sewer_production_team',
  'store_manager',
  'production',
  'quality_control',
  'delivery_team',
]

export default function WorkflowPage() {
  const [orders, setOrders] = useState<OrderWithWorkflow[]>([])
  const [events, setEvents] = useState<WorkflowEvent[]>([])
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'board' | 'timeline'>('board')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithWorkflow | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/workflow')
      if (res.ok) {
        const d = await res.json()
        setOrders(d.orders || [])
        setEvents(d.events || [])
        setStageCounts(d.stageCounts || {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const advanceStage = async (order: OrderWithWorkflow) => {
    setAdvancing(order.id)
    try {
      const res = await apiFetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      if (res.ok) await fetchData()
      else { const d = await res.json(); alert(d.error || 'Failed to advance') }
    } finally {
      setAdvancing(null)
    }
  }

  useEffect(() => { void fetchData() }, [fetchData])

  const filtered = stageFilter === 'all' ? orders : orders.filter((o) => o.currentStage === stageFilter)

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
            <GitBranch className="text-green-600 shrink-0" size={32} />
            Workflow Tracker
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Track every order from CRM entry to delivery across all teams.</p>
        </div>
        <Button variant="outline" onClick={() => void fetchData()}>
          <RefreshCw size={16} className="mr-1" /> Refresh
        </Button>
      </div>

      {/* Stage Pipeline Overview */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {WORKFLOW_STAGES.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-2">
              <button
                onClick={() => setStageFilter(stageFilter === stage ? 'all' : stage)}
                className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[110px] ${
                  stageFilter === stage
                    ? 'border-green-600 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50/50'
                }`}
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold mb-1 ${STAGE_COLORS[stage]}`}>
                  {stageCounts[stage] ?? 0}
                </span>
                <span className="text-xs text-gray-600 text-center leading-tight">{STAGE_LABELS[stage]}</span>
              </button>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['board', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'board' ? 'Orders Board' : 'Event Timeline'}
          </button>
        ))}
      </div>

      {/* BOARD TAB */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Orders {stageFilter !== 'all' && `— ${STAGE_LABELS[stageFilter]}`} ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Current Stage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Advance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((order) => {
                      const lastEvent = (order.workflowEvents ?? []).sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )[0]
                      return (
                        <TableRow
                          key={order.id}
                          className={`hover:bg-green-50/30 cursor-pointer ${order.isHighPriority ? 'border-l-4 border-l-red-400' : ''}`}
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        >
                          <TableCell>
                            <span className="font-mono text-sm font-semibold text-green-800">{order.orderNumber}</span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">
                            {order.customer.firstName} {order.customer.lastName}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[order.currentStage] ?? 'bg-gray-100 text-gray-600'}`}>
                              {STAGE_LABELS[order.currentStage] ?? order.currentStage}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            {order.isHighPriority && (
                              <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                                <AlertCircle size={12} /> High
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {lastEvent ? (
                              <span>
                                {lastEvent.actor ? `${lastEvent.actor.firstName} ${lastEvent.actor.lastName}` : 'System'} ·{' '}
                                {new Date(lastEvent.createdAt).toLocaleDateString()}
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            {order.currentStage !== 'delivery_team' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={advancing === order.id}
                                onClick={() => advanceStage(order)}
                                className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                              >
                                {advancing === order.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <><ArrowRight size={12} className="mr-1" />Next</>}
                              </Button>
                            ) : (
                              <span className="text-xs text-green-600 font-semibold">✓ Done</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Inline workflow history for selected order */}
              {selectedOrder && (
                <div className="mt-4 bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <GitBranch size={16} /> Workflow History — {selectedOrder.orderNumber}
                  </p>
                  <div className="relative pl-4 border-l-2 border-green-200 space-y-3">
                    {(selectedOrder.workflowEvents ?? [])
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((ev) => (
                        <div key={ev.id} className="relative">
                          <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                          <div className="ml-2">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              {ev.fromStage && (
                                <>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${STAGE_COLORS[ev.fromStage] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {STAGE_LABELS[ev.fromStage] ?? ev.fromStage}
                                  </span>
                                  <ChevronRight size={12} className="text-gray-400" />
                                </>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_COLORS[ev.toStage] ?? 'bg-gray-100 text-gray-600'}`}>
                                {STAGE_LABELS[ev.toStage] ?? ev.toStage}
                              </span>
                              <span className="text-gray-500 text-xs">
                                by {ev.actor ? `${ev.actor.firstName} ${ev.actor.lastName}` : 'System'}
                              </span>
                              <span className="text-gray-400 text-xs ml-auto">
                                {new Date(ev.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {ev.comment && <p className="text-xs text-gray-600 mt-1 ml-0">{ev.comment}</p>}
                          </div>
                        </div>
                      ))}
                    {(!selectedOrder.workflowEvents || selectedOrder.workflowEvents.length === 0) && (
                      <p className="text-sm text-gray-400">No workflow events recorded yet.</p>
                    )}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-14 text-gray-400">
                  <GitBranch className="mx-auto mb-3" size={44} />
                  No orders in this stage.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> Recent Workflow Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>From Stage</TableHead>
                    <TableHead>To Stage</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev) => (
                    <TableRow key={ev.id} className="hover:bg-blue-50/20">
                      <TableCell>
                        <span className="font-mono text-sm font-semibold text-green-800">{ev.order.orderNumber}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {ev.order.customer.firstName} {ev.order.customer.lastName}
                      </TableCell>
                      <TableCell>
                        {ev.fromStage ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${STAGE_COLORS[ev.fromStage] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STAGE_LABELS[ev.fromStage] ?? ev.fromStage}
                          </span>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_COLORS[ev.toStage] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STAGE_LABELS[ev.toStage] ?? ev.toStage}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {ev.actor ? (
                          <div>
                            <p>{ev.actor.firstName} {ev.actor.lastName}</p>
                            <p className="text-xs text-gray-400 capitalize">{ev.actor.role.replace(/_/g, ' ')}</p>
                          </div>
                        ) : <span className="text-gray-400 text-xs">System</span>}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[150px] truncate">
                        {ev.comment ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(ev.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {events.length === 0 && (
              <div className="text-center py-14 text-gray-400">
                <Clock className="mx-auto mb-3" size={44} />
                No workflow events recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
