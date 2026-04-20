'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  revenue: number
}

interface RecentOrder {
  id: number
  orderNumber: string
  status: string
  total: number
  createdAt: string
  customer?: { firstName: string; lastName: string }
}

interface LowStockItem {
  id: number
  quantity: number
  lowStockThreshold: number
  product: { name: string }
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, totalOrders: 0, totalCustomers: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [productsRes, ordersRes, customersRes, inventoryRes] = await Promise.all([
        fetch('/api/products?limit=1'),
        fetch('/api/orders?limit=5'),
        fetch('/api/customers?limit=1'),
        fetch('/api/inventory'),
      ])

      const productsData = await productsRes.json()
      const ordersData = await ordersRes.json()
      const customersData = await customersRes.json()
      const inventoryData = await inventoryRes.json()

      const allOrders = ordersData.orders || []
      const revenue = allOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)

      setStats({
        totalProducts: productsData.pagination?.total || 0,
        totalOrders: ordersData.pagination?.total || 0,
        totalCustomers: customersData.pagination?.total || 0,
        revenue,
      })

      setRecentOrders(allOrders.slice(0, 5))

      const inv = Array.isArray(inventoryData) ? inventoryData : []
      setLowStock(inv.filter((item: any) => item.quantity <= (item.lowStockThreshold || 10)).slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <p className="text-gray-500 mt-1 text-sm">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-t-4 border-t-yellow-500 bg-white shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-500">{t('revenue')}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">ETB {stats.revenue.toLocaleString()}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('recentOrders')}</span>
              <Link href="/dashboard/orders" className="text-sm text-green-600 hover:underline font-normal">
                {t('view')} →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">{t('noData')}</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-green-700 text-sm">{order.orderNumber}</span>
                        <Badge
                          variant={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'pending' ? 'warning' :
                            order.status === 'cancelled' ? 'error' :
                            'default'
                          }
                          className="text-xs"
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">ETB {Number(order.total).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-l-4 border-l-red-600 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="text-red-600" size={18} />
              <span>{t('lowStock')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">All stocked up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lowStock.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{item.product?.name}</span>
                      <span className="text-sm text-red-600 font-semibold">{item.quantity} left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${Math.min((item.quantity / (item.lowStockThreshold || 10)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/products" className="p-4 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors text-center block">
              <Package className="mx-auto text-green-600 mb-2" size={24} />
              <span className="text-sm font-medium text-gray-900">{t('addProduct')}</span>
            </Link>
            <Link href="/dashboard/orders" className="p-4 border-2 border-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors text-center block">
              <ShoppingCart className="mx-auto text-yellow-600 mb-2" size={24} />
              <span className="text-sm font-medium text-gray-900">{t('addOrder')}</span>
            </Link>
            <Link href="/dashboard/customers" className="p-4 border-2 border-green-700 rounded-lg hover:bg-green-50 transition-colors text-center block">
              <Users className="mx-auto text-green-700 mb-2" size={24} />
              <span className="text-sm font-medium text-gray-900">{t('addCustomer')}</span>
            </Link>
            <Link href="/dashboard/reports" className="p-4 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors text-center block">
              <CheckCircle className="mx-auto text-red-600 mb-2" size={24} />
              <span className="text-sm font-medium text-gray-900">{t('navReports')}</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
