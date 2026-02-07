'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DashboardCounts } from '@/lib/validations/admin-notifications'

interface UseDashboardCountsOptions {
  autoFetch?: boolean
  refreshInterval?: number // in milliseconds, 0 to disable
}

interface UseDashboardCountsReturn {
  counts: DashboardCounts | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const initialCounts: DashboardCounts = {
  pending_orders: 0,
  pending_appointments: 0,
  pending_reviews: 0,
  pending_quotes: 0,
  low_stock_products: 0,
  unread_notifications: 0,
  active_vouchers: 0,
  today_appointments: 0,
  total_products: 0,
  total_customers: 0,
}

export function useDashboardCounts(
  options: UseDashboardCountsOptions = {}
): UseDashboardCountsReturn {
  const { autoFetch = true, refreshInterval = 60000 } = options

  const [counts, setCounts] = useState<DashboardCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCounts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/notifications/counts', {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setCounts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching counts'
      setError(message)
      console.error('Error fetching dashboard counts:', err)
      // Set initial counts on error so UI doesn't break
      setCounts(initialCounts)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchCounts()
    }
  }, [autoFetch, fetchCounts])

  // Periodic refresh
  useEffect(() => {
    if (refreshInterval <= 0) return

    const interval = setInterval(fetchCounts, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, fetchCounts])

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts,
  }
}
