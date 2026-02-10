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
    <div className="space-y-6">
      {/* Section: Providers */}
      <Card className="bg-[#202c33] border-[#2a3942]">
        <div className="p-4 border-b border-[#2a3942]">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-[#00a884]" />
            <h3 className="text-lg font-semibold text-white">Proveedores de WhatsApp</h3>
          </div>
          <p className="text-sm text-[#8696a0] mt-1 ml-8">
            Selecciona los proveedores de mensajería activos
          </p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <ProviderCard
              provider="twilio"
              enabled={config.twilio_enabled}
              available={true}
              isSaving={isSaving}
              onToggle={(enabled) => handleToggle('twilio', enabled)}
            />
            <ProviderCard
              provider="baileys"
              enabled={config.baileys_enabled}
              available={false}
              isSaving={isSaving}
              onToggle={(enabled) => handleToggle('baileys', enabled)}
            />
          </div>
        </div>
      </Card>

      {/* Section: Twilio Configuration */}
      {config.twilio_enabled && (
        <Card className="bg-[#202c33] border-[#2a3942]">
          <div className="p-4 border-b border-[#2a3942]">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-[#6366F1]" />
              <h3 className="text-lg font-semibold text-white">Configuración de Twilio</h3>
            </div>
          </div>
          <div className="p-4">
            <TwilioConfigPanel />
          </div>
        </Card>
      )}

      {/* Section: Baileys Configuration (when available) */}
      {config.baileys_enabled && (
        <Card className="bg-[#202c33] border-[#2a3942]">
          <div className="p-4 border-b border-[#2a3942]">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-[#25D9A3]" />
              <h3 className="text-lg font-semibold text-white">Configuración de Baileys</h3>
            </div>
          </div>
          <div className="p-4">
            <BaileysConfigPanel />
          </div>
        </Card>
      )}
    </div>
  )
}
