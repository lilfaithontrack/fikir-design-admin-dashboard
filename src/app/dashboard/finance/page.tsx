'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, TrendingUp, TrendingDown, DollarSign, Trash2, BarChart3, Download } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiFetch } from '@/lib/api-fetch'
import { ExportDropdown } from '@/components/ExportDropdown'
import { exportToExcel, exportToPDF, ColumnHelpers } from '@/lib/export-utils'

interface Transaction {
  id: number; type: string; category: string; amount: string; title: string
  description?: string; referenceId?: string; referenceType?: string
  paymentMethod?: string; paymentRef?: string; transactionDate: string
  createdBy?: { id: number; firstName: string; lastName: string }
}

const INCOME_CATS = [
  { value: 'product_sale', label: 'Product Sale' },
  { value: 'service_fee', label: 'Service Fee' },
  { value: 'custom_order', label: 'Custom Order' },
  { value: 'delivery_fee', label: 'Delivery Fee' },
  { value: 'other_income', label: 'Other Income' },
]
const EXPENSE_CATS = [
  { value: 'salary_payment', label: 'Salary Payment' },
  { value: 'material_purchase', label: 'Material Purchase' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transport', label: 'Transport' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'tax_payment', label: 'Tax Payment' },
  { value: 'other_expense', label: 'Other Expense' },
]

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

export default function FinancePage() {
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>({})
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form
  const [fType, setFType] = useState<'income' | 'expense'>('income')
  const [fCategory, setFCategory] = useState('')
  const [fAmount, setFAmount] = useState('')
  const [fTitle, setFTitle] = useState('')
  const [fDescription, setFDescription] = useState('')
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10))
  const [fPaymentMethod, setFPaymentMethod] = useState('')
  const [fPaymentRef, setFPaymentRef] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const res = await apiFetch(`/api/finance?${params}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
      setSummary(data.summary || {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [typeFilter, dateFrom, dateTo])

  useEffect(() => { fetchData() }, [fetchData])

  const submitAdd = async () => {
    if (!fCategory || !fAmount || !fTitle || !fDate) { alert('Fill required fields'); return }
    setSaving(true)
    try {
      const res = await apiFetch('/api/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: fType, category: fCategory, amount: fAmount, title: fTitle,
          description: fDescription || null, transactionDate: fDate,
          paymentMethod: fPaymentMethod || null, paymentRef: fPaymentRef || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setAddOpen(false); fetchData()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const deleteTransaction = async (id: number) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await apiFetch(`/api/finance?id=${id}`, { method: 'DELETE' })
      fetchData()
    } catch (e: any) { alert(e.message) }
  }

  const fmt = (v: number | string) => Number(v).toLocaleString('en-ET', { minimumFractionDigits: 2 })
  const catLabel = (cat: string) => [...INCOME_CATS, ...EXPENSE_CATS].find(c => c.value === cat)?.label || cat.replace(/_/g, ' ')

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-green-600" size={48} /></div>

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500"><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="text-green-600" size={28} /><div><p className="text-sm text-gray-500">Total Income</p><p className="text-2xl font-bold text-green-700">{fmt(summary.totalIncome || 0)} ETB</p></div></div></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingDown className="text-red-500" size={28} /><div><p className="text-sm text-gray-500">Total Expense</p><p className="text-2xl font-bold text-red-600">{fmt(summary.totalExpense || 0)} ETB</p></div></div></CardContent></Card>
        <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="text-blue-600" size={28} /><div><p className="text-sm text-gray-500">Net Profit</p><p className={`text-2xl font-bold ${(summary.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(summary.netProfit || 0)} ETB</p></div></div></CardContent></Card>
        <Card className="border-l-4 border-l-purple-500"><CardContent className="pt-6"><div className="flex items-center gap-3"><BarChart3 className="text-purple-600" size={28} /><div><p className="text-sm text-gray-500">Transactions</p><p className="text-2xl font-bold">{summary.transactionCount || 0}</p></div></div></CardContent></Card>
      </div>

      {/* Category Breakdown */}
      {summary.categoryBreakdown && Object.keys(summary.categoryBreakdown).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(summary.categoryBreakdown as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
                const isIncome = INCOME_CATS.some(c => c.value === cat)
                return (
                  <div key={cat} className={`p-3 rounded-lg ${isIncome ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-500 capitalize">{catLabel(cat)}</p>
                    <p className={`text-sm font-bold ${isIncome ? 'text-green-700' : 'text-red-600'}`}>{fmt(amount)} ETB</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 items-center">
          {['', 'income', 'expense'].map(s => (
            <Button key={s} size="sm" variant={typeFilter === s ? 'default' : 'outline'} onClick={() => setTypeFilter(s)} className={typeFilter === s ? 'bg-green-600 text-white' : ''}>
              {s || 'All'}
            </Button>
          ))}
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 h-9 text-sm" placeholder="From" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 h-9 text-sm" placeholder="To" />
        </div>
        <div className="flex gap-2">
          <ExportDropdown
            label="Export"
            onExportExcel={() => {
              exportToExcel({
                title: 'Finance Report',
                subtitle: `Generated on ${new Date().toLocaleDateString('en-ET')}`,
                filename: `fikir-finance-${new Date().toISOString().split('T')[0]}`,
                companyName: 'Fikir Design',
                companyInfo: ['Addis Ababa, Ethiopia', 'fikirdesign.et'],
                columns: [
                  ColumnHelpers.date('Date', 'transactionDate', 15),
                  ColumnHelpers.status('Type', 'type', 10),
                  ColumnHelpers.text('Category', 'categoryLabel', 18),
                  ColumnHelpers.text('Title', 'title', 30),
                  ColumnHelpers.text('Payment', 'paymentMethod', 12),
                  ColumnHelpers.currency('Amount', 'amount', 15),
                  ColumnHelpers.text('By', 'createdByName', 15),
                ],
                data: transactions.map(t => ({
                  ...t,
                  categoryLabel: [...INCOME_CATS, ...EXPENSE_CATS].find(c => c.value === t.category)?.label || t.category,
                  createdByName: t.createdBy ? `${t.createdBy.firstName} ${t.createdBy.lastName}` : '-'
                }))
              })
            }}
            onExportPDF={() => {
              exportToPDF({
                title: 'Finance Report',
                subtitle: `Total: ${transactions.length} transactions`,
                filename: `fikir-finance-${new Date().toISOString().split('T')[0]}`,
                companyName: 'Fikir Design',
                companyInfo: ['Addis Ababa, Ethiopia', 'fikirdesign.et'],
                columns: [
                  ColumnHelpers.date('Date', 'transactionDate', 15),
                  ColumnHelpers.status('Type', 'type', 12),
                  ColumnHelpers.text('Category', 'categoryLabel', 20),
                  ColumnHelpers.text('Title', 'title', 35),
                  ColumnHelpers.currency('Amount', 'amount', 18),
                ],
                data: transactions.map(t => ({
                  ...t,
                  categoryLabel: [...INCOME_CATS, ...EXPENSE_CATS].find(c => c.value === t.category)?.label || t.category
                }))
              })
            }}
          />
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setFType('income'); setFCategory(''); setFAmount(''); setFTitle(''); setFDescription(''); setFDate(new Date().toISOString().slice(0, 10)); setFPaymentMethod(''); setFPaymentRef(''); setAddOpen(true) }}>
            <Plus size={16} className="mr-1" /> Add Transaction
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>By</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell className="text-sm">{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                <TableCell><Badge className={tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{tx.type}</Badge></TableCell>
                <TableCell className="text-sm capitalize">{catLabel(tx.category)}</TableCell>
                <TableCell className="font-medium">{tx.title}{tx.description && <p className="text-xs text-gray-500 mt-0.5">{tx.description}</p>}</TableCell>
                <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>{tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)} ETB</TableCell>
                <TableCell className="text-xs text-gray-500">{tx.paymentMethod || '—'}</TableCell>
                <TableCell className="text-xs text-gray-500">{tx.createdBy ? `${tx.createdBy.firstName} ${tx.createdBy.lastName}` : '—'}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => deleteTransaction(tx.id)}><Trash2 size={14} className="text-red-500" /></Button></TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-gray-500 py-8">No transactions found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      {/* Add Transaction Modal */}
      <ModalShell open={addOpen} title="Add Finance Transaction" onClose={() => setAddOpen(false)}>
        <div className="space-y-3">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button size="sm" className={fType === 'income' ? 'bg-green-600 text-white' : ''} variant={fType === 'income' ? 'default' : 'outline'} onClick={() => { setFType('income'); setFCategory('') }}>
              <TrendingUp size={14} className="mr-1" /> Income
            </Button>
            <Button size="sm" className={fType === 'expense' ? 'bg-red-600 text-white' : ''} variant={fType === 'expense' ? 'default' : 'outline'} onClick={() => { setFType('expense'); setFCategory('') }}>
              <TrendingDown size={14} className="mr-1" /> Expense
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Category *</label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={fCategory} onChange={e => setFCategory(e.target.value)}>
                <option value="">Select category...</option>
                {(fType === 'income' ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Amount (ETB) *</label>
              <Input type="number" step="0.01" value={fAmount} onChange={e => setFAmount(e.target.value)} className="mt-1" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Title *</label>
            <Input value={fTitle} onChange={e => setFTitle(e.target.value)} className="mt-1" placeholder="e.g. Fabric purchase from Merkato" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Input value={fDescription} onChange={e => setFDescription(e.target.value)} className="mt-1" placeholder="Optional details..." />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Date *</label>
              <Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Payment Method</label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={fPaymentMethod} onChange={e => setFPaymentMethod(e.target.value)}>
                <option value="">—</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="telebirr">TeleBirr</option>
                <option value="cbe_birr">CBE Birr</option>
                <option value="check">Check</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Reference #</label>
              <Input value={fPaymentRef} onChange={e => setFPaymentRef(e.target.value)} className="mt-1" placeholder="Receipt / Ref" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className={fType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled={saving} onClick={submitAdd}>{saving ? '…' : `Add ${fType}`}</Button>
          </div>
        </div>
      </ModalShell>
    </div>
  )
}
