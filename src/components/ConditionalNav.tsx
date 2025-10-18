'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { CartButton, MobileCartBar } from './CartButton'
import { QuickCheckout } from '@/features/checkout/components/QuickCheckout'
import { ReactNode } from 'react'

interface ConditionalLayoutProps {
  children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Don't show navigation components on admin pages
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <QuickCheckout />
      <CartButton />
      <MobileCartBar />
    </>
  )
}
