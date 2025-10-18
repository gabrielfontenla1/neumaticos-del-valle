// Admin authentication hook
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSession } from '../types'
import { getAdminSession, adminLogout } from '../api'

export function useAuth(requireAuth = true) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const currentSession = getAdminSession()

      if (requireAuth && !currentSession) {
        router.push('/admin/login')
      } else {
        setSession(currentSession)
      }

      setIsLoading(false)
    }

    checkAuth()

    // Check session every minute
    const interval = setInterval(checkAuth, 60000)
    return () => clearInterval(interval)
  }, [requireAuth, router])

  const logout = () => {
    adminLogout()
    router.push('/admin/login')
  }

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    logout
  }
}