'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Filter, Download, Edit, Trash2, Eye, Package, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiFetch } from '@/lib/api-fetch'
import { computeProductMarginPreview, decimalStringToNumber } from '@/lib/product-margin'

interface Product {
  id: number
  name: string
  nameAm?: string | null
  sku: string
  price: string
  status: string
  categoryId?: number | null
  category?: { name: string }
  inventory?: { quantity: number }
  costPrice?: string | null
  defaultShippingFee?: string | null
  defaultServiceFee?: string | null
  estimatedLaborCost?: string | null
  estimatedMaterialCost?: string | null
  descriptionShort?: string | null
  descriptionShortAm?: string | null
  descriptionDetailed?: string | null
  descriptionDetailedAm?: string | null
  fabricComposition?: string | null
  fabricCompositionAm?: string | null
  careInstructions?: string | null
  careInstructionsAm?: string | null
  designNotes?: string | null
  designNotesAm?: string | null
  measurementGuideSummary?: string | null
  measurementGuideSummaryAm?: string | null
}

interface ProductDetail extends Product {
  basePrice?: unknown
}

function marginFromProductRow(p: Product) {
  return computeProductMarginPreview({
    basePrice: decimalStringToNumber(p.price),
    costPrice: decimalStringToNumber(p.costPrice),
    defaultShippingFee: decimalStringToNumber(p.defaultShippingFee),
    defaultServiceFee: decimalStringToNumber(p.defaultServiceFee),
    estimatedLaborCost: decimalStringToNumber(p.estimatedLaborCost),
    estimatedMaterialCost: decimalStringToNumber(p.estimatedMaterialCost),
  })
}

type CategoryTypeValue = 'product_type' | 'category' | 'subcategory'

interface CatRow {
  id: number
  name: string
  categoryType?: string
  parentId?: number | null
}

function normalizeCatType(t: string | undefined): CategoryTypeValue {
  if (t === 'product_type' || t === 'category' || t === 'subcategory') return t
  return 'subcategory'
}

function formatCategoryBreadcrumb(catId: number | null | undefined, cats: CatRow[]): string {
  if (!catId) return '—'
  const parts: string[] = []
  let cur: CatRow | undefined = cats.find((c) => c.id === catId)
  while (cur) {
    parts.unshift(cur.name)
    const pid = cur.parentId
    cur = pid != null ? cats.find((c) => c.id === pid) : undefined
  }
  return parts.length ? parts.join(' / ') : '—'
}

function resolveCascadeFromCategoryId(
  catId: number | null | undefined,
  cats: CatRow[]
): { pt: string; mid: string; sub: string } {
  if (!catId) return { pt: '', mid: '', sub: '' }
  const row = cats.find((c) => c.id === catId)
  if (!row) return { pt: '', mid: '', sub: '' }
  const t = normalizeCatType(row.categoryType)
  if (t === 'subcategory') {
    const mid = cats.find((c) => c.id === row.parentId)
    const pt = mid?.parentId != null ? cats.find((c) => c.id === mid.parentId) : undefined
    return {
      pt: pt?.id != null ? String(pt.id) : '',
      mid: mid?.id != null ? String(mid.id) : '',
      sub: String(row.id),
    }
  }
  if (t === 'category') {
    const pt = row.parentId != null ? cats.find((c) => c.id === row.parentId) : undefined
    return { pt: pt?.id != null ? String(pt.id) : '', mid: String(row.id), sub: '' }
  }
  return { pt: String(row.id), mid: '', sub: '' }
}

function productUnderProductType(
  productCategoryId: number | null | undefined,
  productTypeId: number,
  cats: CatRow[]
): boolean {
  if (!productCategoryId) return false
  let cur: CatRow | undefined = cats.find((c) => c.id === productCategoryId)
  while (cur) {
    if (normalizeCatType(cur.categoryType) === 'product_type' && cur.id === productTypeId) return true
    const pid = cur.parentId
    cur = pid != null ? cats.find((c) => c.id === pid) : undefined
  }
  return false
}

function ModalShell({
  open,
  title,
  wide,
  onClose,
  children,
}: {
  open: boolean
  title: string
  wide?: boolean
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
        className={`w-full max-h-[90vh] overflow-y-auto shadow-lg ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
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

export default function ProductsPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<number | null>(null)
  const [categories, setCategories] = useState<CatRow[]>([])
  const [saving, setSaving] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formPt, setFormPt] = useState('')
  const [formMid, setFormMid] = useState('')
  const [formSub, setFormSub] = useState('')
  const [formQty, setFormQty] = useState('0')
  const [formNameAm, setFormNameAm] = useState('')
  const [formDescShort, setFormDescShort] = useState('')
  const [formDescShortAm, setFormDescShortAm] = useState('')
  const [formDescDetailed, setFormDescDetailed] = useState('')
  const [formDescDetailedAm, setFormDescDetailedAm] = useState('')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formShipFee, setFormShipFee] = useState('0')
  const [formServiceFee, setFormServiceFee] = useState('0')
  const [formLaborEst, setFormLaborEst] = useState('')
  const [formMaterialEst, setFormMaterialEst] = useState('')
  const [formFabric, setFormFabric] = useState('')
  const [formFabricAm, setFormFabricAm] = useState('')
  const [formCare, setFormCare] = useState('')
  const [formCareAm, setFormCareAm] = useState('')
  const [formDesignNotes, setFormDesignNotes] = useState('')
  const [formDesignNotesAm, setFormDesignNotesAm] = useState('')
  const [formMeas, setFormMeas] = useState('')
  const [formMeasAm, setFormMeasAm] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editSku, setEditSku] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editStatus, setEditStatus] = useState('draft')
  const [editPt, setEditPt] = useState('')
  const [editMid, setEditMid] = useState('')
  const [editSub, setEditSub] = useState('')
  const [editNameAm, setEditNameAm] = useState('')
  const [editDescShort, setEditDescShort] = useState('')
  const [editDescShortAm, setEditDescShortAm] = useState('')
  const [editDescDetailed, setEditDescDetailed] = useState('')
  const [editDescDetailedAm, setEditDescDetailedAm] = useState('')
  const [editCostPrice, setEditCostPrice] = useState('')
  const [editShipFee, setEditShipFee] = useState('0')
  const [editServiceFee, setEditServiceFee] = useState('0')
  const [editLaborEst, setEditLaborEst] = useState('')
  const [editMaterialEst, setEditMaterialEst] = useState('')
  const [editFabric, setEditFabric] = useState('')
  const [editFabricAm, setEditFabricAm] = useState('')
  const [editCare, setEditCare] = useState('')
  const [editCareAm, setEditCareAm] = useState('')
  const [editDesignNotes, setEditDesignNotes] = useState('')
  const [editDesignNotesAm, setEditDesignNotesAm] = useState('')
  const [editMeas, setEditMeas] = useState('')
  const [editMeasAm, setEditMeasAm] = useState('')

  const [viewOpen, setViewOpen] = useState(false)
  const [viewProduct, setViewProduct] = useState<ProductDetail | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiFetch('/api/products?limit=500')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load products')
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiFetch('/api/categories')
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  useEffect(() => {
    setFormMid('')
    setFormSub('')
  }, [formPt])

  useEffect(() => {
    setFormSub('')
  }, [formMid])

  const productTypeChips = useMemo(
    () => categories.filter((c) => normalizeCatType(c.categoryType) === 'product_type'),
    [categories]
  )

  const addMidOptions = useMemo(() => {
    if (!formPt) return []
    const pid = parseInt(formPt, 10)
    return categories.filter(
      (c) => normalizeCatType(c.categoryType) === 'category' && c.parentId === pid
    )
  }, [categories, formPt])

  const addSubOptions = useMemo(() => {
    if (!formMid) return []
    const mid = parseInt(formMid, 10)
    return categories.filter(
      (c) => normalizeCatType(c.categoryType) === 'subcategory' && c.parentId === mid
    )
  }, [categories, formMid])

  const editMidOptions = useMemo(() => {
    if (!editPt) return []
    const pid = parseInt(editPt, 10)
    return categories.filter(
      (c) => normalizeCatType(c.categoryType) === 'category' && c.parentId === pid
    )
  }, [categories, editPt])

  const editSubOptions = useMemo(() => {
    if (!editMid) return []
    const mid = parseInt(editMid, 10)
    return categories.filter(
      (c) => normalizeCatType(c.categoryType) === 'subcategory' && c.parentId === mid
    )
  }, [categories, editMid])

  const openAdd = () => {
    setFormName('')
    setFormSku('')
    setFormPrice('')
    setFormPt('')
    setFormMid('')
    setFormSub('')
    setFormQty('0')
    setFormNameAm('')
    setFormDescShort('')
    setFormDescShortAm('')
    setFormDescDetailed('')
    setFormDescDetailedAm('')
    setFormCostPrice('')
    setFormShipFee('0')
    setFormServiceFee('0')
    setFormLaborEst('')
    setFormMaterialEst('')
    setFormFabric('')
    setFormFabricAm('')
    setFormCare('')
    setFormCareAm('')
    setFormDesignNotes('')
    setFormDesignNotesAm('')
    setFormMeas('')
    setFormMeasAm('')
    setAddOpen(true)
  }

  const submitAdd = async () => {
    if (!formSub) {
      alert('Choose product type, category, and subcategory (e.g. Women → Clothing → Traditional cloth).')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          sku: formSku,
          basePrice: formPrice,
          categoryId: parseInt(formSub, 10),
          status: 'draft',
          initialQuantity: parseInt(formQty, 10) || 0,
          nameAm: formNameAm || null,
          descriptionShort: formDescShort || null,
          descriptionShortAm: formDescShortAm || null,
          descriptionDetailed: formDescDetailed || null,
          descriptionDetailedAm: formDescDetailedAm || null,
          costPrice: formCostPrice || null,
          defaultShippingFee: formShipFee,
          defaultServiceFee: formServiceFee,
          estimatedLaborCost: formLaborEst || null,
          estimatedMaterialCost: formMaterialEst || null,
          fabricComposition: formFabric || null,
          fabricCompositionAm: formFabricAm || null,
          careInstructions: formCare || null,
          careInstructionsAm: formCareAm || null,
          designNotes: formDesignNotes || null,
          designNotesAm: formDesignNotesAm || null,
          measurementGuideSummary: formMeas || null,
          measurementGuideSummaryAm: formMeasAm || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setAddOpen(false)
      await fetchProducts()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (p: Product) => {
    const { pt, mid, sub } = resolveCascadeFromCategoryId(p.categoryId ?? null, categories)
    setEditId(p.id)
    setEditName(p.name)
    setEditSku(p.sku)
    setEditPrice(p.price || '')
    setEditStatus(p.status || 'draft')
    setEditPt(pt)
    setEditMid(mid)
    setEditSub(sub)
    setEditNameAm(p.nameAm ?? '')
    setEditDescShort(p.descriptionShort ?? '')
    setEditDescShortAm(p.descriptionShortAm ?? '')
    setEditDescDetailed(p.descriptionDetailed ?? '')
    setEditDescDetailedAm(p.descriptionDetailedAm ?? '')
    setEditCostPrice(p.costPrice ?? '')
    setEditShipFee(p.defaultShippingFee ?? '0')
    setEditServiceFee(p.defaultServiceFee ?? '0')
    setEditLaborEst(p.estimatedLaborCost ?? '')
    setEditMaterialEst(p.estimatedMaterialCost ?? '')
    setEditFabric(p.fabricComposition ?? '')
    setEditFabricAm(p.fabricCompositionAm ?? '')
    setEditCare(p.careInstructions ?? '')
    setEditCareAm(p.careInstructionsAm ?? '')
    setEditDesignNotes(p.designNotes ?? '')
    setEditDesignNotesAm(p.designNotesAm ?? '')
    setEditMeas(p.measurementGuideSummary ?? '')
    setEditMeasAm(p.measurementGuideSummaryAm ?? '')
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (editId == null) return
    if (!editSub) {
      alert('Choose product type, category, and subcategory for this product.')
      return
    }
    setSaving(true)
    try {
      const res = await apiFetch(`/api/products/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          sku: editSku,
          basePrice: editPrice,
          status: editStatus,
          categoryId: parseInt(editSub, 10),
          nameAm: editNameAm || null,
          descriptionShort: editDescShort || null,
          descriptionShortAm: editDescShortAm || null,
          descriptionDetailed: editDescDetailed || null,
          descriptionDetailedAm: editDescDetailedAm || null,
          costPrice: editCostPrice || null,
          defaultShippingFee: editShipFee,
          defaultServiceFee: editServiceFee,
          estimatedLaborCost: editLaborEst || null,
          estimatedMaterialCost: editMaterialEst || null,
          fabricComposition: editFabric || null,
          fabricCompositionAm: editFabricAm || null,
          careInstructions: editCare || null,
          careInstructionsAm: editCareAm || null,
          designNotes: editDesignNotes || null,
          designNotesAm: editDesignNotesAm || null,
          measurementGuideSummary: editMeas || null,
          measurementGuideSummaryAm: editMeasAm || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setEditOpen(false)
      await fetchProducts()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const removeProduct = async (id: number) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      const res = await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
      await fetchProducts()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const openView = async (id: number) => {
    try {
      const res = await apiFetch(`/api/products/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Load failed')
      setViewProduct(data)
      setViewOpen(true)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to load product')
    }
  }

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      (product.nameAm && product.nameAm.toLowerCase().includes(q))
    const matchesProductType =
      !selectedProductTypeId ||
      productUnderProductType(product.categoryId, selectedProductTypeId, categories)
    return matchesSearch && matchesProductType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'draft':
        return 'warning'
      case 'archived':
        return 'default'
      case 'out_of_stock':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' }
    if (stock < 20) return { label: 'Low Stock', color: 'warning' }
    return { label: 'In Stock', color: 'success' }
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
      <ModalShell open={addOpen} wide title={t('addProduct')} onClose={() => setAddOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t('productName')}</label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('sku')}</label>
            <Input value={formSku} onChange={(e) => setFormSku(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('price')} (ETB)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="rounded-md border border-green-100 bg-green-50/50 px-3 py-2 text-xs text-gray-600">
            Assign a <strong>subcategory</strong> (product type → category → subcategory).
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Product type</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formPt}
              onChange={(e) => setFormPt(e.target.value)}
            >
              <option value="">— Select —</option>
              {productTypeChips.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formMid}
              onChange={(e) => setFormMid(e.target.value)}
              disabled={!formPt}
            >
              <option value="">— Select —</option>
              {addMidOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Subcategory</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formSub}
              onChange={(e) => setFormSub(e.target.value)}
              disabled={!formMid}
            >
              <option value="">— Select —</option>
              {addSubOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('quantity')} (initial)</label>
            <Input
              type="number"
              min="0"
              value={formQty}
              onChange={(e) => setFormQty(e.target.value)}
              className="mt-1"
            />
          </div>

          <details className="rounded-lg border border-gray-200 bg-gray-50/50 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              {t('productBilingualSection')}
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('productNameAm')}</label>
                <Input value={formNameAm} onChange={(e) => setFormNameAm(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionShort')}</label>
                <Input value={formDescShort} onChange={(e) => setFormDescShort(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionShortAm')}</label>
                <Input value={formDescShortAm} onChange={(e) => setFormDescShortAm(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionDetailed')}</label>
                <textarea
                  value={formDescDetailed}
                  onChange={(e) => setFormDescDetailed(e.target.value)}
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionDetailedAm')}</label>
                <textarea
                  value={formDescDetailedAm}
                  onChange={(e) => setFormDescDetailedAm(e.target.value)}
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </details>

          <details className="rounded-lg border border-gray-200 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              {t('productFeesSection')} ({t('currencyETB')})
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('defaultShippingFee')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formShipFee}
                  onChange={(e) => setFormShipFee(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('defaultServiceFee')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formServiceFee}
                  onChange={(e) => setFormServiceFee(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </details>

          <details className="rounded-lg border border-gray-200 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">{t('productGarmentSection')}</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('fabricComposition')}</label>
                <Input value={formFabric} onChange={(e) => setFormFabric(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('fabricCompositionAm')}</label>
                <Input value={formFabricAm} onChange={(e) => setFormFabricAm(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('careInstructions')}</label>
                <textarea
                  value={formCare}
                  onChange={(e) => setFormCare(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('careInstructionsAm')}</label>
                <textarea
                  value={formCareAm}
                  onChange={(e) => setFormCareAm(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('designNotes')}</label>
                <textarea
                  value={formDesignNotes}
                  onChange={(e) => setFormDesignNotes(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('designNotesAm')}</label>
                <textarea
                  value={formDesignNotesAm}
                  onChange={(e) => setFormDesignNotesAm(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('measurementGuide')}</label>
                <Input value={formMeas} onChange={(e) => setFormMeas(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('measurementGuideAm')}</label>
                <Input value={formMeasAm} onChange={(e) => setFormMeasAm(e.target.value)} className="mt-1" />
              </div>
            </div>
          </details>

          <details className="rounded-lg border border-amber-200 bg-amber-50/30 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">{t('productPnLSection')}</summary>
            <p className="mt-2 text-xs text-gray-600">{t('pnlDisclaimer')}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('costPrice')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('estimatedMaterialCost')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formMaterialEst}
                  onChange={(e) => setFormMaterialEst(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('estimatedLaborCost')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formLaborEst}
                  onChange={(e) => setFormLaborEst(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              type="button"
              disabled={saving}
              onClick={submitAdd}
            >
              {saving ? '…' : 'Save'}
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={editOpen} wide title="Edit product" onClose={() => setEditOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">{t('productName')}</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('sku')}</label>
            <Input value={editSku} onChange={(e) => setEditSku(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('price')} (ETB)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('status')}</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              {['draft', 'active', 'archived', 'out_of_stock'].map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Product type</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editPt}
              onChange={(e) => {
                setEditPt(e.target.value)
                setEditMid('')
                setEditSub('')
              }}
            >
              <option value="">— Select —</option>
              {productTypeChips.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editMid}
              onChange={(e) => {
                setEditMid(e.target.value)
                setEditSub('')
              }}
              disabled={!editPt}
            >
              <option value="">— Select —</option>
              {editMidOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Subcategory</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editSub}
              onChange={(e) => setEditSub(e.target.value)}
              disabled={!editMid}
            >
              <option value="">— Select —</option>
              {editSubOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <details className="rounded-lg border border-gray-200 bg-gray-50/50 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              {t('productBilingualSection')}
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('productNameAm')}</label>
                <Input value={editNameAm} onChange={(e) => setEditNameAm(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionShort')}</label>
                <Input value={editDescShort} onChange={(e) => setEditDescShort(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionShortAm')}</label>
                <Input value={editDescShortAm} onChange={(e) => setEditDescShortAm(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionDetailed')}</label>
                <textarea
                  value={editDescDetailed}
                  onChange={(e) => setEditDescDetailed(e.target.value)}
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('descriptionDetailedAm')}</label>
                <textarea
                  value={editDescDetailedAm}
                  onChange={(e) => setEditDescDetailedAm(e.target.value)}
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </details>

          <details className="rounded-lg border border-gray-200 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              {t('productFeesSection')} ({t('currencyETB')})
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('defaultShippingFee')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editShipFee}
                  onChange={(e) => setEditShipFee(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('defaultServiceFee')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editServiceFee}
                  onChange={(e) => setEditServiceFee(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </details>

          <details className="rounded-lg border border-gray-200 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">{t('productGarmentSection')}</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('fabricComposition')}</label>
                <Input value={editFabric} onChange={(e) => setEditFabric(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('fabricCompositionAm')}</label>
                <Input value={editFabricAm} onChange={(e) => setEditFabricAm(e.target.value)} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('careInstructions')}</label>
                <textarea
                  value={editCare}
                  onChange={(e) => setEditCare(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('careInstructionsAm')}</label>
                <textarea
                  value={editCareAm}
                  onChange={(e) => setEditCareAm(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('designNotes')}</label>
                <textarea
                  value={editDesignNotes}
                  onChange={(e) => setEditDesignNotes(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">{t('designNotesAm')}</label>
                <textarea
                  value={editDesignNotesAm}
                  onChange={(e) => setEditDesignNotesAm(e.target.value)}
                  className="mt-1 flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('measurementGuide')}</label>
                <Input value={editMeas} onChange={(e) => setEditMeas(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('measurementGuideAm')}</label>
                <Input value={editMeasAm} onChange={(e) => setEditMeasAm(e.target.value)} className="mt-1" />
              </div>
            </div>
          </details>

          <details className="rounded-lg border border-amber-200 bg-amber-50/30 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">{t('productPnLSection')}</summary>
            <p className="mt-2 text-xs text-gray-600">{t('pnlDisclaimer')}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('costPrice')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('estimatedMaterialCost')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editMaterialEst}
                  onChange={(e) => setEditMaterialEst(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('estimatedLaborCost')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editLaborEst}
                  onChange={(e) => setEditLaborEst(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              type="button"
              disabled={saving}
              onClick={submitEdit}
            >
              {saving ? '…' : 'Update'}
            </Button>
          </div>
        </div>
      </ModalShell>

      <ModalShell open={viewOpen} wide title={t('productDetails')} onClose={() => setViewOpen(false)}>
        {viewProduct && (
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <p>
                <span className="font-medium text-gray-700">{t('productName')}: </span>
                {viewProduct.name}
              </p>
              {viewProduct.nameAm && (
                <p>
                  <span className="font-medium text-gray-700">{t('productNameAm')}: </span>
                  {viewProduct.nameAm}
                </p>
              )}
            </div>
            <p>
              <span className="font-medium text-gray-700">{t('sku')}: </span>
              {viewProduct.sku}
            </p>
            <p>
              <span className="font-medium text-gray-700">{t('status')}: </span>
              {viewProduct.status}
            </p>
            <p>
              <span className="font-medium text-gray-700">{t('category')}: </span>
              {formatCategoryBreadcrumb(viewProduct.categoryId ?? null, categories)}
            </p>
            <div className="rounded-md border bg-gray-50 p-3 space-y-1">
              <p className="font-semibold text-gray-800">{t('profitAndLoss')}</p>
              <p className="text-xs text-gray-600">{t('pnlDisclaimer')}</p>
              {(() => {
                const m = computeProductMarginPreview({
                  basePrice: decimalStringToNumber(viewProduct.basePrice ?? viewProduct.price),
                  costPrice: decimalStringToNumber(viewProduct.costPrice),
                  defaultShippingFee: decimalStringToNumber(viewProduct.defaultShippingFee),
                  defaultServiceFee: decimalStringToNumber(viewProduct.defaultServiceFee),
                  estimatedLaborCost: decimalStringToNumber(viewProduct.estimatedLaborCost),
                  estimatedMaterialCost: decimalStringToNumber(viewProduct.estimatedMaterialCost),
                })
                return (
                  <ul className="mt-2 space-y-1 text-gray-800">
                    <li>
                      {t('price')}: {t('currencyETB')} {m.sellingPrice.toFixed(2)}
                    </li>
                    <li>
                      {t('cogsShort')}: {t('currencyETB')} {m.cogs.toFixed(2)}
                    </li>
                    <li>
                      {t('feesShort')}: {t('currencyETB')} {m.fees.toFixed(2)}
                    </li>
                    <li className="font-semibold">
                      {t('estimatedProfit')}: {t('currencyETB')} {m.estimatedProfit.toFixed(2)} (
                      {m.marginPercent.toFixed(1)}% {t('marginPercent')})
                    </li>
                  </ul>
                )
              })()}
            </div>
            {viewProduct.descriptionShort && (
              <p className="text-gray-700">
                <span className="font-medium">{t('descriptionShort')}: </span>
                {viewProduct.descriptionShort}
              </p>
            )}
            {viewProduct.descriptionShortAm && (
              <p className="text-gray-700">
                <span className="font-medium">{t('descriptionShortAm')}: </span>
                {viewProduct.descriptionShortAm}
              </p>
            )}
            {viewProduct.fabricComposition && (
              <p>
                <span className="font-medium text-gray-700">{t('fabricComposition')}: </span>
                {viewProduct.fabricComposition}
              </p>
            )}
          </div>
        )}
      </ModalShell>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="mr-3 text-green-600" size={32} />
            {t('navProducts')}
          </h1>
          <p className="text-gray-500 mt-1">Manage your product catalog and inventory</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <Download className="mr-2" size={18} />
            {t('export')}
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" type="button" onClick={openAdd}>
            <Plus className="mr-2" size={18} />
            {t('addProduct')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('totalProducts')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Package className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-600 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('active')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products.filter((p) => p.status === 'active').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <svg
                  className="text-yellow-600"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-700 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('lowStock')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {
                    products.filter((p) => {
                      const q = p.inventory?.quantity ?? 0
                      return q > 0 && q < 20
                    }).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg
                  className="text-green-700"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('outOfStock')}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products.filter((p) => !p.inventory || p.inventory.quantity === 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <svg
                  className="text-red-600"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
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

            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedProductTypeId === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProductTypeId(null)}
                className="whitespace-nowrap"
              >
                All
              </Button>
              {productTypeChips.map((pt) => (
                <Button
                  key={pt.id}
                  variant={selectedProductTypeId === pt.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedProductTypeId(pt.id)}
                  className="whitespace-nowrap"
                >
                  {pt.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {t('navProducts')} ({filteredProducts.length})
            </span>
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
                <TableHead>{t('productName')}</TableHead>
                <TableHead>{t('sku')}</TableHead>
                <TableHead>{t('category')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead>{t('estimatedProfit')}</TableHead>
                <TableHead>{t('marginPercent')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stock = product.inventory?.quantity ?? 0
                const stockStatus = getStockStatus(stock)
                const m = marginFromProductRow(product)
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="text-gray-400" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-gray-600">{product.sku}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-800 leading-snug">
                        {formatCategoryBreadcrumb(product.categoryId ?? null, categories)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {t('currencyETB')} {product.price}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          m.estimatedProfit < 0
                            ? 'font-semibold text-red-600'
                            : 'font-semibold text-green-700'
                        }
                      >
                        {t('currencyETB')} {m.estimatedProfit.toFixed(0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">{m.marginPercent.toFixed(0)}%</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{stock}</span>
                        <Badge variant={stockStatus.color as BadgeProps['variant']} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(product.status) as BadgeProps['variant']}>
                        {product.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="icon" type="button" onClick={() => openView(product.id)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(product)}>
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-600"
                          type="button"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">{t('noData')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
