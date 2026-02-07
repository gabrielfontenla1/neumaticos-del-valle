'use client'

import { memo } from 'react'
import Link from 'next/link'
import {
  ShoppingCart,
  Calendar,
  Star,
  AlertTriangle,
  FileQuestion,
  XCircle,
  Ticket,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import type { AdminNotification, NotificationType } from '@/lib/validations/admin-notifications'

interface NotificationItemProps {
  notification: AdminNotification
  onMarkAsRead?: (id: string) => void
  theme: {
    foreground: string
    mutedForeground: string
    primary: string
  }
}

// Icon mapping for notification types
const iconMap: Record<NotificationType, LucideIcon> = {
  new_order: ShoppingCart,
  new_appointment: Calendar,
  new_review: Star,
  low_stock: AlertTriangle,
  new_quote: FileQuestion,
  order_cancelled: XCircle,
  appointment_cancelled: Calendar,
  voucher_redeemed: Ticket,
  system: Bell,
}

// Color mapping for notification types
const colorMap: Record<NotificationType, string> = {
  new_order: '#10B981', // emerald
  new_appointment: '#3B82F6', // blue
  new_review: '#F59E0B', // amber
  low_stock: '#EF4444', // red
  new_quote: '#8B5CF6', // violet
  order_cancelled: '#EF4444', // red
  appointment_cancelled: '#F97316', // orange
  voucher_redeemed: '#10B981', // emerald
  system: '#6B7280', // gray
}

// Priority indicator colors
const priorityColors: Record<string, string> = {
  low: '#6B7280',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Ahora'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`

  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

function NotificationItemComponent({
  notification,
  onMarkAsRead,
  theme,
}: NotificationItemProps) {
  const Icon = iconMap[notification.type] || Bell
  const iconColor = colorMap[notification.type] || theme.mutedForeground
  const priorityColor = priorityColors[notification.priority] || priorityColors.medium

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const content = (
    <div
      className="p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors relative"
      onClick={handleClick}
      style={{
        backgroundColor: notification.is_read ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ backgroundColor: theme.primary }}
        />
      )}

      <div className="flex items-start gap-3 pl-2">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-medium truncate"
              style={{ color: theme.foreground }}
            >
              {notification.title}
            </p>
            {notification.priority === 'urgent' || notification.priority === 'high' ? (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
                style={{
                  backgroundColor: `${priorityColor}20`,
                  color: priorityColor,
                }}
              >
                {notification.priority === 'urgent' ? 'Urgente' : 'Alta'}
              </span>
            ) : null}
          </div>
          <p
            className="text-xs mt-0.5 line-clamp-2"
            style={{ color: theme.mutedForeground }}
          >
            {notification.message}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: theme.mutedForeground, opacity: 0.7 }}
          >
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
      </div>
    </div>
  )

  // If notification has action_url, wrap in Link
  if (notification.action_url) {
    return (
      <Link href={notification.action_url} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return content
}

export const NotificationItem = memo(NotificationItemComponent)
NotificationItem.displayName = 'NotificationItem'
