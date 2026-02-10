'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdminNotifications } from '@/features/admin/hooks/useAdminNotifications'
import type { NotificationPriority, AdminNotification } from '@/lib/validations/admin-notifications'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Mail,
  MessageSquare,
  Filter,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

const theme = {
  background: '#30302e',
  foreground: '#d4d4d8',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  secondary: '#262626',
}

const PAGE_SIZE = 20

// Dark theme overrides for shadcn Select (which defaults to light mode)
const selectTriggerClass = '!bg-[#262626] !border-[#3a3a38] !text-[#d4d4d8] [&>span]:!text-[#d4d4d8] [&_svg]:!text-[#a1a1aa] focus:!ring-[#d97757]/30 !py-2'
const selectContentClass = '!bg-[#262624] !border-[#3a3a38] !text-[#d4d4d8]'
const selectItemClass = '!text-[#d4d4d8] hover:!bg-white/10 focus:!bg-white/10 focus:!text-[#d4d4d8] [&_svg]:!text-[#d4d4d8]'

const priorityLabels: Record<NotificationPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const priorityColors: Record<NotificationPriority, string> = {
  low: '#6B7280',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
}

const ALL_PRIORITIES: NotificationPriority[] = ['low', 'medium', 'high', 'urgent']

type ReadFilter = 'all' | 'unread' | 'read'

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
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`

  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  })
}

export default function MensajesPageClient() {
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Create message dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newPriority, setNewPriority] = useState<NotificationPriority>('medium')
  const [creating, setCreating] = useState(false)

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
    refetch,
  } = useAdminNotifications({
    autoFetch: false,
    enableRealtime: true,
    initialFilters: { type: 'system', limit: 100 },
  })

  const applyFilters = useCallback(() => {
    const filters: {
      type: 'system'
      priority?: NotificationPriority
      is_read?: boolean
      limit: number
    } = {
      type: 'system',
      limit: 100,
    }

    if (priorityFilter !== 'all') filters.priority = priorityFilter
    if (readFilter === 'unread') filters.is_read = false
    if (readFilter === 'read') filters.is_read = true

    fetchNotifications(filters)
    setCurrentPage(1)
  }, [priorityFilter, readFilter, fetchNotifications])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return notifications.slice(startIndex, startIndex + PAGE_SIZE)
  }, [notifications, currentPage])

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE))
  const startItem = notifications.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(currentPage * PAGE_SIZE, notifications.length)

  const hasActiveFilters = priorityFilter !== 'all' || readFilter !== 'all'

  const clearFilters = () => {
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

  const handleToggleExpand = (notification: AdminNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setExpandedId((prev) => (prev === notification.id ? null : notification.id))
  }

  const handleCreateMessage = async () => {
    if (!newTitle.trim() || !newContent.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          priority: newPriority,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al crear mensaje')
      }

      toast.success('Mensaje enviado correctamente')
      setDialogOpen(false)
      setNewTitle('')
      setNewContent('')
      setNewPriority('medium')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar mensaje')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 pl-10 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}20` }}
          >
            <Mail className="w-5 h-5" style={{ color: theme.primary }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-bold"
                style={{ color: theme.foreground }}
              >
                Mensajes del Sistema
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
              {total} mensajes en total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              Marcar todos como leidos
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="gap-2 transition-colors"
            style={{
              backgroundColor: theme.primary,
              color: '#fff',
            }}
          >
            <Plus className="w-4 h-4" />
            Nuevo mensaje
          </Button>
        </div>
      </div>

      {/* Filter bar - single row */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Filter className="w-4 h-4 flex-shrink-0" style={{ color: theme.mutedForeground }} />

        <Select
          value={priorityFilter}
          onValueChange={(val) => setPriorityFilter(val as NotificationPriority | 'all')}
        >
          <SelectTrigger className={`w-[200px] text-sm ${selectTriggerClass}`}>
            <SelectValue placeholder="Nivel de prioridad" />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value="all" className={selectItemClass}>
              Todas las prioridades
            </SelectItem>
            {ALL_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority} className={selectItemClass}>
                {priorityLabels[priority]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={readFilter}
          onValueChange={(val) => setReadFilter(val as ReadFilter)}
        >
          <SelectTrigger className={`w-[190px] text-sm ${selectTriggerClass}`}>
            <SelectValue placeholder="Estado de lectura" />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value="all" className={selectItemClass}>
              Todos los mensajes
            </SelectItem>
            <SelectItem value="unread" className={selectItemClass}>
              No leídos
            </SelectItem>
            <SelectItem value="read" className={selectItemClass}>
              Leídos
            </SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-medium ml-auto hover:opacity-80 transition-opacity flex-shrink-0"
            style={{ color: theme.primary }}
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Message list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: theme.card,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)',
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
              <Mail className="w-7 h-7" style={{ color: '#EF4444' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.foreground }}>
              Error al cargar mensajes
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
              <MessageSquare className="w-7 h-7" style={{ color: theme.mutedForeground }} />
            </div>
            <p className="text-sm font-medium" style={{ color: theme.foreground }}>
              {hasActiveFilters ? 'Sin resultados' : 'Sin mensajes'}
            </p>
            <p className="text-xs mt-1" style={{ color: theme.mutedForeground }}>
              {hasActiveFilters
                ? 'No hay mensajes que coincidan con los filtros seleccionados'
                : 'Los nuevos mensajes del sistema apareceran aqui'}
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
          <div className="divide-y divide-white/5">
            {paginatedMessages.map((message) => {
              const isExpanded = expandedId === message.id
              const priorityColor = priorityColors[message.priority] || priorityColors.medium

              return (
                <div
                  key={message.id}
                  className="relative group"
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleToggleExpand(message)}
                    style={{
                      backgroundColor: message.is_read ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
                    }}
                  >
                    {/* Unread indicator */}
                    {!message.is_read && (
                      <div
                        className="absolute left-1 top-5 w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                    )}

                    <div className="flex items-start gap-3 pl-2">
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${priorityColor}20` }}
                      >
                        <MessageSquare className="w-5 h-5" style={{ color: priorityColor }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: theme.foreground }}
                          >
                            {message.title}
                          </p>
                          {(message.priority === 'urgent' || message.priority === 'high') && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase flex-shrink-0"
                              style={{
                                backgroundColor: `${priorityColor}20`,
                                color: priorityColor,
                              }}
                            >
                              {priorityLabels[message.priority]}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                            <span
                              className="text-xs"
                              style={{ color: theme.mutedForeground, opacity: 0.7 }}
                            >
                              {formatRelativeTime(message.created_at)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" style={{ color: theme.mutedForeground }} />
                            ) : (
                              <ChevronDown className="w-4 h-4" style={{ color: theme.mutedForeground }} />
                            )}
                          </div>
                        </div>
                        {!isExpanded && (
                          <p
                            className="text-xs mt-0.5 line-clamp-2"
                            style={{ color: theme.mutedForeground }}
                          >
                            {message.message}
                          </p>
                        )}
                        {isExpanded && (
                          <div className="mt-2">
                            <p
                              className="text-sm whitespace-pre-wrap"
                              style={{ color: theme.mutedForeground }}
                            >
                              {message.message}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${priorityColor}15`,
                                  color: priorityColor,
                                }}
                              >
                                Prioridad: {priorityLabels[message.priority]}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: theme.mutedForeground, opacity: 0.6 }}
                              >
                                {new Date(message.created_at).toLocaleString('es-AR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dismiss button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDismiss(message.id)
                    }}
                    disabled={dismissingId === message.id}
                    className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
                    title="Descartar mensaje"
                    style={{ color: theme.mutedForeground }}
                  >
                    {dismissingId === message.id ? (
                      <div
                        className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
                      />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )
            })}
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

      {/* Create Message Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-[500px]"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
            color: theme.foreground,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: theme.foreground }}>
              Nuevo mensaje del sistema
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: theme.foreground }}
              >
                Titulo
              </label>
              <Input
                placeholder="Titulo del mensaje..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={255}
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                  color: theme.foreground,
                }}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: theme.foreground }}
              >
                Mensaje
              </label>
              <Textarea
                placeholder="Contenido del mensaje..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                maxLength={5000}
                style={{
                  backgroundColor: theme.secondary,
                  borderColor: theme.border,
                  color: theme.foreground,
                  resize: 'vertical',
                }}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: theme.foreground }}
              >
                Prioridad
              </label>
              <Select
                value={newPriority}
                onValueChange={(val) => setNewPriority(val as NotificationPriority)}
              >
                <SelectTrigger className={`w-full text-sm ${selectTriggerClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {ALL_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority} className={selectItemClass}>
                      {priorityLabels[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={creating}
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.border,
                color: theme.mutedForeground,
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMessage}
              disabled={creating || !newTitle.trim() || !newContent.trim()}
              className="gap-2"
              style={{
                backgroundColor: theme.primary,
                color: '#fff',
                opacity: creating || !newTitle.trim() || !newContent.trim() ? 0.5 : 1,
              }}
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {creating ? 'Enviando...' : 'Enviar mensaje'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
