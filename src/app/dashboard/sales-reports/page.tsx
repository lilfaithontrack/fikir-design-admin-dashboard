'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Plus, RefreshCw, Loader2, ExternalLink, CheckCircle, XCircle, Eye, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SalesReport {
  id: number
  userId: number
  reportDate: string
  activityType: string
  title: string
  description: string | null
  evidenceUrl: string | null
  platform: string | null
  reach: number | null
  leads: number
  conversions: number
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected'
  reviewNote: string | null
  pointsAwarded: number
  createdAt: string
  user: { id: number; firstName: string; lastName: string; role: string }
  reviewedBy: { firstName: string; lastName: string } | null
}

const ACTIVITY_LABELS: Record<string, string> = {
  tiktok_post: 'TikTok Post',
  instagram_post: 'Instagram Post',
  facebook_post: 'Facebook Post',
  customer_visit: 'Customer Visit',
  phone_call: 'Phone Call',
  whatsapp_message: 'WhatsApp Message',
  other: 'Other',
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok_post: '🎵',
  instagram_post: '📸',
  facebook_post: '📘',
  customer_visit: '🤝',
  phone_call: '📞',
  whatsapp_message: '💬',
  other: '📋',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const ACTIVITY_TYPES = [
  'tiktok_post',
  'instagram_post',
  'facebook_post',
  'customer_visit',
  'phone_call',
  'whatsapp_message',
  'other',
]

export default function SalesReportsPage() {
  const { user } = useAuth()
  const isAdmin = user && ['admin', 'manager'].includes(user.role)

  const [reports, setReports] = useState<SalesReport[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedReport, setSelectedReport] = useState<SalesReport | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    activityType: 'instagram_post',
    title: '',
    description: '',
    evidenceUrl: '',
    platform: '',
    reach: '',
    leads: '',
    conversions: '',
  })

  const [reviewForm, setReviewForm] = useState({
    status: 'approved',
    reviewNote: '',
    pointsAwarded: '10',
  })

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/sales-reports?${params}`, { credentials: 'include' })
      if (res.ok) {
        const d = await res.json()
        setReports(Array.isArray(d.reports) ? d.reports : [])
        setTotal(d.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { void fetchReports() }, [fetchReports])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/sales-reports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          reach: form.reach ? Number(form.reach) : undefined,
          leads: form.leads ? Number(form.leads) : 0,
          conversions: form.conversions ? Number(form.conversions) : 0,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({
          reportDate: new Date().toISOString().split('T')[0],
          activityType: 'instagram_post',
          title: '',
          description: '',
          evidenceUrl: '',
          platform: '',
          reach: '',
          leads: '',
          conversions: '',
        })
        await fetchReports()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async () => {
    if (!selectedReport) return
    setSubmitting(true)
    try {
      await fetch('/api/sales-reports', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReport.id,
          status: reviewForm.status,
          reviewNote: reviewForm.reviewNote,
          pointsAwarded: Number(reviewForm.pointsAwarded),
        }),
      })
      setShowReview(false)
      setSelectedReport(null)
      await fetchReports()
    } finally {
      setSubmitting(false)
    }
  }

  const submittedCount = reports.filter((r) => r.status === 'submitted').length
  const approvedCount = reports.filter((r) => r.status === 'approved').length
  const totalPoints = reports.reduce((s, r) => s + (r.pointsAwarded ?? 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="animate-spin text-green-600" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-green-600 shrink-0" size={32} />
            Sales Activity Reports
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Log daily sales activities with evidence links (TikTok, Instagram, etc.)
          </p>
        </div>
        <div className="flex gap-2">
          {(isAdmin || user?.role === 'sales') && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> New Report
            </Button>
          )}
          <Button variant="outline" onClick={() => void fetchReports()}>
            <RefreshCw size={16} className="mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Total Reports</p>
            <p className="text-xl font-bold text-gray-900">{total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Pending Review</p>
            <p className="text-xl font-bold text-gray-900">{submittedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Approved</p>
            <p className="text-xl font-bold text-gray-900">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">Points Awarded</p>
            <p className="text-xl font-bold text-gray-900">{totalPoints} pts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'submitted', 'reviewed', 'approved', 'rejected'].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            className={statusFilter === s ? 'bg-green-600 hover:bg-green-700 capitalize' : 'capitalize'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Reports ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Staff</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Leads / Conv.</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} className="hover:bg-green-50/30">
                    <TableCell>
                      <span className="font-medium text-gray-900">{r.user.firstName} {r.user.lastName}</span>
                      <p className="text-xs text-gray-400 capitalize">{r.user.role}</p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {new Date(r.reportDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm flex items-center gap-1">
                        <span>{PLATFORM_ICONS[r.activityType] ?? '📋'}</span>
                        <span className="text-gray-700">{ACTIVITY_LABELS[r.activityType] ?? r.activityType}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="text-sm font-medium text-gray-900 truncate" title={r.title}>{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-gray-400 truncate">{r.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.evidenceUrl ? (
                        <a
                          href={r.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                          View Link
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No link</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {r.leads ?? 0} / {r.conversions ?? 0}
                    </TableCell>
                    <TableCell>
                      {r.pointsAwarded > 0 ? (
                        <span className="flex items-center gap-1 text-yellow-700 font-semibold text-sm">
                          <Star size={12} className="text-yellow-500" /> {r.pointsAwarded}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => { setSelectedReport(r); setShowReview(true) }}
                        >
                          <Eye size={14} className="mr-1" /> Review
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {reports.length === 0 && (
            <div className="text-center py-14 text-gray-400">
              <FileText className="mx-auto mb-3" size={44} />
              No reports found. Sales staff should submit their daily activity reports.
            </div>
          )}
        </CardContent>
      </Card>

      {/* SUBMIT REPORT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-xl my-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={20} className="text-green-600" /> Submit Sales Activity Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <Input type="date" value={form.reportDate}
                    onChange={(e) => setForm({ ...form, reportDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })}>
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{PLATFORM_ICONS[t]} {ACTIVITY_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title / Summary</label>
                <Input placeholder="e.g. Posted habesha dress reel on Instagram" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  placeholder="Describe what you did..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence Link <span className="text-gray-400 font-normal">(TikTok, Instagram, etc.)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://www.tiktok.com/@yourpost or https://www.instagram.com/p/..."
                  value={form.evidenceUrl}
                  onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">Paste the exact link to the post or content you created.</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reach / Views</label>
                  <Input type="number" placeholder="0" value={form.reach}
                    onChange={(e) => setForm({ ...form, reach: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leads</label>
                  <Input type="number" placeholder="0" value={form.leads}
                    onChange={(e) => setForm({ ...form, leads: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conversions</label>
                  <Input type="number" placeholder="0" value={form.conversions}
                    onChange={(e) => setForm({ ...form, conversions: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!form.title || !form.activityType || submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Submit Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REVIEW MODAL */}
      {showReview && selectedReport && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <Card className="w-full max-w-lg shadow-xl my-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye size={20} className="text-blue-600" /> Review Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{PLATFORM_ICONS[selectedReport.activityType]}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedReport.title}</p>
                    <p className="text-gray-500">{selectedReport.user.firstName} {selectedReport.user.lastName} — {new Date(selectedReport.reportDate).toLocaleDateString()}</p>
                  </div>
                </div>
                {selectedReport.description && (
                  <p className="text-gray-700">{selectedReport.description}</p>
                )}
                {selectedReport.evidenceUrl && (
                  <a
                    href={selectedReport.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                  >
                    <ExternalLink size={14} /> View Evidence: {selectedReport.evidenceUrl.length > 50 ? selectedReport.evidenceUrl.substring(0, 50) + '...' : selectedReport.evidenceUrl}
                  </a>
                )}
                <div className="flex gap-4 text-gray-600">
                  <span>Reach: <strong>{selectedReport.reach ?? 0}</strong></span>
                  <span>Leads: <strong>{selectedReport.leads}</strong></span>
                  <span>Conv.: <strong>{selectedReport.conversions}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className={reviewForm.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                    variant={reviewForm.status === 'approved' ? 'default' : 'outline'}
                    onClick={() => setReviewForm({ ...reviewForm, status: 'approved' })}
                  >
                    <CheckCircle size={14} className="mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    className={reviewForm.status === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    variant={reviewForm.status === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setReviewForm({ ...reviewForm, status: 'rejected' })}
                  >
                    <XCircle size={14} className="mr-1" /> Reject
                  </Button>
                </div>
              </div>

              {reviewForm.status === 'approved' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points to Award</label>
                  <Input type="number" value={reviewForm.pointsAwarded}
                    onChange={(e) => setReviewForm({ ...reviewForm, pointsAwarded: e.target.value })} />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Note (optional)</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={2}
                  placeholder="Feedback for the staff member..."
                  value={reviewForm.reviewNote}
                  onChange={(e) => setReviewForm({ ...reviewForm, reviewNote: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowReview(false); setSelectedReport(null) }}>Cancel</Button>
                <Button
                  className={reviewForm.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700 text-white'}
                  disabled={submitting}
                  onClick={() => void handleReview()}
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : `Submit Review`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
