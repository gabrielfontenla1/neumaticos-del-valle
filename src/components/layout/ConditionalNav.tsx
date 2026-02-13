'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from '@/components/home/Footer'
import { ReactNode } from 'react'

interface ConditionalLayoutProps {
  children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Don't show navigation components on admin, system, or legal pages
  const isAdminRoute = pathname.startsWith('/admin')
  const isSysRoute = pathname.startsWith('/sys/')
  const isLegalRoute = pathname === '/privacidad' || pathname === '/terminos'

  if (isAdminRoute || isSysRoute || isLegalRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
    </>
  )
}
