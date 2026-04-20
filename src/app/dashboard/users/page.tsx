'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route: staff management lives under /dashboard/staff */
export default function UsersRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/staff')
  }, [router])
  return null
}
