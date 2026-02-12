'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  useEffect(() => {
    // Force scroll to top on route change
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    return () => {
      // Reset to auto on unmount
      window.history.scrollRestoration = 'auto'
    }
  }, [pathname])

  return <>{children}</>
}
