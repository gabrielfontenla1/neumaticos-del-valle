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
import { Save, Loader2, Clock, MessageSquare, Settings, Power, CalendarClock } from 'lucide-react'
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

  const switchClass = "data-[state=checked]:bg-[#00a884]"

  return (
    <div className="space-y-4">
      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* General Settings */}
          <Card className="bg-[#202c33] border-[#2a3942] p-5">
            <div className="flex items-center gap-3 mb-5">
              <Settings className="h-5 w-5 text-[#00a884]" />
              <h3 className="text-base font-semibold text-white">Configuración General</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#e9edef]">Bot Activo</Label>
                  <p className="text-xs text-[#8696a0]">Habilitar o deshabilitar el bot</p>
                </div>
                <Switch
                  checked={config.isActive}
                  onCheckedChange={(checked) => onChange({ ...config, isActive: checked })}
                  className={switchClass}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#e9edef]">Modo Mantenimiento</Label>
                  <p className="text-xs text-[#8696a0]">Solo responde con mensaje de mantenimiento</p>
                </div>
                <Switch
                  checked={config.maintenanceMode}
                  onCheckedChange={(checked) => onChange({ ...config, maintenanceMode: checked })}
                  className={switchClass}
                />
              </div>
            </div>
          </Card>

          {/* Predefined Messages */}
          <Card className="bg-[#202c33] border-[#2a3942] p-5">
            <div className="flex items-center gap-3 mb-5">
              <MessageSquare className="h-5 w-5 text-[#00a884]" />
              <h3 className="text-base font-semibold text-white">Mensajes Predefinidos</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#e9edef] text-sm">Mensaje de Bienvenida</Label>
                <Textarea
                  value={config.welcomeMessage}
                  onChange={(e) => onChange({ ...config, welcomeMessage: e.target.value })}
                  placeholder="¡Hola! Soy el asistente virtual..."
                  className="bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[72px] text-sm"
                />
                <p className="text-[10px] text-[#8696a0]">Primer mensaje que recibe el usuario</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#e9edef] text-sm">Mensaje de Error</Label>
                <Textarea
                  value={config.errorMessage}
                  onChange={(e) => onChange({ ...config, errorMessage: e.target.value })}
                  placeholder="Disculpa, hubo un error..."
                  className="bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[72px] text-sm"
                />
                <p className="text-[10px] text-[#8696a0]">Mensaje cuando ocurre un error inesperado</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#e9edef] text-sm">Mensaje de Mantenimiento</Label>
                <Textarea
                  value={config.maintenanceMessage}
                  onChange={(e) => onChange({ ...config, maintenanceMessage: e.target.value })}
                  placeholder="El bot está en mantenimiento..."
                  className="bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[72px] text-sm"
                />
                <p className="text-[10px] text-[#8696a0]">Mensaje cuando el modo mantenimiento está activo</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Bot Schedule Mode */}
          <Card className="bg-[#202c33] border-[#2a3942] p-5">
            <div className="flex items-center gap-3 mb-5">
              <Clock className="h-5 w-5 text-[#00a884]" />
              <h3 className="text-base font-semibold text-white">Disponibilidad del Bot</h3>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => onChange({ ...config, respectBusinessHours: false })}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  !config.respectBusinessHours
                    ? 'bg-[#00a884]/15 border-[#00a884] ring-1 ring-[#00a884]/30'
                    : 'bg-[#111b21] border-[#2a3942] hover:border-[#3a4a52]'
                }`}
              >
                <div className={`p-2 rounded-lg ${!config.respectBusinessHours ? 'bg-[#00a884]/20' : 'bg-[#2a3942]'}`}>
                  <Power className={`h-4 w-4 ${!config.respectBusinessHours ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${!config.respectBusinessHours ? 'text-[#00a884]' : 'text-[#e9edef]'}`}>
                    Siempre Activo
                  </p>
                  <p className="text-[10px] text-[#8696a0]">24/7 sin restricción</p>
                </div>
              </button>

              <button
                onClick={() => onChange({ ...config, respectBusinessHours: true })}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  config.respectBusinessHours
                    ? 'bg-[#00a884]/15 border-[#00a884] ring-1 ring-[#00a884]/30'
                    : 'bg-[#111b21] border-[#2a3942] hover:border-[#3a4a52]'
                }`}
              >
                <div className={`p-2 rounded-lg ${config.respectBusinessHours ? 'bg-[#00a884]/20' : 'bg-[#2a3942]'}`}>
                  <CalendarClock className={`h-4 w-4 ${config.respectBusinessHours ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${config.respectBusinessHours ? 'text-[#00a884]' : 'text-[#e9edef]'}`}>
                    Por Horarios
                  </p>
                  <p className="text-[10px] text-[#8696a0]">Según horario laboral</p>
                </div>
              </button>
            </div>

            {/* Schedule - Only visible when "Por Horarios" is selected */}
            <div className={`space-y-2 transition-all duration-200 ${
              config.respectBusinessHours ? 'opacity-100' : 'opacity-30 pointer-events-none'
            }`}>
              {!config.respectBusinessHours && (
                <p className="text-xs text-[#8696a0] text-center mb-3">
                  El bot responde las 24 horas, los 7 días de la semana
                </p>
              )}
              {DAYS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 p-2.5 bg-[#111b21] border border-[#2a3942] rounded-lg"
                >
                  <Switch
                    checked={config.businessHours[key].enabled}
                    onCheckedChange={(checked) => updateBusinessHours(key, 'enabled', checked)}
                    className={switchClass}
                  />
                  <Label className="text-[#e9edef] text-sm w-20 shrink-0">{label}</Label>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={config.businessHours[key].start}
                      onChange={(e) => updateBusinessHours(key, 'start', e.target.value)}
                      disabled={!config.businessHours[key].enabled}
                      className="bg-[#202c33] border-[#2a3942] text-[#e9edef] h-8 text-sm"
                    />
                    <span className="text-[#8696a0]">-</span>
                    <Input
                      type="time"
                      value={config.businessHours[key].end}
                      onChange={(e) => updateBusinessHours(key, 'end', e.target.value)}
                      disabled={!config.businessHours[key].enabled}
                      className="bg-[#202c33] border-[#2a3942] text-[#e9edef] h-8 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Limits and Timeouts */}
          <Card className="bg-[#202c33] border-[#2a3942] p-5">
            <div className="flex items-center gap-3 mb-5">
              <Settings className="h-5 w-5 text-[#00a884]" />
              <h3 className="text-base font-semibold text-white">Límites y Timeouts</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#e9edef] text-sm">Mensajes por Conversación</Label>
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
                    className="bg-[#111b21] border-[#2a3942] text-[#e9edef] h-8 text-sm"
                  />
                  <p className="text-[10px] text-[#8696a0]">Máximo antes de resetear contexto</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#e9edef] text-sm">Timeout de IA (seg)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="120"
                    value={config.aiResponseTimeout}
                    onChange={(e) =>
                      onChange({ ...config, aiResponseTimeout: parseInt(e.target.value) })
                    }
                    className="bg-[#111b21] border-[#2a3942] text-[#e9edef] h-8 text-sm"
                  />
                  <p className="text-[10px] text-[#8696a0]">Tiempo máximo de espera para IA</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#e9edef]">Alertas de Cola</Label>
                  <p className="text-xs text-[#8696a0]">Notificar con muchos mensajes en cola</p>
                </div>
                <Switch
                  checked={config.enableQueueAlerts}
                  onCheckedChange={(checked) => onChange({ ...config, enableQueueAlerts: checked })}
                  className={switchClass}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#e9edef]">Alertas de Errores</Label>
                  <p className="text-xs text-[#8696a0]">Notificar con errores frecuentes</p>
                </div>
                <Switch
                  checked={config.enableErrorAlerts}
                  onCheckedChange={(checked) => onChange({ ...config, enableErrorAlerts: checked })}
                  className={switchClass}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

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
