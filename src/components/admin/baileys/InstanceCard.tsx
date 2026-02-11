'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { QRCodeDisplay } from './QRCodeDisplay'
import { Loader2, Unplug, Trash2, Phone, Wifi } from 'lucide-react'
import { toast } from 'sonner'
import type { BaileysInstance } from '@/types/baileys'

interface InstanceCardProps {
  instance: BaileysInstance
  onRefresh: () => void
}

type LocalPhase = 'idle' | 'connecting' | 'disconnecting'

export function InstanceCard({ instance, onRefresh }: InstanceCardProps) {
  const [actionLoading, setActionLoading] = useState(false)
  const [localPhase, setLocalPhase] = useState<LocalPhase>('idle')

  // Sync local phase with DB status changes
  useEffect(() => {
    if (instance.status === 'connected' || instance.status === 'disconnected' || instance.status === 'error') {
      setLocalPhase('idle')
    }
  }, [instance.status])

  // QR area and buttons are driven by localPhase (user action), NOT stale DB status.
  // DB status only affects the StatusBadge display.
  const showQRArea = localPhase === 'connecting'
  const isConnected = instance.status === 'connected'
  const isIdle = !showQRArea && !isConnected

  const handleConnect = async () => {
    setLocalPhase('connecting')
    try {
      const res = await fetch(`/api/baileys/instances/${instance.id}/connect`, { method: 'POST' })
      const data = await res.json()

      if (!data.success) {
        // Don't show error toast - the QR area already handles waiting
        // Only show error if the API itself rejects the request
        if (data.error && !data.error.includes('fetch failed')) {
          toast.error(data.error)
          setLocalPhase('idle')
        }
        // If fetch failed, the service might just be starting - QR area will handle polling
      }
    } catch {
      toast.error('No se pudo conectar al servicio de Baileys')
      setLocalPhase('idle')
    }
  }

  const handleDisconnect = async () => {
    setActionLoading(true)
    setLocalPhase('disconnecting')
    try {
      const res = await fetch(`/api/baileys/instances/${instance.id}/disconnect`, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast.success('Desconectado')
        onRefresh()
      } else {
        toast.error(data.error || 'Error al desconectar')
      }
    } catch {
      toast.error('Error de conexion')
    } finally {
      setActionLoading(false)
      setLocalPhase('idle')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Estas seguro de eliminar esta instancia?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/baileys/instances/${instance.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast.success('Instancia eliminada')
        onRefresh()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexion')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Card className="bg-[#1a2429] border-[#2a3942] p-4 space-y-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[#e9edef] font-medium text-sm">{instance.name}</h4>
          <StatusBadge status={showQRArea && instance.status === 'disconnected' ? 'connecting' : instance.status} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={actionLoading || isConnected || showQRArea}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Phone number when connected */}
      <AnimatePresence>
        {instance.phone_number && isConnected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-[#8696a0]"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>+{instance.phone_number}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code area - only shown when user clicks Conectar */}
      <AnimatePresence>
        {showQRArea && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <QRCodeDisplay
              instanceId={instance.id}
              onConnected={() => {
                setLocalPhase('idle')
                onRefresh()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <AnimatePresence mode="wait">
        {isIdle && (
          <motion.div
            key="connect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              size="sm"
              onClick={handleConnect}
              disabled={actionLoading}
              className="bg-[#00a884] hover:bg-[#00a884]/80 text-white w-full"
            >
              <Wifi className="h-3.5 w-3.5 mr-2" />
              Conectar
            </Button>
          </motion.div>
        )}

        {showQRArea && (
          <motion.div
            key="cancel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="bg-transparent border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] w-full"
            >
              {actionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <Unplug className="h-3.5 w-3.5 mr-2" />
              )}
              Cancelar conexion
            </Button>
          </motion.div>
        )}

        {isConnected && (
          <motion.div
            key="disconnect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="bg-transparent border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
            >
              {actionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <Unplug className="h-3.5 w-3.5 mr-2" />
              )}
              Desconectar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
