'use client'

import { useState, useEffect, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'checking' | 'not_configured'

interface TwilioSettings {
  accountSid: string
  authToken: string
  whatsappNumber: string
  enabled: boolean
  updatedAt?: string
}

export function TwilioConfigPanel() {
  const [twilioConfig, setTwilioConfig] = useState<TwilioSettings>({
    accountSid: '',
    authToken: '',
    whatsappNumber: '',
    enabled: true
  })
  const [twilioConfigMasked, setTwilioConfigMasked] = useState<TwilioSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking')
  const [configured, setConfigured] = useState(false)

  // Load Twilio config
  const loadConfig = useCallback(async (reveal = false) => {
    setIsLoading(true)
    try {
      const url = reveal
        ? '/api/admin/settings/twilio?reveal=true'
        : '/api/admin/settings/twilio'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setConfigured(data.configured)

        if (data.configured && data.settings) {
          if (reveal) {
            setTwilioConfig(data.settings)
            setRevealed(true)
          } else {
            setTwilioConfigMasked(data.settings)
          }
          setConnectionStatus(data.settings.enabled ? 'connected' : 'disconnected')
        } else {
          setConnectionStatus('not_configured')
        }
      }
    } catch (error) {
      console.error('Error loading Twilio config:', error)
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig(false)
  }, [loadConfig])

  // Handle save
  const handleSave = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.whatsappNumber) {
      toast.error('Todos los campos son requeridos')
      return
    }

    if (!twilioConfig.accountSid.startsWith('AC')) {
      toast.error('Account SID debe comenzar con "AC"')
      return
    }

    if (!twilioConfig.whatsappNumber.startsWith('+')) {
      toast.error('El número debe comenzar con "+"')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(twilioConfig),
      })

      if (response.ok) {
        toast.success('Configuración de Twilio guardada')
        setConfigured(true)
        setConnectionStatus('connected')
        loadConfig(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error saving Twilio config:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle reveal credentials
  const handleToggleReveal = async () => {
    if (revealed) {
      setRevealed(false)
      setTwilioConfig({
        accountSid: '',
        authToken: '',
        whatsappNumber: '',
        enabled: true
      })
    } else {
      await loadConfig(true)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado al portapapeles`)
  }

  // Get webhook URL
  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/twilio/webhook`
    }
    return '/api/twilio/webhook'
  }

  // Get status badge
  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-[#00a884]/20 text-[#00a884] border-[#00a884]/30 hover:bg-[#00a884]/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        )
      case 'disconnected':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Deshabilitado
          </Badge>
        )
      case 'not_configured':
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            No configurado
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      case 'checking':
        return (
          <Badge className="bg-[#2a3942] text-[#8696a0] border-[#3a4a52]">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Verificando
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#e9edef] font-medium">Configuración de Twilio</h3>
        {getStatusBadge()}
      </div>

      {/* Account SID */}
      <div className="space-y-2">
        <Label className="text-[#e9edef] text-sm">Account SID</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={revealed ? twilioConfig.accountSid : (twilioConfigMasked?.accountSid || '')}
            onChange={(e) => setTwilioConfig(prev => ({ ...prev, accountSid: e.target.value }))}
            disabled={!revealed}
            className="bg-[#2a3942] border-[#3a4a52] text-[#e9edef] placeholder:text-[#8696a0] disabled:opacity-70"
          />
          {configured && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleReveal}
              className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] shrink-0"
              title={revealed ? 'Ocultar' : 'Revelar'}
            >
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Auth Token */}
      <div className="space-y-2">
        <Label className="text-[#e9edef] text-sm">Auth Token</Label>
        <Input
          type={revealed ? 'text' : 'password'}
          placeholder="••••••••••••••••••••••••••••••••"
          value={revealed ? twilioConfig.authToken : (twilioConfigMasked?.authToken || '')}
          onChange={(e) => setTwilioConfig(prev => ({ ...prev, authToken: e.target.value }))}
          disabled={!revealed}
          className="bg-[#2a3942] border-[#3a4a52] text-[#e9edef] placeholder:text-[#8696a0] disabled:opacity-70"
        />
      </div>

      {/* WhatsApp Number */}
      <div className="space-y-2">
        <Label className="text-[#e9edef] text-sm">Número de WhatsApp</Label>
        <Input
          type="text"
          placeholder="+5493424000000"
          value={revealed ? twilioConfig.whatsappNumber : (twilioConfigMasked?.whatsappNumber || '')}
          onChange={(e) => setTwilioConfig(prev => ({ ...prev, whatsappNumber: e.target.value }))}
          disabled={!revealed}
          className="bg-[#2a3942] border-[#3a4a52] text-[#e9edef] placeholder:text-[#8696a0] disabled:opacity-70"
        />
      </div>

      {/* Webhook URL (read-only) */}
      <div className="space-y-2">
        <Label className="text-[#e9edef] text-sm">Webhook URL</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={getWebhookUrl()}
            readOnly
            className="bg-[#2a3942] border-[#3a4a52] text-[#8696a0] font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => copyToClipboard(getWebhookUrl(), 'Webhook URL')}
            className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] shrink-0"
            title="Copiar"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-[#8696a0]">
          Configura esta URL en tu consola de Twilio para recibir mensajes
        </p>
      </div>

      {/* Last updated */}
      {twilioConfigMasked?.updatedAt && (
        <p className="text-xs text-[#8696a0]">
          Última actualización: {new Date(twilioConfigMasked.updatedAt).toLocaleString('es-AR')}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        {!revealed && configured ? (
          <Button
            onClick={handleToggleReveal}
            variant="outline"
            className="border-[#3a4a52] text-[#e9edef] hover:bg-[#2a3942]"
          >
            <Eye className="h-4 w-4 mr-2" />
            Editar credenciales
          </Button>
        ) : (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#00a884] hover:bg-[#02906f] text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        )}
        <Button
          variant="outline"
          className="border-[#3a4a52] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
          onClick={() => window.open('https://console.twilio.com', '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Consola Twilio
        </Button>
      </div>
    </div>
  )
}
