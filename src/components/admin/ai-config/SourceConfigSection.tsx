/**
 * Source Configuration Section Component
 * Configure WhatsApp message sources (Twilio, Baileys, etc.)
 * Integrated into AIConfigPanel as a tab
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { TwilioConfigPanel } from '../source-config/TwilioConfigPanel'
import { BaileysConfigPanel } from '../source-config/BaileysConfigPanel'
import {
  Radio,
  Loader2,
  MessageSquare,
  Smartphone
} from 'lucide-react'
import { toast } from 'sonner'

interface SourceConfig {
  twilio_enabled: boolean
  baileys_enabled: boolean
}

interface ProviderCardProps {
  provider: 'twilio' | 'baileys'
  enabled: boolean
  available: boolean
  isSaving: boolean
  onToggle: (enabled: boolean) => void
}

// Brand colors for icons: Twilio Indigo (#6366F1), Baileys Teal (#25D9A3)
function ProviderCard({
  provider,
  enabled,
  available,
  isSaving,
  onToggle
}: ProviderCardProps) {
  const isTwilio = provider === 'twilio'
  const brandColor = isTwilio ? '#6366F1' : '#25D9A3'

  return (
    <div
      className={`
        rounded-md border transition-all border-[#2a3942] p-3
        ${enabled ? 'bg-[#2a3942]/30' : 'bg-transparent'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="p-2 rounded-lg shrink-0"
          style={{
            backgroundColor: enabled ? `${brandColor}20` : '#2a3942'
          }}
        >
          {isTwilio ? (
            <MessageSquare
              className="h-4 w-4"
              style={{ color: enabled ? brandColor : '#8696a0' }}
            />
          ) : (
            <Smartphone
              className="h-4 w-4"
              style={{ color: enabled ? brandColor : '#8696a0' }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={`font-medium text-sm ${enabled ? 'text-[#e9edef]' : 'text-[#8696a0]'}`}>
              {isTwilio ? 'Twilio' : 'Baileys'}
            </span>

            {/* Toggle */}
            <div className="flex items-center gap-2">
              {isSaving && (
                <Loader2
                  className="h-3 w-3 animate-spin"
                  style={{ color: brandColor }}
                />
              )}
              <Switch
                checked={enabled}
                onCheckedChange={onToggle}
                disabled={isSaving || !available}
                className="data-[state=checked]:bg-[#00a884] scale-90"
              />
            </div>
          </div>

          <p className={`text-[10px] mt-0.5 ${enabled ? 'text-[#8696a0]' : 'text-[#6a7a82]'}`}>
            {isTwilio ? 'Business API' : 'Web (próximamente)'}
          </p>
        </div>
      </div>
    </div>
  )
}

export function SourceConfigSection() {
  const [config, setConfig] = useState<SourceConfig>({
    twilio_enabled: true,
    baileys_enabled: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load current configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/admin/config/whatsapp-source')
        if (response.ok) {
          const data = await response.json()
          setConfig({
            twilio_enabled: data.twilio_enabled ?? true,
            baileys_enabled: data.baileys_enabled ?? false
          })
        }
      } catch (error) {
        console.error('Error loading source config:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  // Handle toggle change
  const handleToggle = async (provider: 'twilio' | 'baileys', enabled: boolean) => {
    // Baileys not available yet
    if (provider === 'baileys' && enabled) {
      toast.info('Baileys no está disponible aún. Próximamente.')
      return
    }

    const newConfig = {
      ...config,
      [`${provider}_enabled`]: enabled
    }

    // Validate at least one is enabled
    if (!newConfig.twilio_enabled && !newConfig.baileys_enabled) {
      toast.error('Al menos un proveedor debe estar habilitado')
      return
    }

    const previousConfig = { ...config }
    setConfig(newConfig)
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/config/whatsapp-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      })

      if (response.ok) {
        toast.success(`${provider === 'twilio' ? 'Twilio' : 'Baileys'} ${enabled ? 'habilitado' : 'deshabilitado'}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al guardar configuración')
        setConfig(previousConfig)
      }
    } catch (error) {
      console.error('Error saving source config:', error)
      toast.error('Error al guardar configuración')
      setConfig(previousConfig)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#00a884] mx-auto" />
          <p className="mt-4 text-[#8696a0]">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Radio className="h-5 w-5 text-[#00a884]" />
        <div>
          <h3 className="text-lg font-semibold text-white">Proveedores de WhatsApp</h3>
          <p className="text-sm text-[#8696a0]">
            Configura los proveedores de mensajería activos
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Twilio Column */}
        <Card className="bg-[#202c33] border-[#2a3942] flex flex-col">
          <div className="p-4 border-b border-[#2a3942]">
            <ProviderCard
              provider="twilio"
              enabled={config.twilio_enabled}
              available={true}
              isSaving={isSaving}
              onToggle={(enabled) => handleToggle('twilio', enabled)}
            />
          </div>
          <div className="p-4 flex-1">
            {config.twilio_enabled ? (
              <TwilioConfigPanel />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-[#8696a0]">
                <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Habilita Twilio para configurar</p>
              </div>
            )}
          </div>
        </Card>

        {/* Baileys Column */}
        <Card className="bg-[#202c33] border-[#2a3942] flex flex-col">
          <div className="p-4 border-b border-[#2a3942]">
            <ProviderCard
              provider="baileys"
              enabled={config.baileys_enabled}
              available={false}
              isSaving={isSaving}
              onToggle={(enabled) => handleToggle('baileys', enabled)}
            />
          </div>
          <div className="p-4 flex-1">
            {config.baileys_enabled ? (
              <BaileysConfigPanel />
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-[#8696a0]">
                <Smartphone className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm text-center">Próximamente disponible</p>
                <div className="flex flex-wrap justify-center gap-2 text-xs mt-3">
                  <span className="px-2 py-1 rounded bg-[#2a3942] text-[#6a7a82]">Sin costo mensual</span>
                  <span className="px-2 py-1 rounded bg-[#2a3942] text-[#6a7a82]">Conexión directa</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
