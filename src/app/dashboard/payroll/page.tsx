'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, DollarSign, Users, CheckCircle, Clock, XCircle, Download } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiFetch } from '@/lib/api-fetch'
import { ExportDropdown } from '@/components/ExportDropdown'
import { exportToExcel, exportToPDF, ColumnHelpers } from '@/lib/export-utils'

interface Staff { id: number; firstName: string; lastName: string; role: string; phone?: string }
interface PayrollRecord {
  id: number; userId: number; periodType: string; periodStart: string; periodEnd: string
  baseSalary: string; overtimePay: string; bonus: string; commission: string; allowances: string
  taxDeduction: string; pensionDeduction: string; otherDeductions: string; deductionNotes?: string
  grossPay: string; totalDeductions: string; netPay: string; status: string
  paidAt?: string; paymentMethod?: string; paymentRef?: string; notes?: string
  user: Staff; processedBy?: { id: number; firstName: string; lastName: string }
}

function ModalShell({ open, title, wide, onClose, children }: { open: boolean; title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={onClose}>
      <Card className={`w-full max-h-[90vh] overflow-y-auto shadow-lg ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>✕</Button>
        </CardHeader>
        <CardContent className="pt-4">{children}</CardContent>
      </Card>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function PayrollPage() {
  const { t } = useLanguage()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>({})
  const [statusFilter, setStatusFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [fUserId, setFUserId] = useState('')
  const [fPeriodStart, setFPeriodStart] = useState('')
  const [fPeriodEnd, setFPeriodEnd] = useState('')
  const [fBaseSalary, setFBaseSalary] = useState('')
  const [fOvertimePay, setFOvertimePay] = useState('0')
  const [fBonus, setFBonus] = useState('0')
  const [fCommission, setFCommission] = useState('0')
  const [fAllowances, setFAllowances] = useState('0')
  const [fTax, setFTax] = useState('0')
  const [fPension, setFPension] = useState('0')
  const [fOtherDed, setFOtherDed] = useState('0')
  const [fNotes, setFNotes] = useState('')

  const fetchRecords = useCallback(async () => {
    try {
      const url = statusFilter ? `/api/payroll?status=${statusFilter}` : '/api/payroll'
      const res = await apiFetch(url)
      const data = await res.json()
      setRecords(data.records || [])
      setSummary(data.summary || {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [statusFilter])

  const fetchStaff = useCallback(async () => {
    try {
      const res = await apiFetch('/api/users')
      const data = await res.json()
      setStaff(Array.isArray(data) ? data : data.users || [])
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchRecords(); fetchStaff() }, [fetchRecords, fetchStaff])

  // Auto-compute
  const gross = (Number(fBaseSalary) || 0) + (Number(fOvertimePay) || 0) + (Number(fBonus) || 0) + (Number(fCommission) || 0) + (Number(fAllowances) || 0)
  const deductions = (Number(fTax) || 0) + (Number(fPension) || 0) + (Number(fOtherDed) || 0)
  const net = gross - deductions

  const submitAdd = async () => {
    if (!fUserId || !fPeriodStart || !fPeriodEnd || !fBaseSalary) { alert('Fill required fields'); return }
    setSaving(true)
    try {
      const res = await apiFetch('/api/payroll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(fUserId), periodStart: fPeriodStart, periodEnd: fPeriodEnd,
          baseSalary: fBaseSalary, overtimePay: fOvertimePay, bonus: fBonus,
          commission: fCommission, allowances: fAllowances,
          taxDeduction: fTax, pensionDeduction: fPension, otherDeductions: fOtherDed,
          notes: fNotes || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setAddOpen(false); fetchRecords()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await apiFetch('/api/payroll', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      fetchRecords()
    } catch (e: any) { alert(e.message) }
  }

  const fmt = (v: string | number) => Number(v).toLocaleString('en-ET', { minimumFractionDigits: 2 })

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-green-600" size={48} /></div>

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="text-green-600" /><div><p className="text-sm text-gray-500">Total Gross Pay</p><p className="text-2xl font-bold">{fmt(summary.totalGross || 0)} ETB</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="text-red-500" /><div><p className="text-sm text-gray-500">Total Deductions</p><p className="text-2xl font-bold">{fmt(summary.totalDeductions || 0)} ETB</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="text-blue-600" /><div><p className="text-sm text-gray-500">Total Net Pay</p><p className="text-2xl font-bold">{fmt(summary.totalNet || 0)} ETB</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="text-yellow-500" /><div><p className="text-sm text-gray-500">Pending / Paid</p><p className="text-2xl font-bold">{summary.pendingCount || 0} / {summary.paidCount || 0}</p></div></div></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {['', 'draft', 'pending_approval', 'approved', 'paid', 'rejected'].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)} className={statusFilter === s ? 'bg-green-600 text-white' : ''}>
              {s ? s.replace('_', ' ') : 'All'}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <ExportDropdown
            label="Export"
            onExportExcel={() => {
              exportToExcel({
                title: 'Payroll Report',
                subtitle: `Generated on ${new Date().toLocaleDateString('en-ET')}`,
                filename: `fikir-payroll-${new Date().toISOString().split('T')[0]}`,
                companyName: 'Fikir Design',
                companyInfo: ['Addis Ababa, Ethiopia', 'fikirdesign.et'],
                columns: [
                  ColumnHelpers.text('Staff', 'staffName', 20),
                  ColumnHelpers.text('Period', 'period', 18),
                  ColumnHelpers.currency('Gross', 'grossPay', 14),
                  ColumnHelpers.currency('Deductions', 'totalDeductions', 14),
                  ColumnHelpers.currency('Net Pay', 'netPay', 14),
                  ColumnHelpers.status('Status', 'status', 12),
                ],
                data: records.map(r => ({
                  ...r,
                  staffName: `${r.user.firstName} ${r.user.lastName}`,
                  period: `${new Date(r.periodStart).toLocaleDateString()} - ${new Date(r.periodEnd).toLocaleDateString()}`
                }))
              })
            }}
            onExportPDF={() => {
              exportToPDF({
                title: 'Payroll Report',
                subtitle: `Total Records: ${records.length}`,
                filename: `fikir-payroll-${new Date().toISOString().split('T')[0]}`,
                companyName: 'Fikir Design',
                companyInfo: ['Addis Ababa, Ethiopia', 'fikirdesign.et'],
                columns: [
                  ColumnHelpers.text('Staff', 'staffName', 25),
                  ColumnHelpers.text('Period', 'period', 20),
                  ColumnHelpers.currency('Net Pay', 'netPay', 18),
                  ColumnHelpers.status('Status', 'status', 15),
                ],
                data: records.map(r => ({
                  ...r,
                  staffName: `${r.user.firstName} ${r.user.lastName}`,
                  period: `${new Date(r.periodStart).toLocaleDateString()} - ${new Date(r.periodEnd).toLocaleDateString()}`
                }))
              })
            }}
          />
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setFUserId(''); setFPeriodStart(''); setFPeriodEnd(''); setFBaseSalary(''); setFOvertimePay('0'); setFBonus('0'); setFCommission('0'); setFAllowances('0'); setFTax('0'); setFPension('0'); setFOtherDed('0'); setFNotes(''); setAddOpen(true) }}>
            <Plus size={16} className="mr-1" /> New Payroll
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.user.firstName} {r.user.lastName}<br /><span className="text-xs text-gray-500 capitalize">{r.user.role}</span></TableCell>
                <TableCell className="text-sm">{new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">{fmt(r.grossPay)}</TableCell>
                <TableCell className="text-right text-red-600">-{fmt(r.totalDeductions)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(r.netPay)}</TableCell>
                <TableCell><Badge className={`${STATUS_COLORS[r.status] || ''} capitalize`}>{r.status.replace('_', ' ')}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {r.status === 'draft' && <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'pending_approval')}>Submit</Button>}
                    {r.status === 'pending_approval' && <><Button size="sm" className="bg-blue-600 text-white" onClick={() => updateStatus(r.id, 'approved')}>Approve</Button><Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, 'rejected')}>Reject</Button></>}
                    {r.status === 'approved' && <Button size="sm" className="bg-green-600 text-white" onClick={() => updateStatus(r.id, 'paid')}>Mark Paid</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-500 py-8">No payroll records found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      {/* Add Payroll Modal */}
      <ModalShell open={addOpen} title="Create Payroll Record" wide onClose={() => setAddOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Staff Member *</label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={fUserId} onChange={e => setFUserId(e.target.value)}>
                <option value="">Select staff...</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pay Period</label>
              <div className="flex gap-2 mt-1">
                <Input type="date" value={fPeriodStart} onChange={e => setFPeriodStart(e.target.value)} placeholder="Start" />
                <Input type="date" value={fPeriodEnd} onChange={e => setFPeriodEnd(e.target.value)} placeholder="End" />
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="border rounded-lg p-3 bg-green-50">
            <p className="text-xs font-bold text-green-700 uppercase mb-2">Earnings</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs text-gray-500">Base Salary *</label><Input type="number" value={fBaseSalary} onChange={e => setFBaseSalary(e.target.value)} placeholder="ETB" /></div>
              <div><label className="text-xs text-gray-500">Overtime Pay</label><Input type="number" value={fOvertimePay} onChange={e => setFOvertimePay(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Bonus</label><Input type="number" value={fBonus} onChange={e => setFBonus(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Commission</label><Input type="number" value={fCommission} onChange={e => setFCommission(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Allowances</label><Input type="number" value={fAllowances} onChange={e => setFAllowances(e.target.value)} /></div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border rounded-lg p-3 bg-red-50">
            <p className="text-xs font-bold text-red-700 uppercase mb-2">Deductions</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs text-gray-500">Income Tax</label><Input type="number" value={fTax} onChange={e => setFTax(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Pension (7%)</label><Input type="number" value={fPension} onChange={e => setFPension(e.target.value)} /></div>
              <div><label className="text-xs text-gray-500">Other Deductions</label><Input type="number" value={fOtherDed} onChange={e => setFOtherDed(e.target.value)} /></div>
            </div>
          </div>

          {/* Live Summary */}
          <div className="border rounded-lg p-3 bg-blue-50">
            <p className="text-xs font-bold text-blue-700 uppercase mb-2">Pay Summary (Live)</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-xs text-gray-500">Gross Pay</p><p className="text-lg font-bold text-green-700">{fmt(gross)}</p></div>
              <div><p className="text-xs text-gray-500">Deductions</p><p className="text-lg font-bold text-red-600">-{fmt(deductions)}</p></div>
              <div><p className="text-xs text-gray-500">Net Pay</p><p className="text-xl font-bold text-blue-700">{fmt(net)}</p></div>
            </div>
          </div>

          <div><label className="text-sm font-medium text-gray-700">Notes</label><Input value={fNotes} onChange={e => setFNotes(e.target.value)} className="mt-1" placeholder="Optional notes..." /></div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={saving} onClick={submitAdd}>{saving ? '…' : 'Create Payroll'}</Button>
          </div>
        </div>
      </ModalShell>
    </div>
  )
}
