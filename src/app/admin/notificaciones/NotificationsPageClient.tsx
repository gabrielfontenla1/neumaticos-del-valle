'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdminNotifications } from '@/features/admin/hooks/useAdminNotifications'
import { NotificationItem } from '@/features/admin/components/notifications'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

const theme = {
  foreground: '#d4d4d8',
  card: '#1e1e1c',
  cardAlt: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#2e2e2c',
  borderLight: '#3a3a38',
}

const PAGE_SIZE = 15

export default function NotificationsPageClient() {
  const [currentPage, setCurrentPage] = useState(1)
  const [dismissingId, setDismissingId] = useState<string | null>(null)

  const {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useAdminNotifications({
    autoFetch: false,
    enableRealtime: true,
    initialFilters: { limit: 100 },
  })

  const loadNotifications = useCallback(() => {
    fetchNotifications({ limit: 100 })
    setCurrentPage(1)
  }, [fetchNotifications])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return notifications.slice(startIndex, startIndex + PAGE_SIZE)
  }, [notifications, currentPage])

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE))
  const startItem = notifications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(currentPage * PAGE_SIZE, notifications.length)

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDismiss = async (id: string) => {
    setDismissingId(id)
    await dismissNotification(id)
    setDismissingId(null)
  }

  return (
    <div className="min-h-screen flex justify-center px-6 py-8">
      <div className="w-full max-w-2xl space-y-5">

        {/* Header card */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`,
                boxShadow: `0 4px 14px ${theme.primary}40`,
              }}
            >
              <BellRing className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1
                className="text-xl font-semibold tracking-tight"
                style={{ color: theme.foreground }}
              >
                Centro de Notificaciones
              </h1>
              <p className="text-sm mt-0.5" style={{ color: theme.mutedForeground }}>
                {unreadCount > 0 ? (
                  <>
                    <span style={{ color: theme.primary, fontWeight: 600 }}>{unreadCount}</span>
                    {' '}sin leer de {total} notificaciones
                  </>
                ) : (
                  <>{total} notificaciones &mdash; todas leídas</>
                )}
              </p>
            </div>
          </div>

          {/* Action bar */}
          <div
            className="flex items-center gap-2 mt-4 pt-4"
            style={{ borderTop: `1px solid ${theme.border}` }}
          >
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2 text-xs transition-colors"
                style={{
                  backgroundColor: `${theme.primary}15`,
                  borderColor: `${theme.primary}30`,
                  color: theme.primary,
                }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas como leídas
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadNotifications}
              disabled={loading}
              className="gap-2 text-xs transition-colors ml-auto"
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.borderLight,
                color: theme.mutedForeground,
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Notification list card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          {loading ? (
            <div className="p-5 space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                  <Skeleton
                    className="w-9 h-9 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${theme.mutedForeground}12` }}
                  />
                  <div className="flex-1 space-y-2.5">
                    <Skeleton
                      className="h-4 w-3/5 rounded"
                      style={{ backgroundColor: `${theme.mutedForeground}12` }}
                    />
                    <Skeleton
                      className="h-3 w-4/5 rounded"
                      style={{ backgroundColor: `${theme.mutedForeground}08` }}
                    />
                    <Skeleton
                      className="h-3 w-1/4 rounded"
                      style={{ backgroundColor: `${theme.mutedForeground}08` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-6 py-16 text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ backgroundColor: '#EF444415' }}
              >
                <Bell className="w-8 h-8" style={{ color: '#EF4444' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: theme.foreground }}>
                No se pudieron cargar las notificaciones
              </p>
              <p className="text-xs mt-1.5 max-w-xs mx-auto" style={{ color: theme.mutedForeground }}>
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 gap-2"
                onClick={loadNotifications}
                style={{
                  backgroundColor: `${theme.primary}15`,
                  borderColor: `${theme.primary}30`,
                  color: theme.primary,
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ backgroundColor: `${theme.mutedForeground}12` }}
              >
                <Bell className="w-8 h-8" style={{ color: theme.mutedForeground }} />
              </div>
              <p className="text-sm font-medium" style={{ color: theme.foreground }}>
                Todo al día
              </p>
              <p className="text-xs mt-1.5" style={{ color: theme.mutedForeground }}>
                Las nuevas notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <>
              <div className="p-2">
                {paginatedNotifications.map((notification, idx) => (
                  <div
                    key={notification.id}
                    className="relative group rounded-xl transition-colors"
                    style={{
                      marginTop: idx > 0 ? 2 : 0,
                    }}
                  >
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={handleDismiss}
                      theme={theme}
                    />
                    {/* Dismiss overlay spinner */}
                    {dismissingId === notification.id && (
                      <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/20">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: `1px solid ${theme.border}` }}
              >
                <p className="text-xs" style={{ color: theme.mutedForeground }}>
                  {startItem}&ndash;{endItem} de {notifications.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="h-8 w-8 p-0"
                    style={{
                      color: currentPage <= 1 ? `${theme.mutedForeground}50` : theme.mutedForeground,
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span
                    className="text-xs px-2 tabular-nums"
                    style={{ color: theme.mutedForeground }}
                  >
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="h-8 w-8 p-0"
                    style={{
                      color: currentPage >= totalPages ? `${theme.mutedForeground}50` : theme.mutedForeground,
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
