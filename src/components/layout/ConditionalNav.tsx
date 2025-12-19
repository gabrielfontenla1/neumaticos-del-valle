'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { ReactNode } from 'react'

interface ConditionalLayoutProps {
  children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Don't show navigation components on admin or system pages
  const isAdminRoute = pathname.startsWith('/admin')
  const isSysRoute = pathname.startsWith('/sys/')

  if (isAdminRoute || isSysRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </>
  )
}
