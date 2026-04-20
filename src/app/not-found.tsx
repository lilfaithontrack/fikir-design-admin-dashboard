'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      {/* Ethiopian Flag Accent */}
      <div className="fixed top-0 left-0 right-0 h-2 flex">
        <div className="flex-1 bg-primary"></div>
        <div className="flex-1 bg-secondary"></div>
        <div className="flex-1 bg-accent"></div>
      </div>

      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-[200px] font-bold text-gray-200 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <Package className="text-white" size={64} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Page Not Found
          </h1>
          <p className="text-xl text-gray-600 font-amharic">
            ገጹ አልተገኘም
          </p>
          <p className="text-gray-500 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="mr-2" size={20} />
              Go to Dashboard
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2" size={20} />
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-t-primary">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
            <Search className="mr-2 text-primary" size={20} />
            Quick Links
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/dashboard/products" 
              className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary-50 transition-all group"
            >
              <Package className="mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" size={24} />
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary">Products</span>
            </Link>
            <Link 
              href="/dashboard/orders" 
              className="p-4 rounded-lg border-2 border-gray-200 hover:border-secondary hover:bg-secondary-50 transition-all group"
            >
              <svg className="mx-auto mb-2 text-secondary-foreground group-hover:scale-110 transition-transform" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-secondary-foreground">Orders</span>
            </Link>
            <Link 
              href="/dashboard/inventory" 
              className="p-4 rounded-lg border-2 border-gray-200 hover:border-info hover:bg-blue-50 transition-all group"
            >
              <svg className="mx-auto mb-2 text-info group-hover:scale-110 transition-transform" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-info">Inventory</span>
            </Link>
            <Link 
              href="/dashboard/customers" 
              className="p-4 rounded-lg border-2 border-gray-200 hover:border-accent hover:bg-accent-50 transition-all group"
            >
              <svg className="mx-auto mb-2 text-accent group-hover:scale-110 transition-transform" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-accent">Customers</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Contact support at <a href="mailto:support@fikirdesign.com" className="text-primary hover:underline">support@fikirdesign.com</a></p>
        </div>
      </div>
    </div>
  )
}
