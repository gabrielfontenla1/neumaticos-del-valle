'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { TwilioConfigPanel } from './TwilioConfigPanel'
import { BaileysConfigPanel } from './BaileysConfigPanel'
import {
  Radio,
  Loader2,
  MessageSquare,
  Smartphone,
  ChevronDown,
  ChevronUp
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
  expanded: boolean
  onToggle: (enabled: boolean) => void
  onExpandToggle: () => void
  children?: React.ReactNode
}

// Brand colors for icons: Twilio Indigo (#6366F1), Baileys Teal (#25D9A3)
function ProviderCard({
  provider,
  enabled,
  available,
  isSaving,
  expanded,
  onToggle,
  onExpandToggle,
  children
}: ProviderCardProps) {
  const isTwilio = provider === 'twilio'
  const brandColor = isTwilio ? '#6366F1' : '#25D9A3'

  return (
    <div
      className={`
        rounded-md border transition-all border-[#2a3942]
        ${enabled ? 'bg-[#2a3942]/30' : 'bg-transparent'}
      `}
    >
      {/* Header */}
      <div className="p-4">
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
                className="h-5 w-5"
                style={{ color: enabled ? brandColor : '#8696a0' }}
              />
            ) : (
              <Smartphone
                className="h-5 w-5"
                style={{ color: enabled ? brandColor : '#8696a0' }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <span className={`font-medium ${enabled ? 'text-[#e9edef]' : 'text-[#8696a0]'}`}>
                  {isTwilio ? 'Twilio' : 'Baileys'}
                </span>
                <p className={`text-xs mt-0.5 ${enabled ? 'text-[#8696a0]' : 'text-[#6a7a82]'}`}>
                  {isTwilio
                    ? 'WhatsApp Business API (cloud)'
                    : 'WhatsApp Web (QR - próximamente)'
                  }
                </p>
              </div>

              {/* Toggle */}
              <div className="flex items-center gap-2">
                {isSaving && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    style={{ color: brandColor }}
                  />
                )}
                <Switch
                  checked={enabled}
                  onCheckedChange={onToggle}
                  disabled={isSaving || !available}
                  style={{
                    backgroundColor: enabled ? brandColor : undefined
                  }}
                  className="data-[state=checked]:bg-current"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {isTwilio ? (
                <>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a3942] text-[#8696a0]">Cloud</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a3942] text-[#8696a0]">Escalable</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a3942] text-[#8696a0]">Pago por uso</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a3942] text-[#8696a0]">Self-hosted</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a3942] text-[#8696a0]">Gratuito</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#25D9A3]/20 text-[#25D9A3]">Próximamente</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expand button - only show if enabled and has children */}
        {enabled && children && (
          <button
            onClick={onExpandToggle}
            className="w-full mt-3 pt-3 border-t border-[#2a3942] flex items-center justify-center gap-1 text-xs text-[#8696a0] hover:text-[#e9edef] transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Ocultar configuración
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Ver configuración
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {enabled && expanded && children && (
        <div className="px-4 pb-4 pt-0 border-t border-[#2a3942]">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

export function SourceConfigPanel() {
  const [config, setConfig] = useState<SourceConfig>({
    twilio_enabled: true,
    baileys_enabled: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedTwilio, setExpandedTwilio] = useState(true)
  const [expandedBaileys, setExpandedBaileys] = useState(false)

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

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card className="bg-[#202c33] border-[#2a3942]">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#00a884]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card className="bg-[#202c33] border-[#2a3942]">
        <CardHeader>
          <CardTitle className="text-[#e9edef] flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#00a884]" />
            WhatsApp Source Configuration
          </CardTitle>
          <CardDescription className="text-[#8696a0]">
            Habilita uno o ambos proveedores de mensajería. Los mensajes mostrarán de qué fuente provienen.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Twilio Provider */}
          <ProviderCard
            provider="twilio"
            enabled={config.twilio_enabled}
            available={true}
            isSaving={isSaving}
            expanded={expandedTwilio}
            onToggle={(enabled) => handleToggle('twilio', enabled)}
            onExpandToggle={() => setExpandedTwilio(!expandedTwilio)}
          >
            <TwilioConfigPanel />
          </ProviderCard>

          {/* Baileys Provider */}
          <ProviderCard
            provider="baileys"
            enabled={config.baileys_enabled}
            available={false}
            isSaving={isSaving}
            expanded={expandedBaileys}
            onToggle={(enabled) => handleToggle('baileys', enabled)}
            onExpandToggle={() => setExpandedBaileys(!expandedBaileys)}
          >
            <BaileysConfigPanel />
          </ProviderCard>

          {/* Info box */}
          <div className="p-3 rounded-lg bg-[#2a3942]/50 border border-[#3a4a52]">
            <p className="text-xs text-[#8696a0]">
              💡 <strong className="text-[#e9edef]">Consejo:</strong> Podés tener ambos proveedores habilitados
              simultáneamente. Cada mensaje en el chat mostrará de qué fuente proviene (Twilio o Baileys).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
