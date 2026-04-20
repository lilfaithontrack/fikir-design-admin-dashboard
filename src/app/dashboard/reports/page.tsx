'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, DollarSign, ShoppingCart, Package, Users, TrendingUp, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ReportStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  ordersByStatus: Record<string, number>
}

export default function ReportsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    ordersByStatus: {},
  })

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch('/api/orders?limit=1000'),
        fetch('/api/products?limit=1'),
        fetch('/api/customers?limit=1'),
      ])

      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()
      const customersData = await customersRes.json()

      const orders = ordersData.orders || []
      const revenue = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)

      const ordersByStatus: Record<string, number> = {}
      orders.forEach((o: any) => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
      })

      setStats({
        totalRevenue: revenue,
        totalOrders: ordersData.pagination?.total || orders.length,
        totalProducts: productsData.pagination?.total || 0,
        totalCustomers: customersData.pagination?.total || 0,
        ordersByStatus,
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    design_in_progress: 'bg-blue-500',
    sewing_in_progress: 'bg-purple-500',
    delivered: 'bg-green-600',
    cancelled: 'bg-red-500',
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="mr-3 text-green-600" size={28} />
          {t('navReports')}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Business analytics overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-t-4 border-t-yellow-500 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('revenue')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">ETB {stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <DollarSign className="text-yellow-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-600 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('totalOrders')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-green-600" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-700 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('totalProducts')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Package className="text-green-700" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('totalCustomers')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <Users className="text-red-500" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Status */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="text-green-600" size={20} />
            <span>Orders by Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.ordersByStatus).length === 0 ? (
            <p className="text-gray-400 text-center py-8">{t('noData')}</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                const total = stats.totalOrders || 1
                const percentage = ((count / total) * 100).toFixed(1)
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">{status.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-gray-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-green-600">
                ETB {stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">Per order average</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Revenue per Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-yellow-600">
                ETB {stats.totalCustomers > 0 ? Math.round(stats.totalRevenue / stats.totalCustomers).toLocaleString() : 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">Average customer value</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
