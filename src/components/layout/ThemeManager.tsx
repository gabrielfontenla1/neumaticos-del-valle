'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ThemeManager() {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  useEffect(() => {
    if (isAdminRoute) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isAdminRoute])

  return null
}
