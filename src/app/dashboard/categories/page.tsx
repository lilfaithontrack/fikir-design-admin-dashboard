'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, FolderTree, Edit, Trash2, Loader2, ChevronRight, FolderOpen } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiFetch } from '@/lib/api-fetch'

type CategoryTypeValue = 'product_type' | 'category' | 'subcategory'

interface Category {
  id: number
  name: string
  nameAm?: string
  slug: string
  description?: string
  level: number
  isActive: boolean
  parentId?: number | null
  categoryType?: CategoryTypeValue | string
  parent?: { name: string }
  children?: Category[]
  _count?: { products: number }
}

const TYPE_ORDER: CategoryTypeValue[] = ['product_type', 'category', 'subcategory']

const TYPE_LABEL: Record<CategoryTypeValue, string> = {
  product_type: 'Product type',
  category: 'Category',
  subcategory: 'Subcategory',
}

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

function normalizeType(t: string | undefined): CategoryTypeValue {
  if (t === 'product_type' || t === 'category' || t === 'subcategory') return t
  return 'subcategory'
}

export default function CategoriesPage() {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [cname, setCname] = useState('')
  const [cslug, setCslug] = useState('')
  const [ctype, setCtype] = useState<CategoryTypeValue>('product_type')
  const [cparent, setCparent] = useState<string>('')

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editRowType, setEditRowType] = useState<CategoryTypeValue>('subcategory')
  const [ename, setEname] = useState('')
  const [eslug, setEslug] = useState('')
  const [eactive, setEactive] = useState(true)
  const [eparent, setEparent] = useState<string>('')

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiFetch('/api/categories')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load')
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    setCparent('')
  }, [ctype])

  const addParentOptions = useMemo(() => {
    if (ctype === 'product_type') return []
    if (ctype === 'category') {
      return categories.filter((c) => normalizeType(c.categoryType) === 'product_type')
    }
    return categories.filter((c) => normalizeType(c.categoryType) === 'category')
  }, [categories, ctype])

  const editParentOptions = useMemo(() => {
    if (editId == null) return []
    if (editRowType === 'product_type') return []
    if (editRowType === 'category') {
      return categories.filter(
        (c) => normalizeType(c.categoryType) === 'product_type' && c.id !== editId
      )
    }
    return categories.filter(
      (c) => normalizeType(c.categoryType) === 'category' && c.id !== editId
    )
  }, [categories, editId, editRowType])

  const submitAdd = async () => {
    setSaving(true)
    try {
      const parentPayload =
        ctype === 'product_type' ? null : cparent ? parseInt(cparent, 10) : null

      const res = await apiFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cname.trim(),
          slug: cslug.trim() || undefined,
          categoryType: ctype,
          parentId: parentPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setAddOpen(false)
      setCname('')
      setCslug('')
      setCtype('product_type')
      setCparent('')
      await fetchCategories()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (c: Category) => {
    const nt = normalizeType(c.categoryType)
    setEditId(c.id)
    setEditRowType(nt)
    setEname(c.name)
    setEslug(c.slug)
    setEactive(c.isActive)
    setEparent(c.parentId != null ? String(c.parentId) : '')
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (editId == null) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        id: editId,
        name: ename.trim(),
        slug: eslug.trim(),
        isActive: eactive,
      }
      if (editRowType !== 'product_type') {
        body.parentId = eparent === '' ? null : parseInt(eparent, 10)
      }

      const res = await apiFetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setEditOpen(false)
      await fetchCategories()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async (id: number) => {
    if (!confirm('Delete this category? It must have no products or child categories.')) return
    try {
      const res = await apiFetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      await fetchCategories()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.nameAm && cat.nameAm.includes(searchQuery))
  )

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.isActive).length,
    productTypes: categories.filter((c) => normalizeType(c.categoryType) === 'product_type').length,
    categories: categories.filter((c) => normalizeType(c.categoryType) === 'category').length,
    subcategories: categories.filter((c) => normalizeType(c.categoryType) === 'subcategory').length,
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
      <ModalShell open={addOpen} title={t('addCategory')} onClose={() => setAddOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 rounded-md bg-green-50 border border-green-100 px-3 py-2">
            Structure: <strong>Product type</strong> (e.g. Women) → <strong>Category</strong> (e.g.
            Clothing) → <strong>Subcategory</strong> (e.g. Traditional cloth).
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700">Level</label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={ctype}
              onChange={(e) => setCtype(e.target.value as CategoryTypeValue)}
            >
              {TYPE_ORDER.map((x) => (
                <option key={x} value={x}>
                  {TYPE_LABEL[x]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('categoryName')}</label>
            <Input value={cname} onChange={(e) => setCname(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Slug (optional)</label>
            <Input
              value={cslug}
              onChange={(e) => setCslug(e.target.value)}
              className="mt-1"
              placeholder="auto from name"
            />
          </div>
          {ctype !== 'product_type' && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                {ctype === 'category' ? 'Under product type' : 'Under category'}
              </label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={cparent}
                onChange={(e) => setCparent(e.target.value)}
              >
                <option value="">— Select —</option>
                {addParentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      <ModalShell open={editOpen} title="Edit category" onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium text-gray-500">Level</span>
            <p className="text-sm font-semibold text-gray-900">{TYPE_LABEL[editRowType]}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('categoryName')}</label>
            <Input value={ename} onChange={(e) => setEname(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Slug</label>
            <Input value={eslug} onChange={(e) => setEslug(e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="cat-active"
              type="checkbox"
              checked={eactive}
              onChange={(e) => setEactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="cat-active" className="text-sm font-medium text-gray-700">
              {t('active')}
            </label>
          </div>
          {editRowType !== 'product_type' && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                {editRowType === 'category' ? 'Product type' : 'Category'}
              </label>
              <select
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={eparent}
                onChange={(e) => setEparent(e.target.value)}
              >
                <option value="">— None —</option>
                {editParentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <FolderTree className="mr-3 text-green-600" size={28} />
            {t('navCategories')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm max-w-2xl">
            Use three levels: product type → category → subcategory. Example: Women → Clothing →
            Traditional cloth.
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" type="button" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2" size={18} />
          {t('addCategory')}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <p className="text-xs md:text-sm font-medium text-gray-500">Total</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <p className="text-xs md:text-sm font-medium text-gray-500">{t('active')}</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-700 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <p className="text-xs md:text-sm font-medium text-gray-500">Product types</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.productTypes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <p className="text-xs md:text-sm font-medium text-gray-500">Categories / Sub</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">
              {stats.categories} / {stats.subcategories}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder={t('search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>
            {t('navCategories')} ({filteredCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categoryName')}</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amharic</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category) => {
                  const nt = normalizeType(category.categoryType)
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            {category.parentId ? (
                              <ChevronRight className="text-green-600" size={16} />
                            ) : (
                              <FolderOpen className="text-green-600" size={16} />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {TYPE_LABEL[nt]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{category.nameAm || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {category.level}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{category.parent?.name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{category._count?.products || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(category.isActive ? 'success' : 'outline') as BadgeProps['variant']}>
                          {category.isActive ? t('active') : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button variant="ghost" size="icon" type="button" onClick={() => openEdit(category)}>
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-600"
                            type="button"
                            onClick={() => removeCategory(category.id)}
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
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <FolderTree className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">{t('noData')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
