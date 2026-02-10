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
    <div className="space-y-4">
      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Model Selection */}
        <Card className="bg-[#202c33] border-[#2a3942] p-5">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-white">Modelos de IA</h3>
            <p className="text-xs text-[#8696a0] mt-1">Configuración de modelos OpenAI</p>
          </div>

          <Alert className="bg-blue-500/10 border-blue-500/30 mb-5">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-xs">
              GPT-4o-mini es recomendado para la mayoría de casos. Los modelos más potentes cuestan más.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {/* Chat Model */}
            <div className="space-y-1.5">
              <Label className="text-[#e9edef] text-sm">Modelo Principal (Chat)</Label>
              <Select value={config.chatModel} onValueChange={(value) => onChange({ ...config, chatModel: value })}>
                <SelectTrigger className="bg-[#111b21] border-[#2a3942] text-[#e9edef] [&>span]:text-[#e9edef] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#202c33] border-[#2a3942] text-[#e9edef]">
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-[#e9edef] hover:bg-[#2a3942] focus:bg-[#2a3942] focus:text-[#e9edef]">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-[#8696a0]">Para conversaciones principales</p>
            </div>

            {/* Fast Model */}
            <div className="space-y-1.5">
              <Label className="text-[#e9edef] text-sm">Modelo Rápido</Label>
              <Select value={config.fastModel} onValueChange={(value) => onChange({ ...config, fastModel: value })}>
                <SelectTrigger className="bg-[#111b21] border-[#2a3942] text-[#e9edef] [&>span]:text-[#e9edef] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#202c33] border-[#2a3942] text-[#e9edef]">
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-[#e9edef] hover:bg-[#2a3942] focus:bg-[#2a3942] focus:text-[#e9edef]">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-[#8696a0]">Para respuestas rápidas y simples</p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#e9edef] text-sm">Max Tokens</Label>
                <span className="text-xs text-[#8696a0]">{config.maxTokens.toLocaleString()}</span>
              </div>
              <Input
                type="number"
                min="100"
                max="100000"
                step="100"
                value={config.maxTokens}
                onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) })}
                className="bg-[#111b21] border-[#2a3942] text-[#e9edef] h-9 text-sm"
              />
              <p className="text-[10px] text-[#8696a0]">Recomendado: 500-2000 para WhatsApp</p>
            </div>
          </div>
        </Card>

        {/* Right Column - Parameters */}
        <Card className="bg-[#202c33] border-[#2a3942] p-5">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-white">Parámetros del Modelo</h3>
            <p className="text-xs text-[#8696a0] mt-1">Ajusta el comportamiento de las respuestas</p>
          </div>

          <div className="space-y-5">
            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#e9edef] text-sm">Temperature</Label>
                <span className="text-xs text-[#8696a0] font-mono">{config.temperature}</span>
              </div>
              <Input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
                className="bg-[#111b21] border-[#2a3942]"
              />
              <div className="flex justify-between text-[10px] text-[#8696a0]">
                <span>Preciso (0)</span>
                <span>Balanceado (0.7)</span>
                <span>Creativo (2)</span>
              </div>
            </div>

            {/* Top P */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#e9edef] text-sm">Top P</Label>
                <span className="text-xs text-[#8696a0] font-mono">{config.topP}</span>
              </div>
              <Input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.topP}
                onChange={(e) => onChange({ ...config, topP: parseFloat(e.target.value) })}
                className="bg-[#111b21] border-[#2a3942]"
              />
              <p className="text-[10px] text-[#8696a0]">Diversidad de tokens (recomendado: 1)</p>
            </div>

            {/* Frequency Penalty */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#e9edef] text-sm">Frequency Penalty</Label>
                <span className="text-xs text-[#8696a0] font-mono">{config.frequencyPenalty}</span>
              </div>
              <Input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.frequencyPenalty}
                onChange={(e) => onChange({ ...config, frequencyPenalty: parseFloat(e.target.value) })}
                className="bg-[#111b21] border-[#2a3942]"
              />
              <p className="text-[10px] text-[#8696a0]">Positivo reduce repeticiones</p>
            </div>

            {/* Presence Penalty */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#e9edef] text-sm">Presence Penalty</Label>
                <span className="text-xs text-[#8696a0] font-mono">{config.presencePenalty}</span>
              </div>
              <Input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.presencePenalty}
                onChange={(e) => onChange({ ...config, presencePenalty: parseFloat(e.target.value) })}
                className="bg-[#111b21] border-[#2a3942]"
              />
              <p className="text-[10px] text-[#8696a0]">Positivo fomenta temas nuevos</p>
            </div>
          </div>
        </Card>
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
