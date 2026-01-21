/**
 * AI Configuration Panel
 * Main component for AI configuration with sectioned UI
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MessageSquare,
  Wrench,
  Settings,
  Bot,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { PromptsSection } from './PromptsSection'
import { FunctionToolsSection } from './FunctionToolsSection'
import { ModelsSection } from './ModelsSection'
import { BotConfigSection } from './BotConfigSection'
import type {
  AIPromptsConfig,
  WhatsAppFunctionToolsConfig,
  AIModelConfig,
  WhatsAppBotConfig,
} from '@/lib/ai/config-types'

type Section = 'prompts' | 'functions' | 'models' | 'bot'

export function AIConfigPanel() {
  const [activeSection, setActiveSection] = useState<Section>('prompts')
  const [isDirty, setIsDirty] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Configuration states
  const [promptsConfig, setPromptsConfig] = useState<AIPromptsConfig | null>(null)
  const [functionsConfig, setFunctionsConfig] = useState<WhatsAppFunctionToolsConfig | null>(null)
  const [modelsConfig, setModelsConfig] = useState<AIModelConfig | null>(null)
  const [botConfig, setBotConfig] = useState<WhatsAppBotConfig | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load configurations
  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [promptsRes, functionsRes, modelsRes, botRes] = await Promise.all([
        fetch('/api/admin/settings/ai/prompts'),
        fetch('/api/admin/settings/ai/function-tools'),
        fetch('/api/admin/settings/ai/models'),
        fetch('/api/admin/settings/ai/whatsapp-bot'),
      ])

      if (!promptsRes.ok || !functionsRes.ok || !modelsRes.ok || !botRes.ok) {
        throw new Error('Failed to load configurations')
      }

      const [promptsData, functionsData, modelsData, botData] = await Promise.all([
        promptsRes.json(),
        functionsRes.json(),
        modelsRes.json(),
        botRes.json(),
      ])

      setPromptsConfig(promptsData.config)
      setFunctionsConfig(functionsData.config)
      setModelsConfig(modelsData.config)
      setBotConfig(botData.config)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading configurations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePrompts = async () => {
    if (!promptsConfig) return
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/settings/ai/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptsConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSaveSuccess(true)
      setIsDirty(false)
      setTimeout(() => setSaveSuccess(false), 3000)

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ai_prompts_config' }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFunctions = async () => {
    if (!functionsConfig) return
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/settings/ai/function-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(functionsConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSaveSuccess(true)
      setIsDirty(false)
      setTimeout(() => setSaveSuccess(false), 3000)

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'whatsapp_function_tools' }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveModels = async () => {
    if (!modelsConfig) return
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/settings/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelsConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSaveSuccess(true)
      setIsDirty(false)
      setTimeout(() => setSaveSuccess(false), 3000)

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ai_models_config' }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBot = async () => {
    if (!botConfig) return
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/settings/ai/whatsapp-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSaveSuccess(true)
      setIsDirty(false)
      setTimeout(() => setSaveSuccess(false), 3000)

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'whatsapp_bot_config' }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  const sections = [
    { id: 'prompts' as const, label: 'Prompts del Sistema', icon: MessageSquare },
    { id: 'functions' as const, label: 'Function Calling', icon: Wrench },
    { id: 'models' as const, label: 'Modelos y Parámetros', icon: Bot },
    { id: 'bot' as const, label: 'Config Bot WhatsApp', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#d97757] border-r-transparent"></div>
          <p className="mt-4 text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    )
  }

  if (!promptsConfig || !functionsConfig || !modelsConfig || !botConfig) {
    return (
      <Alert className="bg-red-500/10 border-red-500/30">
        <AlertCircle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-300">
          Error cargando configuración. Por favor, recarga la página.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-1 gap-6 min-h-0">
      {/* Sidebar Navigation */}
      <Card className="w-64 bg-[#262624] border-[#3a3a37] p-4 flex-shrink-0 flex flex-col">
        <div className="space-y-2 flex-shrink-0">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#d97757] text-white'
                    : 'text-gray-400 hover:bg-[#3a3a37] hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status Indicators */}
        <div className="pt-6 border-t border-[#3a3a37] space-y-3 flex-shrink-0">
          {isDirty && (
            <Badge variant="outline" className="w-full bg-amber-500/20 text-amber-400 border-amber-500/30">
              Cambios sin guardar
            </Badge>
          )}
          {saveSuccess && (
            <Badge variant="outline" className="w-full bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Guardado exitoso
            </Badge>
          )}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1">
          {activeSection === 'prompts' && (
            <PromptsSection
              config={promptsConfig}
              onChange={(config) => {
                setPromptsConfig(config)
                setIsDirty(true)
              }}
              onSave={handleSavePrompts}
              isSaving={isSaving}
            />
          )}

          {activeSection === 'functions' && (
            <FunctionToolsSection
              config={functionsConfig}
              onChange={(config) => {
                setFunctionsConfig(config)
                setIsDirty(true)
              }}
              onSave={handleSaveFunctions}
              isSaving={isSaving}
            />
          )}

          {activeSection === 'models' && (
            <ModelsSection
              config={modelsConfig}
              onChange={(config) => {
                setModelsConfig(config)
                setIsDirty(true)
              }}
              onSave={handleSaveModels}
              isSaving={isSaving}
            />
          )}

          {activeSection === 'bot' && (
            <BotConfigSection
              config={botConfig}
              onChange={(config) => {
                setBotConfig(config)
                setIsDirty(true)
              }}
              onSave={handleSaveBot}
              isSaving={isSaving}
            />
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
