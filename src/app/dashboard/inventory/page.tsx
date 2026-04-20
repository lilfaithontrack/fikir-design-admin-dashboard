'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Filter, Download, AlertTriangle, Package, Warehouse, TrendingDown, RefreshCw, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiFetch } from '@/lib/api-fetch'

interface InventoryItem {
  id: number
  quantity: number
  lowStockThreshold: number
  updatedAt: string
  product: {
    id: number
    name: string
    sku: string
  }
}

export default function InventoryPage() {
  const { t } = useLanguage()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchInventory = useCallback(async () => {
    try {
      const response = await apiFetch('/api/inventory')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to load inventory')
      setInventory(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const restockItem = async (item: InventoryItem) => {
    const raw = window.prompt(`New quantity for ${item.product?.name ?? 'item'}`, String(item.quantity))
    if (raw === null) return
    const qty = parseInt(raw, 10)
    if (Number.isNaN(qty) || qty < 0) {
      alert('Enter a valid non-negative integer')
      return
    }
    try {
      const res = await apiFetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, quantity: qty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      await fetchInventory()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Failed to update stock')
    }
  }

  const getItemStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return 'out_of_stock'
    if (item.quantity <= (item.lowStockThreshold || 10)) return 'low_stock'
    return 'in_stock'
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    const itemStatus = getItemStatus(item)
    const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success'
      case 'low_stock': return 'warning'
      case 'out_of_stock': return 'error'
      default: return 'outline'
    }
  }

  const stats = {
    total: inventory.length,
    inStock: inventory.filter(i => getItemStatus(i) === 'in_stock').length,
    lowStock: inventory.filter(i => getItemStatus(i) === 'low_stock').length,
    outOfStock: inventory.filter(i => getItemStatus(i) === 'out_of_stock').length,
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <Warehouse className="mr-3 text-green-600" size={28} />
            {t('navInventory')}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Monitor and manage stock levels</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" onClick={fetchInventory}>
            <RefreshCw className="mr-2" size={18} />
            {t('refresh')}
          </Button>
          <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            <Download className="mr-2" size={18} />
            {t('export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Package className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-700 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('inStock')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.inStock}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="text-green-700" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('lowStock')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.lowStock}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-yellow-500" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('outOfStock')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.outOfStock}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown className="text-red-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder={t('search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {['all', 'in_stock', 'low_stock', 'out_of_stock'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={`whitespace-nowrap capitalize ${statusFilter === status ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('navInventory')} ({filteredInventory.length})</span>
            <Button variant="ghost" size="sm">
              <Filter className="mr-2" size={16} />
              {t('filter')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('productName')}</TableHead>
                  <TableHead>{t('sku')}</TableHead>
                  <TableHead>{t('quantity')}</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const status = getItemStatus(item)
                  const threshold = item.lowStockThreshold || 10
                  const percentage = Math.min((item.quantity / (threshold * 3)) * 100, 100)

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="text-gray-400" size={18} />
                          </div>
                          <p className="font-medium text-gray-900">{item.product?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-gray-600">{item.product?.sku}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">{item.quantity}</span>
                          {status === 'low_stock' && <AlertTriangle className="text-yellow-500" size={14} />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 w-24">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status === 'in_stock' ? 'bg-green-600' :
                                status === 'low_stock' ? 'bg-yellow-500' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{threshold}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(status) as any} className="capitalize">
                          {status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{new Date(item.updatedAt).toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                          onClick={() => restockItem(item)}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Warehouse className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">{t('noData')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{t('lowStock')}</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">{stats.lowStock}</span> items running low.
                </p>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => setStatusFilter('low_stock')}>
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
