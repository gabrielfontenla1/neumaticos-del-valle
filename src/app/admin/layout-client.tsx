// Admin Layout Client Component
'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import AdminLayout from '@/features/admin/components/AdminLayout'

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

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
