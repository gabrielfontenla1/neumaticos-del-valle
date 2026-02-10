'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { AdminNotification, NotificationType, NotificationPriority } from '@/lib/validations/admin-notifications'

interface NotificationFilters {
  type?: NotificationType
  priority?: NotificationPriority
  is_read?: boolean
  limit?: number
  offset?: number
}

interface UseAdminNotificationsOptions {
  autoFetch?: boolean
  enableRealtime?: boolean
  initialFilters?: NotificationFilters
}

interface UseAdminNotificationsReturn {
  notifications: AdminNotification[]
  unreadCount: number
  total: number
  loading: boolean
  error: string | null
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  dismissNotification: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useAdminNotifications(
  options: UseAdminNotificationsOptions = {}
): UseAdminNotificationsReturn {
  const {
    autoFetch = true,
    enableRealtime = true,
    initialFilters = { limit: 10 },
  } = options

  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef(initialFilters)

  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    const currentFilters = filters || filtersRef.current
    filtersRef.current = currentFilters

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (currentFilters.type) params.set('type', currentFilters.type)
      if (currentFilters.priority) params.set('priority', currentFilters.priority)
      if (currentFilters.is_read !== undefined) params.set('is_read', String(currentFilters.is_read))
      if (currentFilters.limit) params.set('limit', String(currentFilters.limit))
      if (currentFilters.offset) params.set('offset', String(currentFilters.offset))

      const response = await fetch(`/api/admin/notifications?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
      setTotal(data.total || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching notifications'
      setError(message)
      // Log but don't break the UI - gracefully degrade
      console.warn('Error fetching notifications (UI will show empty):', message)
      // Set empty state so UI doesn't break
      setNotifications([])
      setUnreadCount(0)
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_read: true }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to mark notification as read')
      }

      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))

      return true
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return false
    }
  }, [])

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to mark all notifications as read')
      }

      // Update local state
      const now = new Date().toISOString()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: now }))
      )
      setUnreadCount(0)

      return true
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      return false
    }
  }, [])

  const dismissNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to dismiss notification')
      }

      // Remove from local state
      const dismissed = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))

      // Adjust unread count if dismissed notification was unread
      if (dismissed && !dismissed.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      return true
    } catch (err) {
      console.error('Error dismissing notification:', err)
      return false
    }
  }, [notifications])

  const refetch = useCallback(async () => {
    await fetchNotifications(filtersRef.current)
  }, [fetchNotifications])

  // Initial fetch - only run once on mount
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications(filtersRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch])

  // Realtime subscription
  useEffect(() => {
    if (!enableRealtime) return

    const channel = supabase
      .channel('admin_notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const newNotification = payload.new as AdminNotification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
          setTotal((prev) => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const updated = payload.new as AdminNotification
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          )
          // Recalculate unread count on updates
          setNotifications((current) => {
            const newUnreadCount = current.filter((n) => !n.is_read && !n.is_dismissed).length
            setUnreadCount(newUnreadCount)
            return current
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const deleted = payload.old as { id: string }
          setNotifications((prev) => prev.filter((n) => n.id !== deleted.id))
          setTotal((prev) => Math.max(0, prev - 1))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enableRealtime])

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refetch,
  }
}
