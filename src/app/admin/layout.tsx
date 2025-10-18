// Admin Layout for authentication protection
'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAdminSession } from '@/features/admin/api'
import Script from 'next/script'
import AdminLayout from '@/features/admin/components/AdminLayout'

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const hasCheckedAuth = useRef(false)

  useEffect(() => {
    // Check authentication ONLY on mount, not on every navigation
    if (hasCheckedAuth.current) return

    const checkAuth = () => {
      const session = getAdminSession()
      const isLoginPage = pathname === '/admin/login'

      if (!session && !isLoginPage) {
        router.push('/admin/login')
      } else if (session && isLoginPage) {
        router.push('/admin')
      }

      hasCheckedAuth.current = true
    }

    // Small delay to allow session to be saved after login
    const timer = setTimeout(checkAuth, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [router, pathname])

  // Don't render AdminLayout for login page
  const isLoginPage = pathname === '/admin/login'

  return (
    <>
      <Script
        id="admin-dark-theme"
        strategy="beforeInteractive"
      >
        {`document.documentElement.classList.add('dark');`}
      </Script>
      {isLoginPage ? children : <AdminLayout>{children}</AdminLayout>}
    </>
  )
}