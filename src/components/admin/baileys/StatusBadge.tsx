'use client'

import { Badge } from '@/components/ui/badge'
import type { BaileysInstanceStatus } from '@/types/baileys'

const statusConfig: Record<BaileysInstanceStatus, {
  label: string
  className: string
}> = {
  disconnected: {
    label: 'Desconectado',
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  },
  connecting: {
    label: 'Conectando...',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse'
  },
  connected: {
    label: 'Conectado',
    className: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  reconnecting: {
    label: 'Reconectando...',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse'
  },
  error: {
    label: 'Error',
    className: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
}

interface StatusBadgeProps {
  status: BaileysInstanceStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.disconnected
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
