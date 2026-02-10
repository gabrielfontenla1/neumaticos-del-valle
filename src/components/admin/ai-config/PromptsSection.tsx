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
    <div className="relative">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,168,132,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,168,132,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,168,132,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,168,132,0.02)_1px,transparent_1px)] bg-[size:25px_25px] animate-pulse" />
      </div>

      <div className="relative space-y-6">
        {/* WhatsApp System Prompt */}
        <Card className="bg-[#202c33] border-[#2a3942] p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">System Prompt de WhatsApp</h3>
                <p className="text-sm text-gray-400">
                  Instrucciones principales para el asistente de WhatsApp
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
                {charCount.toLocaleString()} caracteres
              </Badge>
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300 text-sm">
                Variables disponibles: <code className="text-blue-200">{'{customer_name}'}</code>,{' '}
                <code className="text-blue-200">{'{branch_name}'}</code>,{' '}
                <code className="text-blue-200">{'{service_type}'}</code>
              </AlertDescription>
            </Alert>

            <Textarea
              value={config.whatsappSystemPrompt}
              onChange={(e) =>
                onChange({
                  ...config,
                  whatsappSystemPrompt: e.target.value,
                })
              }
              placeholder="Sos un asistente virtual de..."
              className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[300px]"
            />

            {!isValidLength && (
              <p className="text-xs text-red-400">
                El prompt debe tener entre 100 y 50,000 caracteres
              </p>
            )}

            {/* Test Prompt */}
            <div className="border-t border-[#2a3942] pt-4 space-y-3">
              <h4 className="text-sm font-medium text-white">Probar Prompt</h4>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Mensaje de prueba del usuario..."
                className="bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleTest}
                  disabled={isTesting || !testMessage}
                  variant="outline"
                  className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
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
                <div className="bg-[#111b21] border border-[#2a3942] rounded-lg p-4">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Save Button - Inside the section */}
        <Card className="bg-[#202c33] border-[#2a3942] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Este es el prompt principal que define la personalidad del bot
            </p>
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
        </Card>
      </div>
    </div>
  )
}
