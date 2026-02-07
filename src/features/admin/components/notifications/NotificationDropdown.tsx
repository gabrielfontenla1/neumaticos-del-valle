'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { NotificationItem } from './NotificationItem'
import type { AdminNotification } from '@/lib/validations/admin-notifications'

interface NotificationDropdownProps {
  notifications: AdminNotification[]
  loading: boolean
  error: string | null
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  theme: {
    foreground: string
    mutedForeground: string
    primary: string
    border: string
    card: string
  }
}

function NotificationDropdownComponent({
  notifications,
  loading,
  error,
  onMarkAsRead,
  onMarkAllAsRead,
  theme,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="w-80">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <span className="text-sm font-semibold" style={{ color: theme.foreground }}>
          Notificaciones
        </span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: theme.primary }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar leídas
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.mutedForeground }} />
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm" style={{ color: theme.mutedForeground }}>
              Error al cargar notificaciones
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: `${theme.mutedForeground}20` }}
            >
              <Bell className="w-6 h-6" style={{ color: theme.mutedForeground }} />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.foreground }}>
              Sin notificaciones
            </p>
            <p className="text-xs mt-1" style={{ color: theme.mutedForeground }}>
              Las nuevas notificaciones aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                theme={theme}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div
          className="px-4 py-3"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <Link
            href="/admin/notificaciones"
            className="text-xs font-medium hover:opacity-80 transition-opacity block text-center"
            style={{ color: theme.primary }}
          >
            Ver todas las notificaciones
          </Link>
        </div>
      )}
    </div>
  )
}

export const NotificationDropdown = memo(NotificationDropdownComponent)
NotificationDropdown.displayName = 'NotificationDropdown'
