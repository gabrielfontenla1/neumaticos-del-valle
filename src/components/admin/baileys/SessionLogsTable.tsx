'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { BaileysSessionLog } from '@/types/baileys'

interface SessionLogsTableProps {
  instanceId: string
}

const eventLabels: Record<string, { label: string; color: string }> = {
  qr_generated: { label: 'QR Generado', color: 'text-yellow-400' },
  connected: { label: 'Conectado', color: 'text-green-400' },
  disconnected: { label: 'Desconectado', color: 'text-gray-400' },
  reconnecting: { label: 'Reconectando', color: 'text-orange-400' },
  message_received: { label: 'Mensaje recibido', color: 'text-blue-400' },
  message_sent: { label: 'Mensaje enviado', color: 'text-cyan-400' },
  error: { label: 'Error', color: 'text-red-400' },
  session_restored: { label: 'Sesion restaurada', color: 'text-purple-400' },
  logout: { label: 'Logout', color: 'text-gray-400' },
}

export function SessionLogsTable({ instanceId }: SessionLogsTableProps) {
  const [logs, setLogs] = useState<BaileysSessionLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/baileys/instances/${instanceId}/logs?limit=20`)
        const data = await res.json()
        if (data.success) {
          setLogs(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [instanceId])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#8696a0]" />
      </div>
    )
  }

  if (logs.length === 0) {
    return <p className="text-sm text-[#6a7a82] text-center py-3">Sin eventos registrados</p>
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {logs.map((log) => {
        const config = eventLabels[log.event_type] || { label: log.event_type, color: 'text-[#8696a0]' }
        const time = new Date(log.created_at).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit'
        })

        return (
          <div key={log.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded hover:bg-[#2a3942]/50">
            <div className="flex items-center gap-2">
              <span className={config.color}>{config.label}</span>
            </div>
            <span className="text-[#6a7a82]">{time}</span>
          </div>
        )
      })}
    </div>
  )
}
