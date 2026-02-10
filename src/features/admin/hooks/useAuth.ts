// Admin authentication hook
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AdminSession } from '../types'
import { getAdminSession, adminLogout } from '../api'

export function useAuth(requireAuth = true) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { status: nextAuthStatus } = useSession()

  useEffect(() => {
    const checkAuth = () => {
      const currentSession = getAdminSession()

      // Require both: sessionStorage cache AND real NextAuth session
      const hasNextAuth = nextAuthStatus === 'authenticated'
      const isValid = currentSession && hasNextAuth

      if (requireAuth && !isValid) {
        // If NextAuth says unauthenticated (not loading), redirect
        if (nextAuthStatus !== 'loading') {
          router.push('/admin/login')
        }
      } else {
        setSession(currentSession)
      }

      if (nextAuthStatus !== 'loading') {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Check session every minute
    const interval = setInterval(checkAuth, 60000)
    return () => clearInterval(interval)
  }, [requireAuth, router, nextAuthStatus])

  const logout = () => {
    adminLogout()
    router.push('/admin/login')
  }

  return {
    session,
    isLoading,
    isAuthenticated: !!session && nextAuthStatus === 'authenticated',
    logout
  }
}
