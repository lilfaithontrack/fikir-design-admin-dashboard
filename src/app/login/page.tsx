'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogIn, Eye, EyeOff, Package, TrendingUp, Users, ShoppingCart, Globe, Sparkles, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [language, setLanguage] = useState<'en' | 'am'>('en')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Sign in failed')
        return
      }
      const dest = searchParams.get('from') || '/dashboard'
      router.push(dest.startsWith('/') ? dest : '/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const translations = {
    en: {
      welcome: 'Welcome Back',
      subtitle: 'Sign in with your staff username',
      brandTitle: 'Fikir Design',
      brandSubtitle: 'Admin Dashboard',
      description:
        'Manage your inventory, orders, and customers with our powerful Ethiopian-inspired platform.',
      username: 'Username',
      password: 'Password',
      signIn: 'Sign In',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember me',
      hint: 'Use the username created by your manager. Default seed account: admin / admin123',
      features: [
        { icon: Package, title: 'Product Management', desc: 'Track inventory in real-time' },
        { icon: ShoppingCart, title: 'Order Processing', desc: 'Streamline your workflow' },
        { icon: Users, title: 'Customer Insights', desc: 'Build lasting relationships' },
        { icon: TrendingUp, title: 'Analytics & Reports', desc: 'Data-driven decisions' },
      ],
    },
    am: {
      welcome: 'እንኳን ደህና መጡ',
      subtitle: 'በሰራተኛዎ ስም ይግቡ',
      brandTitle: 'ፍቅር ዲዛይን',
      brandSubtitle: 'የአስተዳደር ዳሽቦርድ',
      description:
        'በኢትዮጵያ ተመስጦ በተሰራው ኃይለኛ መድረካችን ክምችትዎን፣ ትዕዛዞችዎን እና ደንበኞችዎን ያስተዳድሩ።',
      username: 'የተጠቃሚ ስም',
      password: 'የይለፍ ቃል',
      signIn: 'ግባ',
      forgotPassword: 'የይለፍ ቃል ረሱ?',
      rememberMe: 'አስታውሰኝ',
      hint: 'የእርስዎን አስተዳዳሪ የፈጠረውን የተጠቃሚ ስም ይጠቀሙ።',
      features: [
        { icon: Package, title: 'የምርት አስተዳደር', desc: 'ክምችትን በእውነተኛ ጊዜ ይከታተሉ' },
        { icon: ShoppingCart, title: 'የትዕዛዝ ሂደት', desc: 'የስራ ፍሰትዎን ያመቻቹ' },
        { icon: Users, title: 'የደንበኛ ግንዛቤዎች', desc: 'ዘላቂ ግንኙነቶችን ይገንቡ' },
        { icon: TrendingUp, title: 'ትንታኔዎች እና ሪፖርቶች', desc: 'በመረጃ ላይ የተመሰረቱ ውሳኔዎች' },
      ],
    },
  }

  const t = translations[language]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="fixed top-0 left-0 right-0 h-1 flex z-50">
        <div className="flex-1 bg-primary"></div>
        <div className="flex-1 bg-secondary"></div>
        <div className="flex-1 bg-accent"></div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-3xl font-bold text-primary">FD</span>
            </div>
            <div>
              <h1 className={`text-3xl font-bold text-white ${language === 'am' ? 'font-amharic' : ''}`}>
                {t.brandTitle}
              </h1>
              <p className="text-primary-100 text-sm">{t.brandSubtitle}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className={`text-4xl font-bold text-white leading-tight ${language === 'am' ? 'font-amharic' : ''}`}>
              {t.welcome}
            </h2>
            <p className={`text-lg text-primary-100 max-w-md ${language === 'am' ? 'font-amharic' : ''}`}>
              {t.description}
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {t.features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Icon className="text-white mb-3" size={24} />
                <h3 className={`text-white font-semibold mb-1 text-sm ${language === 'am' ? 'font-amharic' : ''}`}>
                  {feature.title}
                </h3>
                <p className={`text-primary-100 text-xs ${language === 'am' ? 'font-amharic' : ''}`}>{feature.desc}</p>
              </div>
            )
          })}
        </div>

        <div className="relative z-10 text-primary-100 text-sm">© 2024 Fikir Design. All rights reserved.</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-gray-50 relative">
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-600 rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <span className="text-2xl font-bold text-white">FD</span>
          </div>
          <h1 className={`text-xl font-bold text-gray-900 ${language === 'am' ? 'font-amharic' : ''}`}>{t.brandTitle}</h1>
        </div>

        <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
            className="font-amharic shadow-sm"
          >
            <Globe className="mr-2" size={16} />
            {language === 'en' ? 'አማርኛ' : 'English'}
          </Button>
        </div>

        <div className="w-full max-w-md mt-24 lg:mt-0">
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="text-primary" size={24} />
                <h2 className={`text-2xl sm:text-3xl font-bold text-gray-900 ${language === 'am' ? 'font-amharic' : ''}`}>
                  {t.welcome}
                </h2>
              </div>
              <p className={`text-gray-600 ${language === 'am' ? 'font-amharic' : ''}`}>{t.subtitle}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
              )}

              <div className="space-y-2">
                <label className={`text-sm font-semibold text-gray-700 ${language === 'am' ? 'font-amharic' : ''}`}>
                  {t.username}
                </label>
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-semibold text-gray-700 ${language === 'am' ? 'font-amharic' : ''}`}>
                  {t.password}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span
                    className={`text-sm text-gray-600 group-hover:text-gray-900 transition-colors ${
                      language === 'am' ? 'font-amharic' : ''
                    }`}
                  >
                    {t.rememberMe}
                  </span>
                </label>
                <a
                  href="#"
                  className={`text-sm font-semibold text-primary hover:text-primary-600 transition-colors ${
                    language === 'am' ? 'font-amharic' : ''
                  }`}
                >
                  {t.forgotPassword}
                </a>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold" size="lg" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 animate-spin" size={20} />
                ) : (
                  <LogIn className="mr-2" size={20} />
                )}
                <span className={language === 'am' ? 'font-amharic' : ''}>{t.signIn}</span>
              </Button>

              <div className="mt-4 p-4 bg-gradient-to-r from-secondary-50 to-primary-50 border border-secondary-200 rounded-lg">
                <p className={`text-xs text-center text-gray-700 ${language === 'am' ? 'font-amharic' : ''}`}>{t.hint}</p>
              </div>
            </form>
          </div>

          <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
            {t.features.slice(0, 4).map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <Icon className="text-primary mb-2" size={20} />
                  <h3 className={`text-gray-900 font-semibold text-xs mb-1 ${language === 'am' ? 'font-amharic' : ''}`}>
                    {feature.title}
                  </h3>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
