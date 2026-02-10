'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdminNotifications } from '@/features/admin/hooks/useAdminNotifications'
import { NotificationItem } from '@/features/admin/components/notifications'
import type { NotificationType, NotificationPriority } from '@/lib/validations/admin-notifications'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Filter,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

const theme = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  secondary: '#262626',
}

const PAGE_SIZE = 20

const typeLabels: Record<NotificationType, string> = {
  new_order: 'Nuevo pedido',
  new_appointment: 'Nueva cita',
  new_review: 'Nueva reseña',
  low_stock: 'Stock bajo',
  new_quote: 'Nueva cotización',
  order_cancelled: 'Pedido cancelado',
  appointment_cancelled: 'Cita cancelada',
  voucher_redeemed: 'Voucher canjeado',
  system: 'Sistema',
}

const priorityLabels: Record<NotificationPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const ALL_TYPES: NotificationType[] = [
  'new_order',
  'new_appointment',
  'new_review',
  'low_stock',
  'new_quote',
  'order_cancelled',
  'appointment_cancelled',
  'voucher_redeemed',
  'system',
]

const ALL_PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high', 'urgent']

type ReadFilter = 'all' | 'unread' | 'read'

export default function NotificationsPageClient() {
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
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

  // Build filters and fetch when they change
  const applyFilters = useCallback(() => {
    const filters: {
      type?: NotificationType
      priority?: NotificationPriority
      is_read?: boolean
      limit?: number
    } = {
      limit: 100,
    }

    if (typeFilter !== 'all') filters.type = typeFilter
    if (priorityFilter !== 'all') filters.priority = priorityFilter
    if (readFilter === 'unread') filters.is_read = false
    if (readFilter === 'read') filters.is_read = true

    fetchNotifications(filters)
    setCurrentPage(1)
  }, [typeFilter, priorityFilter, readFilter, fetchNotifications])

  // Initial fetch and re-fetch on filter changes
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Client-side pagination
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return notifications.slice(startIndex, startIndex + PAGE_SIZE)
  }, [notifications, currentPage])

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE))
  const startItem = notifications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(currentPage * PAGE_SIZE, notifications.length)

  const hasActiveFilters = typeFilter !== 'all' || priorityFilter !== 'all' || readFilter !== 'all'

  const clearFilters = () => {
    setTypeFilter('all')
    setPriorityFilter('all')
    setReadFilter('all')
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDismiss = async (id: string) => {
    setDismissingId(id)
    await dismissNotification(id)
    setDismissingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}20` }}
          >
            <Bell className="w-5 h-5" style={{ color: theme.primary }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-bold"
                style={{ color: theme.foreground }}
              >
                Notificaciones
              </h1>
              {unreadCount > 0 && (
                <Badge
                  className="text-xs font-semibold px-2 py-0.5"
                  style={{
                    backgroundColor: theme.primary,
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>
            <p
              className="text-sm mt-0.5"
              style={{ color: theme.mutedForeground }}
            >
              {total} notificaciones en total
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-2 transition-colors"
            style={{
              backgroundColor: 'transparent',
              borderColor: theme.border,
              color: theme.primary,
            }}
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4" style={{ color: theme.mutedForeground }} />
          <span
            className="text-sm font-medium"
            style={{ color: theme.mutedForeground }}
          >
            Filtros
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium ml-auto hover:opacity-80 transition-opacity"
              style={{ color: theme.primary }}
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Type filter */}
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as NotificationType | 'all')}
          >
            <SelectTrigger
              className="w-[200px] text-sm"
              style={{
                backgroundColor: theme.secondary,
                borderColor: theme.border,
                color: theme.foreground,
              }}
            >
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <SelectItem
                value="all"
                style={{ color: theme.foreground }}
              >
                Todos los tipos
              </SelectItem>
              {ALL_TYPES.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  style={{ color: theme.foreground }}
                >
                  {typeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority filter */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => setPriorityFilter(val as NotificationPriority | 'all')}
          >
            <SelectTrigger
              className="w-[180px] text-sm"
              style={{
                backgroundColor: theme.secondary,
                borderColor: theme.border,
                color: theme.foreground,
              }}
            >
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <SelectItem
                value="all"
                style={{ color: theme.foreground }}
              >
                Todas las prioridades
              </SelectItem>
              {ALL_PRIORITIES.map((priority) => (
                <SelectItem
                  key={priority}
                  value={priority}
                  style={{ color: theme.foreground }}
                >
                  {priorityLabels[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Read status filter */}
          <Select
            value={readFilter}
            onValueChange={(val) => setReadFilter(val as ReadFilter)}
          >
            <SelectTrigger
              className="w-[180px] text-sm"
              style={{
                backgroundColor: theme.secondary,
                borderColor: theme.border,
                color: theme.foreground,
              }}
            >
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
              }}
            >
              <SelectItem
                value="all"
                style={{ color: theme.foreground }}
              >
                Todas
              </SelectItem>
              <SelectItem
                value="unread"
                style={{ color: theme.foreground }}
              >
                No leídas
              </SelectItem>
              <SelectItem
                value="read"
                style={{ color: theme.foreground }}
              >
                Leídas
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notification list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
        }}
      >
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton
                  className="w-9 h-9 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${theme.mutedForeground}15` }}
                />
                <div className="flex-1 space-y-2">
                  <Skeleton
                    className="h-4 w-3/4 rounded"
                    style={{ backgroundColor: `${theme.mutedForeground}15` }}
                  />
                  <Skeleton
                    className="h-3 w-full rounded"
                    style={{ backgroundColor: `${theme.mutedForeground}10` }}
                  />
                  <Skeleton
                    className="h-3 w-1/4 rounded"
                    style={{ backgroundColor: `${theme.mutedForeground}10` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-12 text-center">
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: '#EF444420' }}
            >
              <Bell className="w-7 h-7" style={{ color: '#EF4444' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.foreground }}>
              Error al cargar notificaciones
            </p>
            <p className="text-xs mt-1" style={{ color: theme.mutedForeground }}>
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={applyFilters}
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.border,
                color: theme.primary,
              }}
            >
              Reintentar
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${theme.mutedForeground}20` }}
            >
              <Bell className="w-7 h-7" style={{ color: theme.mutedForeground }} />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.foreground }}>
              {hasActiveFilters ? 'Sin resultados' : 'Sin notificaciones'}
            </p>
            <p className="text-xs mt-1" style={{ color: theme.mutedForeground }}>
              {hasActiveFilters
                ? 'No hay notificaciones que coincidan con los filtros seleccionados'
                : 'Las nuevas notificaciones aparecerán aquí'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
                style={{
                  backgroundColor: 'transparent',
                  borderColor: theme.border,
                  color: theme.primary,
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: `${theme.border}80` }}>
            {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className="relative group"
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  theme={theme}
                />
                {/* Dismiss button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDismiss(notification.id)
                  }}
                  disabled={dismissingId === notification.id}
                  className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                  title="Descartar notificación"
                  style={{ color: theme.mutedForeground }}
                >
                  {dismissingId === notification.id ? (
                    <div
                      className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && notifications.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: `1px solid ${theme.border}` }}
          >
            <p
              className="text-xs"
              style={{ color: theme.mutedForeground }}
            >
              Mostrando {startItem}-{endItem} de {notifications.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="gap-1 text-xs"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: theme.border,
                  color: currentPage <= 1 ? theme.mutedForeground : theme.foreground,
                  opacity: currentPage <= 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </Button>
              <span
                className="text-xs px-2"
                style={{ color: theme.mutedForeground }}
              >
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="gap-1 text-xs"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: theme.border,
                  color: currentPage >= totalPages ? theme.mutedForeground : theme.foreground,
                  opacity: currentPage >= totalPages ? 0.5 : 1,
                }}
              >
                Siguiente
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
