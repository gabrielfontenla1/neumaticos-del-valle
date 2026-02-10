/**
 * Prompts Section Component
 * Edit main WhatsApp system prompt
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Save, TestTube2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { AIPromptsConfig } from '@/lib/ai/config-types'

interface PromptsSectionProps {
  config: AIPromptsConfig
  onChange: (config: AIPromptsConfig) => void
  onSave: () => Promise<void>
  isSaving: boolean
}

export function PromptsSection({ config, onChange, onSave, isSaving }: PromptsSectionProps) {
  const [testMessage, setTestMessage] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const handleTest = async () => {
    if (!testMessage) return

    setIsTesting(true)
    try {
      const response = await fetch('/api/admin/settings/ai/prompts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: config.whatsappSystemPrompt,
          testMessage,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTestResponse(data.response)
      } else {
        setTestResponse(`Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setTestResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTesting(false)
    }
  }

  const charCount = config.whatsappSystemPrompt.length
  const isValidLength = charCount >= 100 && charCount <= 50000

  return (
    <div className="space-y-4">
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column - System Prompt Editor */}
          <Card className="bg-[#202c33] border-[#2a3942] p-5 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">System Prompt de WhatsApp</h3>
                <p className="text-xs text-[#8696a0] mt-1">
                  Instrucciones principales para el asistente
                </p>
              </div>
              <Badge
                variant="outline"
                className={
                  isValidLength
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }
              >
                {charCount.toLocaleString()} chars
              </Badge>
            </div>

            <Textarea
              value={config.whatsappSystemPrompt}
              onChange={(e) =>
                onChange({
                  ...config,
                  whatsappSystemPrompt: e.target.value,
                })
              }
              placeholder="Sos un asistente virtual de..."
              className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-[#e9edef] flex-1 min-h-[380px] resize-none"
            />

            {!isValidLength && (
              <p className="text-xs text-red-400 mt-2">
                El prompt debe tener entre 100 y 50,000 caracteres
              </p>
            )}
          </Card>

          {/* Right Column - Info + Test */}
          <div className="space-y-4 flex flex-col">
            {/* Variables Info */}
            <Card className="bg-[#202c33] border-[#2a3942] p-5">
              <h4 className="text-sm font-medium text-white mb-3">Variables Disponibles</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-[#111b21] rounded-md border border-[#2a3942]">
                  <code className="text-[#00a884] text-xs font-mono">{'{customer_name}'}</code>
                  <span className="text-[10px] text-[#8696a0]">Nombre del cliente</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#111b21] rounded-md border border-[#2a3942]">
                  <code className="text-[#00a884] text-xs font-mono">{'{branch_name}'}</code>
                  <span className="text-[10px] text-[#8696a0]">Nombre de la sucursal</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#111b21] rounded-md border border-[#2a3942]">
                  <code className="text-[#00a884] text-xs font-mono">{'{service_type}'}</code>
                  <span className="text-[10px] text-[#8696a0]">Tipo de servicio</span>
                </div>
              </div>
            </Card>

            {/* Test Prompt */}
            <Card className="bg-[#202c33] border-[#2a3942] p-5 flex-1 flex flex-col">
              <h4 className="text-sm font-medium text-white mb-3">Probar Prompt</h4>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Mensaje de prueba del usuario..."
                className="bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[80px] text-sm"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleTest}
                  disabled={isTesting || !testMessage}
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube2 className="h-4 w-4 mr-2" />
                  )}
                  Probar con OpenAI
                </Button>
              </div>
              {testResponse && (
                <div className="bg-[#111b21] border border-[#2a3942] rounded-lg p-3 mt-3 flex-1 overflow-y-auto">
                  <p className="text-sm text-[#e9edef] whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={onSave}
            disabled={isSaving || !isValidLength}
            className="bg-[#00a884] hover:bg-[#02906f] text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Prompt
          </Button>
        </div>
    </div>
  )
}
