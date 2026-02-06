/**
 * Bot Configuration Section Component
 * Configure WhatsApp bot behavior, hours, messages, limits
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2, Clock, MessageSquare, Settings } from 'lucide-react'
import type { WhatsAppBotConfig } from '@/lib/ai/config-types'

interface BotConfigSectionProps {
  config: WhatsAppBotConfig
  onChange: (config: WhatsAppBotConfig) => void
  onSave: () => Promise<void>
  isSaving: boolean
}

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

export function BotConfigSection({ config, onChange, onSave, isSaving }: BotConfigSectionProps) {
  const updateBusinessHours = (
    day: keyof typeof config.businessHours,
    field: 'start' | 'end' | 'enabled',
    value: string | boolean
  ) => {
    onChange({
      ...config,
      businessHours: {
        ...config.businessHours,
        [day]: {
          ...config.businessHours[day],
          [field]: value,
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="bg-[#202c33] border-[#2a3942] p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-[#00a884]" />
            <h3 className="text-lg font-semibold text-white">Configuración General</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Bot Activo</Label>
              <p className="text-sm text-gray-400">Habilitar o deshabilitar el bot completamente</p>
            </div>
            <Switch
              checked={config.isActive}
              onCheckedChange={(checked) => onChange({ ...config, isActive: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Modo Mantenimiento</Label>
              <p className="text-sm text-gray-400">
                El bot solo responde con mensaje de mantenimiento
              </p>
            </div>
            <Switch
              checked={config.maintenanceMode}
              onCheckedChange={(checked) => onChange({ ...config, maintenanceMode: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Respetar Horario Laboral</Label>
              <p className="text-sm text-gray-400">
                Fuera de horario, el bot informa que está cerrado
              </p>
            </div>
            <Switch
              checked={config.respectBusinessHours}
              onCheckedChange={(checked) =>
                onChange({ ...config, respectBusinessHours: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Predefined Messages */}
      <Card className="bg-[#202c33] border-[#2a3942] p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-[#00a884]" />
            <h3 className="text-lg font-semibold text-white">Mensajes Predefinidos</h3>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Mensaje de Bienvenida</Label>
            <Textarea
              value={config.welcomeMessage}
              onChange={(e) => onChange({ ...config, welcomeMessage: e.target.value })}
              placeholder="¡Hola! Soy el asistente virtual..."
              className="bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[80px]"
            />
            <p className="text-xs text-gray-500">Primer mensaje que recibe el usuario</p>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Mensaje de Error</Label>
            <Textarea
              value={config.errorMessage}
              onChange={(e) => onChange({ ...config, errorMessage: e.target.value })}
              placeholder="Disculpa, hubo un error..."
              className="bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[80px]"
            />
            <p className="text-xs text-gray-500">Mensaje cuando ocurre un error inesperado</p>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Mensaje de Mantenimiento</Label>
            <Textarea
              value={config.maintenanceMessage}
              onChange={(e) => onChange({ ...config, maintenanceMessage: e.target.value })}
              placeholder="El bot está en mantenimiento..."
              className="bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[80px]"
            />
            <p className="text-xs text-gray-500">Mensaje cuando el modo mantenimiento está activo</p>
          </div>
        </div>
      </Card>

      {/* Business Hours */}
      <Card className="bg-[#202c33] border-[#2a3942] p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-[#00a884]" />
            <h3 className="text-lg font-semibold text-white">Horarios Laborales</h3>
          </div>

          <div className="space-y-3">
            {DAYS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center gap-4 p-3 bg-[#111b21] border border-[#2a3942] rounded-lg"
              >
                <Switch
                  checked={config.businessHours[key].enabled}
                  onCheckedChange={(checked) => updateBusinessHours(key, 'enabled', checked)}
                />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <Label className="text-white">{label}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={config.businessHours[key].start}
                      onChange={(e) => updateBusinessHours(key, 'start', e.target.value)}
                      disabled={!config.businessHours[key].enabled}
                      className="bg-[#202c33] border-[#2a3942] text-gray-100"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="time"
                      value={config.businessHours[key].end}
                      onChange={(e) => updateBusinessHours(key, 'end', e.target.value)}
                      disabled={!config.businessHours[key].enabled}
                      className="bg-[#202c33] border-[#2a3942] text-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Limits and Timeouts */}
      <Card className="bg-[#202c33] border-[#2a3942] p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Límites y Timeouts</h3>
            <p className="text-sm text-gray-400">Configuración de límites operacionales</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Mensajes por Conversación</Label>
              <Input
                type="number"
                min="1"
                max="200"
                value={config.maxMessagesPerConversation}
                onChange={(e) =>
                  onChange({
                    ...config,
                    maxMessagesPerConversation: parseInt(e.target.value),
                  })
                }
                className="bg-[#111b21] border-[#2a3942] text-gray-100"
              />
              <p className="text-xs text-gray-500">Máximo de mensajes antes de resetear contexto</p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Timeout de IA (segundos)</Label>
              <Input
                type="number"
                min="5"
                max="120"
                value={config.aiResponseTimeout}
                onChange={(e) =>
                  onChange({ ...config, aiResponseTimeout: parseInt(e.target.value) })
                }
                className="bg-[#111b21] border-[#2a3942] text-gray-100"
              />
              <p className="text-xs text-gray-500">Tiempo máximo de espera para respuesta de IA</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Alertas de Cola</Label>
              <p className="text-sm text-gray-400">Notificar cuando hay muchos mensajes en cola</p>
            </div>
            <Switch
              checked={config.enableQueueAlerts}
              onCheckedChange={(checked) => onChange({ ...config, enableQueueAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Alertas de Errores</Label>
              <p className="text-sm text-gray-400">Notificar cuando ocurren errores frecuentes</p>
            </div>
            <Switch
              checked={config.enableErrorAlerts}
              onCheckedChange={(checked) => onChange({ ...config, enableErrorAlerts: checked })}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-[#00a884] hover:bg-[#02906f] text-white"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
