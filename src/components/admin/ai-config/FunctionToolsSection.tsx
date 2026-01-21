/**
 * Function Tools Section Component
 * Edit OpenAI function calling tools
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  TestTube2,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { JsonEditor } from '@/components/admin/JsonEditor'
import type { WhatsAppFunctionToolsConfig, FunctionTool } from '@/lib/ai/config-types'

interface FunctionToolsSectionProps {
  config: WhatsAppFunctionToolsConfig
  onChange: (config: WhatsAppFunctionToolsConfig) => void
  onSave: () => Promise<void>
  isSaving: boolean
}

export function FunctionToolsSection({
  config,
  onChange,
  onSave,
  isSaving,
}: FunctionToolsSectionProps) {
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set())
  const [testingTool, setTestingTool] = useState<number | null>(null)
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const toggleTool = (index: number) => {
    const newExpanded = new Set(expandedTools)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTools(newExpanded)
  }

  const updateTool = (index: number, updates: Partial<FunctionTool>) => {
    const newTools = [...config.tools]
    newTools[index] = { ...newTools[index], ...updates }
    onChange({ ...config, tools: newTools })
  }

  const updateToolParameters = (index: number, parametersJson: string) => {
    try {
      const parameters = JSON.parse(parametersJson)
      updateTool(index, { parameters })
    } catch (err) {
      // Invalid JSON, don't update
    }
  }

  const deleteTool = (index: number) => {
    const newTools = config.tools.filter((_, i) => i !== index)
    onChange({ ...config, tools: newTools })
  }

  const addTool = () => {
    const newTool: FunctionTool = {
      name: 'new_function',
      description: 'Nueva función',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    }
    onChange({ ...config, tools: [...config.tools, newTool] })
    setExpandedTools(new Set([...expandedTools, config.tools.length]))
  }

  const testTool = async (index: number) => {
    const tool = config.tools[index]
    setTestingTool(index)
    setTestResult(null)

    try {
      const response = await fetch('/api/admin/settings/ai/function-tools/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionTool: tool,
          testMessage,
        }),
      })

      const data = await response.json()
      if (data.success) {
        if (data.functionCalled) {
          setTestResult(
            `✅ Función invocada: ${data.functionName}\nArgumentos: ${JSON.stringify(data.arguments, null, 2)}`
          )
        } else {
          setTestResult(`⚠️ Función no invocada\nRazón: ${data.reason}\nRespuesta: ${data.response}`)
        }
      } else {
        setTestResult(`❌ Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTestingTool(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#262624] border-[#3a3a37] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Funciones de WhatsApp Bot</h3>
            <p className="text-sm text-gray-400">
              {config.tools.length} funciones configuradas (
              {config.tools.filter((t) => t.enabled).length} activas)
            </p>
          </div>
          <Button
            onClick={addTool}
            variant="outline"
            className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Función
          </Button>
        </div>

        <div className="space-y-3">
          {config.tools.map((tool, index) => (
            <Collapsible
              key={index}
              open={expandedTools.has(index)}
              onOpenChange={() => toggleTool(index)}
            >
              <Card className="bg-[#1a1a18] border-[#3a3a37]">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-[#2a2a28] transition-colors">
                  <div className="flex items-center gap-3">
                    {expandedTools.has(index) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-white">{tool.name}</code>
                        {tool.enabled ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            Activa
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{tool.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={(checked) => updateTool(index, { enabled: checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-4 border-t border-[#3a3a37]">
                    {/* Function Name */}
                    <div>
                      <label className="text-sm font-medium text-white">Nombre</label>
                      <Input
                        value={tool.name}
                        onChange={(e) => updateTool(index, { name: e.target.value })}
                        placeholder="function_name"
                        className="bg-[#262624] border-[#3a3a37] text-gray-100 font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formato: snake_case (ej: book_appointment)
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-white">Descripción</label>
                      <Textarea
                        value={tool.description}
                        onChange={(e) => updateTool(index, { description: e.target.value })}
                        placeholder="¿Qué hace esta función?"
                        className="bg-[#262624] border-[#3a3a37] text-gray-100 min-h-[60px]"
                      />
                    </div>

                    {/* Parameters JSON */}
                    <div>
                      <label className="text-sm font-medium text-white">Parámetros (JSON Schema)</label>
                      <JsonEditor
                        value={JSON.stringify(tool.parameters, null, 2)}
                        onChange={(value) => updateToolParameters(index, value)}
                        minHeight="200px"
                      />
                    </div>

                    {/* Test Function */}
                    <div className="border-t border-[#3a3a37] pt-4 space-y-3">
                      <h5 className="text-sm font-medium text-white">Probar Función</h5>
                      <Textarea
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        placeholder="Mensaje de prueba que debería invocar esta función..."
                        className="bg-[#262624] border-[#3a3a37] text-gray-100 min-h-[60px]"
                      />
                      <Button
                        onClick={() => testTool(index)}
                        disabled={testingTool === index || !testMessage}
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                      >
                        {testingTool === index ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <TestTube2 className="h-4 w-4 mr-2" />
                        )}
                        Probar con OpenAI
                      </Button>
                      {testResult && (
                        <div className="bg-[#262624] border border-[#3a3a37] rounded-lg p-3">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap">{testResult}</pre>
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <div className="border-t border-[#3a3a37] pt-4">
                      <Button
                        onClick={() => deleteTool(index)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar Función
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
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
          Guardar Funciones
        </Button>
      </div>
    </div>
  )
}
