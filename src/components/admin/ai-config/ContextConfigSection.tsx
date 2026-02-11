/**
 * Context Enrichment Config Section
 * Configure product search, FAQ search, and token limits for WhatsApp AI
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Save,
  Loader2,
  Search,
  MessageSquareText,
  Zap,
  Info,
} from 'lucide-react'
import type { WhatsAppContextConfig } from '@/lib/ai/config-types'

interface ContextConfigSectionProps {
  config: WhatsAppContextConfig
  onChange: (config: WhatsAppContextConfig) => void
  onSave: () => Promise<void>
  isSaving: boolean
}

export function ContextConfigSection({
  config,
  onChange,
  onSave,
  isSaving,
}: ContextConfigSectionProps) {
  const update = (partial: Partial<WhatsAppContextConfig>) => {
    onChange({ ...config, ...partial })
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Contexto inteligente para WhatsApp</p>
            <p className="text-blue-300/80">
              Estos parámetros controlan cómo el bot de WhatsApp enriquece sus respuestas
              con productos reales y preguntas frecuentes. Cuando están activos, el bot busca
              productos y FAQs relevantes antes de responder, logrando respuestas de calidad
              similar al simulador del panel admin.
            </p>
          </div>
        </div>
      </Card>

      {/* Product Search */}
      <Card className="bg-[#202c33] border-[#2a3942] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Search className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Búsqueda de Productos</h3>
            <p className="text-sm text-gray-400">
              Inyecta productos reales de la base de datos en el contexto de la IA
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#e9edef] text-sm font-medium">
                Búsqueda de productos activa
              </Label>
              <p className="text-xs text-[#8696a0] mt-0.5">
                Si se desactiva, el bot no inyectará productos en sus respuestas
              </p>
            </div>
            <Switch
              checked={config.enableProductSearch}
              onCheckedChange={(checked) => update({ enableProductSearch: checked })}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {config.enableProductSearch && (
            <>
              {/* Semantic threshold */}
              <div className="space-y-2">
                <Label className="text-[#e9edef] text-sm font-medium">
                  Umbral de similitud semántica
                </Label>
                <Input
                  type="number"
                  value={config.semanticSearchThreshold}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v)) update({ semanticSearchThreshold: Math.max(0.3, Math.min(0.95, v)) })
                  }}
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  className="bg-[#111b21] border-[#2a3942] text-[#e9edef] w-32 h-9 text-sm"
                />
                <p className="text-[10px] text-[#8696a0]">
                  Valor entre 0.30 (más resultados, menos precisos) y 0.95 (menos resultados, más precisos). Recomendado: 0.65
                </p>
              </div>

              {/* Max products */}
              <div className="space-y-2">
                <Label className="text-[#e9edef] text-sm font-medium">
                  Máximo de productos a inyectar
                </Label>
                <Input
                  type="number"
                  value={config.maxProductResults}
                  onChange={(e) => update({ maxProductResults: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })}
                  min={1}
                  max={50}
                  className="bg-[#111b21] border-[#2a3942] text-[#e9edef] w-32 h-9 text-sm"
                />
                <p className="text-[10px] text-[#8696a0]">
                  Cantidad máxima de productos incluidos en el contexto (1-50)
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* FAQ Search */}
      <Card className="bg-[#202c33] border-[#2a3942] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <MessageSquareText className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Búsqueda de FAQs</h3>
            <p className="text-sm text-gray-400">
              Inyecta preguntas frecuentes relevantes en el contexto de la IA
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#e9edef] text-sm font-medium">
                Búsqueda de FAQs activa
              </Label>
              <p className="text-xs text-[#8696a0] mt-0.5">
                Si se desactiva, el bot no incluirá FAQs en sus respuestas
              </p>
            </div>
            <Switch
              checked={config.enableFaqSearch}
              onCheckedChange={(checked) => update({ enableFaqSearch: checked })}
              className="data-[state=checked]:bg-[#00a884]"
            />
          </div>

          {config.enableFaqSearch && (
            <div className="space-y-2">
              <Label className="text-[#e9edef] text-sm font-medium">
                Máximo de FAQs a inyectar
              </Label>
              <Input
                type="number"
                value={config.maxFaqResults}
                onChange={(e) => update({ maxFaqResults: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                min={1}
                max={20}
                className="bg-[#111b21] border-[#2a3942] text-[#e9edef] w-32 h-9 text-sm"
              />
              <p className="text-[10px] text-[#8696a0]">
                Cantidad máxima de FAQs incluidas en el contexto (1-20)
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Token Limits */}
      <Card className="bg-[#202c33] border-[#2a3942] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Límites de Tokens</h3>
            <p className="text-sm text-gray-400">
              Controla la longitud máxima de las respuestas generadas por la IA
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Function calling max tokens */}
          <div className="space-y-2">
            <Label className="text-[#e9edef] text-sm font-medium">
              Max tokens - Function Calling
            </Label>
            <Input
              type="number"
              value={config.functionCallingMaxTokens}
              onChange={(e) => update({ functionCallingMaxTokens: Math.max(100, Math.min(4000, parseInt(e.target.value) || 100)) })}
              min={100}
              max={4000}
              step={50}
              className="bg-[#111b21] border-[#2a3942] text-[#e9edef] h-9 text-sm"
            />
            <p className="text-[10px] text-[#8696a0]">
              Tokens máximos para respuestas del Function Calling (Step 5). Valores altos = respuestas más largas pero más costosas.
            </p>
          </div>

          {/* Fallback max tokens */}
          <div className="space-y-2">
            <Label className="text-[#e9edef] text-sm font-medium">
              Max tokens - Fallback IA
            </Label>
            <Input
              type="number"
              value={config.fallbackMaxTokens}
              onChange={(e) => update({ fallbackMaxTokens: Math.max(100, Math.min(4000, parseInt(e.target.value) || 100)) })}
              min={100}
              max={4000}
              step={50}
              className="bg-[#111b21] border-[#2a3942] text-[#e9edef] h-9 text-sm"
            />
            <p className="text-[10px] text-[#8696a0]">
              Tokens máximos para el fallback de IA (Step 8). Se usa cuando Function Calling no maneja el mensaje.
            </p>
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
          Guardar Configuración de Contexto
        </Button>
      </div>
    </div>
  )
}
