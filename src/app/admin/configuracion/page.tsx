'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  MessageCircle,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink
} from 'lucide-react'

interface TwilioSettings {
  accountSid: string
  authToken: string
  whatsappNumber: string
  enabled: boolean
  updatedAt?: string
}

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [showTokens, setShowTokens] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [settings, setSettings] = useState<TwilioSettings>({
    accountSid: '',
    authToken: '',
    whatsappNumber: '',
    enabled: false
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/twilio')
      const data = await response.json()

      if (data.configured && data.settings) {
        setConfigured(true)
        setSettings({
          accountSid: data.settings.accountSid || '',
          authToken: data.settings.authToken || '',
          whatsappNumber: data.settings.whatsappNumber || '',
          enabled: data.settings.enabled || false
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar')
      }

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      setConfigured(true)

      // Reload to get masked values
      setTimeout(() => loadSettings(), 1000)

    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al guardar configuración'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof TwilioSettings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Settings className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración</h1>
            <p className="text-gray-400">Gestiona las integraciones del sistema</p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-500/20 border border-green-500/30'
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
            : <AlertCircle className="w-5 h-5 text-red-500" />
          }
          <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {message.text}
          </span>
        </div>
      )}

      {/* Twilio Configuration Card */}
      <Card className="bg-[#262624] border-[#3a3a38]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  Twilio WhatsApp
                  {configured ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Configurado
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      Sin configurar
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configura las credenciales de Twilio para recibir mensajes de WhatsApp
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="enabled" className="text-gray-400 text-sm">Habilitado</Label>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => handleInputChange('enabled', checked)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account SID */}
          <div className="space-y-2">
            <Label htmlFor="accountSid" className="text-gray-300">
              Account SID
            </Label>
            <div className="relative">
              <Input
                id="accountSid"
                type={showTokens ? 'text' : 'password'}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.accountSid}
                onChange={(e) => handleInputChange('accountSid', e.target.value)}
                className="bg-[#1a1a18] border-[#3a3a38] text-white placeholder:text-gray-600 pr-10"
              />
            </div>
            <p className="text-xs text-gray-500">
              Encontralo en tu{' '}
              <a
                href="https://console.twilio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline inline-flex items-center gap-1"
              >
                Twilio Console <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Auth Token */}
          <div className="space-y-2">
            <Label htmlFor="authToken" className="text-gray-300">
              Auth Token
            </Label>
            <div className="relative">
              <Input
                id="authToken"
                type={showTokens ? 'text' : 'password'}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.authToken}
                onChange={(e) => handleInputChange('authToken', e.target.value)}
                className="bg-[#1a1a18] border-[#3a3a38] text-white placeholder:text-gray-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowTokens(!showTokens)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Token de autenticación secreto de tu cuenta Twilio
            </p>
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber" className="text-gray-300">
              Número de WhatsApp
            </Label>
            <Input
              id="whatsappNumber"
              type="tel"
              placeholder="+14155238886"
              value={settings.whatsappNumber}
              onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
              className="bg-[#1a1a18] border-[#3a3a38] text-white placeholder:text-gray-600"
            />
            <p className="text-xs text-gray-500">
              Número de WhatsApp Business registrado en Twilio (formato internacional con +)
            </p>
          </div>

          {/* Webhook URL Info */}
          <div className="p-4 bg-[#1a1a18] rounded-lg border border-[#3a3a38]">
            <h4 className="text-sm font-medium text-gray-300 mb-2">URL del Webhook</h4>
            <code className="text-xs bg-black/50 text-orange-400 px-2 py-1 rounded block overflow-x-auto">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/api/twilio/webhook`
                : 'https://tu-dominio.com/api/twilio/webhook'
              }
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Configura esta URL en{' '}
              <a
                href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline"
              >
                Twilio Sandbox Settings
              </a>
              {' '}→ "When a message comes in"
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-[#3a3a38]">
            <Button
              onClick={handleSave}
              disabled={saving || !settings.accountSid || !settings.authToken || !settings.whatsappNumber}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-[#262624] border-[#3a3a38]">
        <CardHeader>
          <CardTitle className="text-white text-lg">¿Cómo configurar Twilio?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-400">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Creá una cuenta en{' '}
              <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                Twilio
              </a>
            </li>
            <li>Accedé a la consola y copiá el Account SID y Auth Token</li>
            <li>
              Activá el{' '}
              <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                WhatsApp Sandbox
              </a>
            </li>
            <li>Configurá la URL del webhook en "When a message comes in"</li>
            <li>Pegá las credenciales arriba y guardá</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
