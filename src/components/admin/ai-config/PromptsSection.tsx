/**
 * Prompts Section Component
 * Edit AI system prompts
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
  const [testPrompt, setTestPrompt] = useState('')
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
    <div className="space-y-6">
      {/* WhatsApp System Prompt */}
      <Card className="bg-[#262624] border-[#3a3a37] p-6">
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
            className="font-mono text-sm bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[300px]"
          />

          {!isValidLength && (
            <p className="text-xs text-red-400">
              El prompt debe tener entre 100 y 50,000 caracteres
            </p>
          )}

          {/* Test Prompt */}
          <div className="border-t border-[#3a3a37] pt-4 space-y-3">
            <h4 className="text-sm font-medium text-white">Probar Prompt</h4>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Mensaje de prueba del usuario..."
              className="bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[80px]"
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
              <div className="bg-[#1a1a18] border border-[#3a3a37] rounded-lg p-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{testResponse}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Other Prompts */}
      <Card className="bg-[#262624] border-[#3a3a37] p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Prompts Especializados</h3>

          <div className="space-y-4">
            {/* Product Prompt */}
            <div>
              <label className="text-sm font-medium text-white">Prompt de Productos</label>
              <p className="text-xs text-gray-400 mb-2">Experto en neumáticos y productos</p>
              <Textarea
                value={config.productPrompt}
                onChange={(e) => onChange({ ...config, productPrompt: e.target.value })}
                className="bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[80px]"
              />
            </div>

            {/* Sales Prompt */}
            <div>
              <label className="text-sm font-medium text-white">Prompt de Ventas</label>
              <p className="text-xs text-gray-400 mb-2">Enfoque en ventas consultivas</p>
              <Textarea
                value={config.salesPrompt}
                onChange={(e) => onChange({ ...config, salesPrompt: e.target.value })}
                className="bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[80px]"
              />
            </div>

            {/* Technical Prompt */}
            <div>
              <label className="text-sm font-medium text-white">Prompt Técnico</label>
              <p className="text-xs text-gray-400 mb-2">Especialista en servicios de gomería</p>
              <Textarea
                value={config.technicalPrompt}
                onChange={(e) => onChange({ ...config, technicalPrompt: e.target.value })}
                className="bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[80px]"
              />
            </div>

            {/* FAQ Prompt */}
            <div>
              <label className="text-sm font-medium text-white">Prompt de FAQ</label>
              <p className="text-xs text-gray-400 mb-2">Respondedor de preguntas frecuentes</p>
              <Textarea
                value={config.faqPrompt}
                onChange={(e) => onChange({ ...config, faqPrompt: e.target.value })}
                className="bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[80px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={isSaving || !isValidLength}
          className="bg-[#d97757] hover:bg-[#c86646] text-white"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Prompts
        </Button>
      </div>
    </div>
  )
}
