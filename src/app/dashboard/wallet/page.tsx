'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Wallet, Plus, Star, TrendingUp, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2, Clock, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface WalletUser {
  id: number
  firstName: string
  lastName: string
  role: string
  isActive: boolean
}

interface WalletRow {
  id: number
  userId: number
  balance: number
  totalEarned: number
  totalPaid: number
  currency: string
  updatedAt: string
  user: WalletUser
  transactions: WalletTx[]
}

interface WalletTx {
  id: number
  type: 'credit' | 'debit' | 'adjustment'
  reason: string
  amount: number
  balanceAfter: number
  note: string | null
  createdAt: string
}

interface OvertimeLog {
  id: number
  date: string
  hoursWorked: number
  overtimeHours: number
  overtimePay: number
  status: string
  note: string | null
  user: { firstName: string; lastName: string; role: string }
}

interface PointEntry {
  id: number
  type: string
  reason: string | null
  points: number
  balanceAfter: number
  note: string | null
  createdAt: string
  user: { id: number; firstName: string; lastName: string; role: string }
  awardedBy: { firstName: string; lastName: string } | null
}

const REASON_LABELS: Record<string, string> = {
  salary: 'Salary',
  overtime_bonus: 'Overtime Bonus',
  performance_bonus: 'Performance Bonus',
  deduction: 'Deduction',
  manual_adjustment: 'Manual Adjustment',
}

const OVERTIME_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
}

export default function WalletPage() {
  const { user } = useAuth()
  const isAdmin = user && ['admin', 'manager'].includes(user.role)

  const [wallets, setWallets] = useState<WalletRow[]>([])
  const [overtime, setOvertime] = useState<OvertimeLog[]>([])
  const [points, setPoints] = useState<PointEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'wallets' | 'overtime' | 'points'>('wallets')
  const [selectedWallet, setSelectedWallet] = useState<WalletRow | null>(null)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showAwardPoints, setShowAwardPoints] = useState(false)
  const [showLogOvertime, setShowLogOvertime] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [fundForm, setFundForm] = useState({ type: 'credit', reason: 'salary', amount: '', note: '' })
  const [pointForm, setPointForm] = useState({ userId: '', type: 'earn', reason: 'manual_award', points: '', note: '' })
  const [overtimeForm, setOvertimeForm] = useState({ userId: '', date: '', hoursWorked: '', regularHours: '8', hourlyRate: '', note: '' })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [wRes, otRes, ptRes] = await Promise.all([
        fetch('/api/wallet', { credentials: 'include' }),
        fetch('/api/overtime', { credentials: 'include' }),
        fetch('/api/points', { credentials: 'include' }),
      ])
      if (wRes.ok) {
        const d = await wRes.json()
        setWallets(Array.isArray(d.wallets) ? d.wallets : [])
      }
      if (otRes.ok) {
        const d = await otRes.json()
        setOvertime(Array.isArray(d.logs) ? d.logs : [])
      }
      if (ptRes.ok) {
        const d = await ptRes.json()
        setPoints(Array.isArray(d.entries) ? d.entries : [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const handleAddFunds = async () => {
    if (!selectedWallet) return
    setSubmitting(true)
    try {
      await fetch('/api/wallet', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedWallet.userId, ...fundForm, amount: Number(fundForm.amount) }),
      })
      setShowAddFunds(false)
      setFundForm({ type: 'credit', reason: 'salary', amount: '', note: '' })
      await fetchAll()
    } finally {
      setSubmitting(false)
    }
  }

  const handleAwardPoints = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/points', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pointForm, userId: Number(pointForm.userId), points: Number(pointForm.points) }),
      })
      setShowAwardPoints(false)
      setPointForm({ userId: '', type: 'earn', reason: 'manual_award', points: '', note: '' })
      await fetchAll()
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogOvertime = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/overtime', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...overtimeForm,
          userId: overtimeForm.userId ? Number(overtimeForm.userId) : undefined,
          hoursWorked: Number(overtimeForm.hoursWorked),
          regularHours: Number(overtimeForm.regularHours),
          hourlyRate: Number(overtimeForm.hourlyRate),
        }),
      })
      setShowLogOvertime(false)
      setOvertimeForm({ userId: '', date: '', hoursWorked: '', regularHours: '8', hourlyRate: '', note: '' })
      await fetchAll()
    } finally {
      setSubmitting(false)
    }
  }

  const handleOvertimeAction = async (id: number, status: string) => {
    await fetch('/api/overtime', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    await fetchAll()
  }

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0)
  const totalEarned = wallets.reduce((s, w) => s + Number(w.totalEarned), 0)
  const pendingOT = overtime.filter((o) => o.status === 'pending').length

  const staffWallets = wallets.filter((w) => ['sales', 'sewer', 'designer', 'staff', 'store_keeper', 'material_controller'].includes(w.user.role))

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
            <Wallet className="text-green-600 shrink-0" size={32} />
            Wallet & Rewards
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage staff wallets, overtime, and point rewards.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowLogOvertime(true)}>
                <Clock size={16} className="mr-1" /> Log Overtime
              </Button>
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => setShowAwardPoints(true)}>
                <Star size={16} className="mr-1" /> Award Points
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => void fetchAll()}>
            <RefreshCw size={16} className="mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Total Wallet Balance</p>
            <p className="text-xl font-bold text-gray-900">ETB {totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Total Earned</p>
            <p className="text-xl font-bold text-gray-900">ETB {totalEarned.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Pending Overtime</p>
            <p className="text-xl font-bold text-gray-900">{pendingOT} entries</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Staff Wallets</p>
            <p className="text-xl font-bold text-gray-900">{staffWallets.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['wallets', 'overtime', 'points'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'wallets' ? 'Wallets' : tab === 'overtime' ? 'Overtime' : 'Points'}
          </button>
        ))}
      </div>

      {/* WALLETS TAB */}
      {activeTab === 'wallets' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {staffWallets.map((w) => (
              <Card key={w.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                onClick={() => setSelectedWallet(selectedWallet?.id === w.id ? null : w)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {w.user.firstName[0]}{w.user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{w.user.firstName} {w.user.lastName}</p>
                        <p className="text-xs text-gray-500 capitalize">{w.user.role.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                    <Badge variant={w.user.isActive ? 'success' : 'outline'} className="text-xs">
                      {w.user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Balance</p>
                      <p className="font-bold text-green-700 text-sm">ETB {Number(w.balance).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Earned</p>
                      <p className="font-semibold text-blue-600 text-sm">ETB {Number(w.totalEarned).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Paid Out</p>
                      <p className="font-semibold text-gray-600 text-sm">ETB {Number(w.totalPaid).toLocaleString()}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 text-xs"
                      onClick={(e) => { e.stopPropagation(); setSelectedWallet(w); setShowAddFunds(true) }}
                    >
                      <Plus size={14} className="mr-1" /> Add / Deduct
                    </Button>
                  )}
                </CardContent>
                {/* Transaction history inline */}
                {selectedWallet?.id === w.id && w.transactions.length > 0 && (
                  <div className="border-t border-gray-100 px-4 pb-4">
                    <p className="text-xs font-semibold text-gray-500 mt-3 mb-2">Recent Transactions</p>
                    <div className="space-y-1">
                      {w.transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                          <div className="flex items-center gap-2">
                            {tx.type === 'credit' ? (
                              <ArrowUpRight size={12} className="text-green-600" />
                            ) : (
                              <ArrowDownLeft size={12} className="text-red-500" />
                            )}
                            <span className="text-gray-700">{REASON_LABELS[tx.reason] ?? tx.reason}</span>
                          </div>
                          <div className="text-right">
                            <span className={tx.type === 'credit' ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                              {tx.type === 'credit' ? '+' : '-'}ETB {Number(tx.amount).toLocaleString()}
                            </span>
                            <p className="text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
          {staffWallets.length === 0 && (
            <div className="text-center py-14 text-gray-400">
              <Wallet className="mx-auto mb-3" size={44} />
              No wallets yet. Wallets are created when you make the first transaction.
            </div>
          )}
        </div>
      )}

      {/* OVERTIME TAB */}
      {activeTab === 'overtime' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock size={20} className="text-orange-500" /> Overtime Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Staff</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>OT Hours</TableHead>
                    <TableHead>OT Pay</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overtime.map((log) => (
                    <TableRow key={log.id} className="hover:bg-orange-50/30">
                      <TableCell>
                        <span className="font-medium text-gray-900">{log.user.firstName} {log.user.lastName}</span>
                        <p className="text-xs text-gray-400 capitalize">{log.user.role.replace(/_/g, ' ')}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{new Date(log.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{log.hoursWorked}h</TableCell>
                      <TableCell className="text-sm font-semibold text-orange-600">{log.overtimeHours}h</TableCell>
                      <TableCell className="text-sm font-bold text-green-700">ETB {Number(log.overtimePay).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${OVERTIME_STATUS_COLOR[log.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {log.status}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {log.status === 'pending' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2"
                                  onClick={() => void handleOvertimeAction(log.id, 'approved')}>Approve</Button>
                                <Button size="sm" variant="destructive" className="text-xs h-7 px-2"
                                  onClick={() => void handleOvertimeAction(log.id, 'rejected')}>Reject</Button>
                              </>
                            )}
                            {log.status === 'approved' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-2"
                                onClick={() => void handleOvertimeAction(log.id, 'paid')}>Mark Paid</Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {overtime.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Clock className="mx-auto mb-3" size={40} />
                No overtime logs yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* POINTS TAB */}
      {activeTab === 'points' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star size={20} className="text-yellow-500" /> Points Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Staff</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {points.map((p) => (
                    <TableRow key={p.id} className="hover:bg-yellow-50/30">
                      <TableCell>
                        <span className="font-medium text-gray-900">{p.user.firstName} {p.user.lastName}</span>
                        <p className="text-xs text-gray-400 capitalize">{p.user.role.replace(/_/g, ' ')}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.type === 'earn' ? 'success' : p.type === 'redeem' ? 'warning' : 'outline'} className="capitalize text-xs">
                          {p.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 capitalize">{(p.reason ?? 'N/A').replace(/_/g, ' ')}</TableCell>
                      <TableCell className={`font-bold text-sm ${p.points >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {p.points >= 0 ? '+' : ''}{p.points} pts
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-gray-800">{p.balanceAfter} pts</TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[120px] truncate">{p.note ?? '—'}</TableCell>
                      <TableCell className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {points.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Star className="mx-auto mb-3" size={40} />
                No point entries yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ADD FUNDS MODAL */}
      {showAddFunds && selectedWallet && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-green-600" />
                Wallet Transaction — {selectedWallet.user.firstName} {selectedWallet.user.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={fundForm.type} onChange={(e) => setFundForm({ ...fundForm, type: e.target.value })}>
                  <option value="credit">Credit (Add Money)</option>
                  <option value="debit">Debit (Deduct Money)</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={fundForm.reason} onChange={(e) => setFundForm({ ...fundForm, reason: e.target.value })}>
                  <option value="salary">Salary</option>
                  <option value="overtime_bonus">Overtime Bonus</option>
                  <option value="performance_bonus">Performance Bonus</option>
                  <option value="deduction">Deduction</option>
                  <option value="manual_adjustment">Manual Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ETB)</label>
                <Input type="number" placeholder="0.00" value={fundForm.amount}
                  onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <Input placeholder="e.g. March salary payment" value={fundForm.note}
                  onChange={(e) => setFundForm({ ...fundForm, note: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowAddFunds(false); setSelectedWallet(null) }}>Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700" disabled={!fundForm.amount || submitting}
                  onClick={() => void handleAddFunds()}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AWARD POINTS MODAL */}
      {showAwardPoints && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star size={20} className="text-yellow-500" /> Award Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff (User ID)</label>
                <Input type="number" placeholder="User ID" value={pointForm.userId}
                  onChange={(e) => setPointForm({ ...pointForm, userId: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={pointForm.type} onChange={(e) => setPointForm({ ...pointForm, type: e.target.value })}>
                  <option value="earn">Earn</option>
                  <option value="redeem">Redeem</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={pointForm.reason} onChange={(e) => setPointForm({ ...pointForm, reason: e.target.value })}>
                  <option value="order_completed">Order Completed</option>
                  <option value="overtime_worked">Overtime Worked</option>
                  <option value="quality_bonus">Quality Bonus</option>
                  <option value="sales_target_hit">Sales Target Hit</option>
                  <option value="social_post_evidence">Social Post Evidence</option>
                  <option value="manual_award">Manual Award</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <Input type="number" placeholder="e.g. 50" value={pointForm.points}
                  onChange={(e) => setPointForm({ ...pointForm, points: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <Input placeholder="Reason details" value={pointForm.note}
                  onChange={(e) => setPointForm({ ...pointForm, note: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAwardPoints(false)}>Cancel</Button>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white" disabled={!pointForm.userId || !pointForm.points || submitting}
                  onClick={() => void handleAwardPoints()}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Award'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LOG OVERTIME MODAL */}
      {showLogOvertime && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock size={20} className="text-orange-500" /> Log Overtime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff (User ID)</label>
                <Input type="number" placeholder="Leave blank for yourself" value={overtimeForm.userId}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, userId: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input type="date" value={overtimeForm.date}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours Worked</label>
                  <Input type="number" step="0.5" placeholder="e.g. 10" value={overtimeForm.hoursWorked}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, hoursWorked: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular Hours</label>
                  <Input type="number" step="0.5" value={overtimeForm.regularHours}
                    onChange={(e) => setOvertimeForm({ ...overtimeForm, regularHours: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (ETB)</label>
                <Input type="number" placeholder="e.g. 75" value={overtimeForm.hourlyRate}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, hourlyRate: e.target.value })} />
              </div>
              {overtimeForm.hoursWorked && overtimeForm.regularHours && overtimeForm.hourlyRate && (
                <div className="bg-orange-50 rounded-lg p-3 text-sm">
                  <p className="text-orange-800">
                    OT Hours: <strong>{Math.max(0, Number(overtimeForm.hoursWorked) - Number(overtimeForm.regularHours))}h</strong>{' '}
                    | OT Pay: <strong>ETB {(Math.max(0, Number(overtimeForm.hoursWorked) - Number(overtimeForm.regularHours)) * Number(overtimeForm.hourlyRate) * 1.5).toLocaleString()}</strong>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <Input placeholder="Details about the overtime" value={overtimeForm.note}
                  onChange={(e) => setOvertimeForm({ ...overtimeForm, note: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLogOvertime(false)}>Cancel</Button>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!overtimeForm.date || !overtimeForm.hoursWorked || !overtimeForm.hourlyRate || submitting}
                  onClick={() => void handleLogOvertime()}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Log Overtime'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
