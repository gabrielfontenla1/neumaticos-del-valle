/**
 * Models Section Component
 * Configure AI models and parameters
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Loader2, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AIModelConfig } from '@/lib/ai/config-types'

interface ModelsSectionProps {
  config: AIModelConfig
  onChange: (config: AIModelConfig) => void
  onSave: () => Promise<void>
  isSaving: boolean
}

const AVAILABLE_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (Más potente, más caro)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini (Balance precio/calidad)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Más rápido, económico)' },
]

export function ModelsSection({ config, onChange, onSave, isSaving }: ModelsSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-[#262624] border-[#3a3a37] p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Modelos de IA</h3>
            <p className="text-sm text-gray-400">Configuración de modelos OpenAI</p>
          </div>

          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              Los modelos más potentes ofrecen mejor calidad pero cuestan más. GPT-4o-mini es
              recomendado para la mayoría de casos de uso.
            </AlertDescription>
          </Alert>

          {/* Chat Model */}
          <div className="space-y-2">
            <Label className="text-white">Modelo Principal (Chat)</Label>
            <Select value={config.chatModel} onValueChange={(value) => onChange({ ...config, chatModel: value })}>
              <SelectTrigger className="bg-[#1a1a18] border-[#3a3a37] text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#262624] border-[#3a3a37]">
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Modelo usado para conversaciones principales</p>
          </div>

          {/* Fast Model */}
          <div className="space-y-2">
            <Label className="text-white">Modelo Rápido</Label>
            <Select value={config.fastModel} onValueChange={(value) => onChange({ ...config, fastModel: value })}>
              <SelectTrigger className="bg-[#1a1a18] border-[#3a3a37] text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#262624] border-[#3a3a37]">
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Modelo para respuestas rápidas y simples</p>
          </div>
        </div>
      </Card>

      <Card className="bg-[#262624] border-[#3a3a37] p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Parámetros del Modelo</h3>
            <p className="text-sm text-gray-400">Ajusta el comportamiento de las respuestas</p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Temperature</Label>
              <span className="text-sm text-gray-400">{config.temperature}</span>
            </div>
            <Input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
              className="bg-[#1a1a18] border-[#3a3a37]"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Preciso (0)</span>
              <span>Balanceado (0.7)</span>
              <span>Creativo (2)</span>
            </div>
            <p className="text-xs text-gray-500">
              Controla la creatividad: valores bajos (0-0.5) son más determinísticos, valores altos
              (1-2) más creativos
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Max Tokens</Label>
              <span className="text-sm text-gray-400">{config.maxTokens.toLocaleString()}</span>
            </div>
            <Input
              type="number"
              min="100"
              max="100000"
              step="100"
              value={config.maxTokens}
              onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) })}
              className="bg-[#1a1a18] border-[#3a3a37] text-gray-100"
            />
            <p className="text-xs text-gray-500">
              Máximo de tokens por respuesta (recomendado: 500-2000 para WhatsApp)
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Top P</Label>
              <span className="text-sm text-gray-400">{config.topP}</span>
            </div>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.topP}
              onChange={(e) => onChange({ ...config, topP: parseFloat(e.target.value) })}
              className="bg-[#1a1a18] border-[#3a3a37]"
            />
            <p className="text-xs text-gray-500">
              Controla la diversidad de tokens considerados (recomendado: 1)
            </p>
          </div>

          {/* Frequency Penalty */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Frequency Penalty</Label>
              <span className="text-sm text-gray-400">{config.frequencyPenalty}</span>
            </div>
            <Input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={config.frequencyPenalty}
              onChange={(e) =>
                onChange({ ...config, frequencyPenalty: parseFloat(e.target.value) })
              }
              className="bg-[#1a1a18] border-[#3a3a37]"
            />
            <p className="text-xs text-gray-500">
              Penaliza tokens que ya aparecieron (positivo reduce repeticiones)
            </p>
          </div>

          {/* Presence Penalty */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white">Presence Penalty</Label>
              <span className="text-sm text-gray-400">{config.presencePenalty}</span>
            </div>
            <Input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={config.presencePenalty}
              onChange={(e) =>
                onChange({ ...config, presencePenalty: parseFloat(e.target.value) })
              }
              className="bg-[#1a1a18] border-[#3a3a37]"
            />
            <p className="text-xs text-gray-500">
              Penaliza tokens nuevos (positivo fomenta hablar de temas nuevos)
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="bg-[#d97757] hover:bg-[#c86646] text-white"
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
