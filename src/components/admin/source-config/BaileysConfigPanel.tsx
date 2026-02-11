'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { InstanceCard } from '../baileys/InstanceCard'
import { CreateInstanceDialog } from '../baileys/CreateInstanceDialog'
import { SessionLogsTable } from '../baileys/SessionLogsTable'
import type { BaileysInstance } from '@/types/baileys'

export function BaileysConfigPanel() {
  const [instances, setInstances] = useState<BaileysInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null)

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch('/api/baileys/instances')
      const data = await res.json()
      if (data.success) {
        setInstances(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching instances:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/baileys/health')
      const data = await res.json()
      setServiceOnline(data.success && data.service_status === 'online')
    } catch {
      setServiceOnline(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
    fetchInstances()
  }, [checkHealth, fetchInstances])

  const handleRefresh = () => {
    setLoading(true)
    checkHealth()
    fetchInstances()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#e9edef] font-medium">Configuración de Baileys</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] h-7 w-7 p-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <CreateInstanceDialog onCreated={fetchInstances} />
        </div>
      </div>

      {/* Service status */}
      <div className="flex items-center gap-2 text-xs">
        {serviceOnline === null ? (
          <Loader2 className="h-3 w-3 animate-spin text-[#8696a0]" />
        ) : serviceOnline ? (
          <>
            <Wifi className="h-3 w-3 text-green-400" />
            <span className="text-green-400">Servicio Baileys online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-400" />
            <span className="text-red-400">Servicio Baileys offline</span>
            <span className="text-[#6a7a82] ml-1">- ejecutá: npm run baileys:dev</span>
          </>
        )}
      </div>

      {/* Instances */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-6 text-[#8696a0]">
          <p className="text-sm">No hay instancias creadas</p>
          <p className="text-xs mt-1">Creá una instancia para conectar WhatsApp</p>
        </div>
      ) : (
        <div className="space-y-3">
          {instances.map((instance) => (
            <div key={instance.id}>
              <InstanceCard instance={instance} onRefresh={fetchInstances} />
              <Accordion type="single" collapsible className="mt-1">
                <AccordionItem value="logs" className="border-[#2a3942]">
                  <AccordionTrigger className="text-xs text-[#6a7a82] hover:text-[#8696a0] py-1 px-2">
                    Ver logs
                  </AccordionTrigger>
                  <AccordionContent className="px-2">
                    <SessionLogsTable instanceId={instance.id} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
