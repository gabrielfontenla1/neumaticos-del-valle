/**
 * AI Configuration Panel
 * Main component for AI configuration with sectioned UI
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  MessageSquare,
  Wrench,
  Settings,
  Bot,
  AlertCircle,
  Radio,
  Sparkles,
} from 'lucide-react'
import { PromptsSection } from './PromptsSection'
import { SpecializedPromptsSection } from './SpecializedPromptsSection'
import { FunctionToolsSection } from './FunctionToolsSection'
import { ModelsSection } from './ModelsSection'
import { BotConfigSection } from './BotConfigSection'
import { SourceConfigSection } from './SourceConfigSection'
import type {
  AIPromptsConfig,
  WhatsAppFunctionToolsConfig,
  AIModelConfig,
  WhatsAppBotConfig,
} from '@/lib/ai/config-types'

type Section = 'prompts' | 'specialized' | 'functions' | 'models' | 'bot' | 'sources'

export function AIConfigPanel() {
  const [activeSection, setActiveSection] = useState<Section>('prompts')
  const [isDirty, setIsDirty] = useState(false)

  // Configuration states
  const [promptsConfig, setPromptsConfig] = useState<AIPromptsConfig | null>(null)
  const [functionsConfig, setFunctionsConfig] = useState<WhatsAppFunctionToolsConfig | null>(null)
  const [modelsConfig, setModelsConfig] = useState<AIModelConfig | null>(null)
  const [botConfig, setBotConfig] = useState<WhatsAppBotConfig | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load configurations
  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setIsLoading(true)

    try {
      const [promptsRes, functionsRes, modelsRes, botRes] = await Promise.all([
        fetch('/api/admin/settings/ai/prompts'),
        fetch('/api/admin/settings/ai/function-tools'),
        fetch('/api/admin/settings/ai/models'),
        fetch('/api/admin/settings/ai/whatsapp-bot'),
      ])

      if (!promptsRes.ok || !functionsRes.ok || !modelsRes.ok || !botRes.ok) {
        throw new Error('Error al cargar las configuraciones')
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
      toast.error(err instanceof Error ? err.message : 'Error al cargar las configuraciones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePrompts = async () => {
    if (!promptsConfig) return
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/settings/ai/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptsConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setIsDirty(false)
      toast.success('Prompts guardados correctamente')

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ai_prompts_config' }),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar prompts')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFunctions = async () => {
    if (!functionsConfig) return
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/settings/ai/function-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(functionsConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setIsDirty(false)
      toast.success('Funciones guardadas correctamente')

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'whatsapp_function_tools' }),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar funciones')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveModels = async () => {
    if (!modelsConfig) return
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/settings/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelsConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setIsDirty(false)
      toast.success('Modelos guardados correctamente')

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ai_models_config' }),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar modelos')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBot = async () => {
    if (!botConfig) return
    setIsSaving(true)

    try {
      const response = await fetch('/api/admin/settings/ai/whatsapp-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setIsDirty(false)
      toast.success('Configuración del bot guardada correctamente')

      // Invalidate cache
      await fetch('/api/admin/settings/ai/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'whatsapp_bot_config' }),
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar configuración del bot')
    } finally {
      setIsSaving(false)
    }
  }

  const sections = [
    { id: 'prompts' as const, label: 'Prompt Principal', icon: MessageSquare },
    { id: 'specialized' as const, label: 'Prompts Especializados', icon: Sparkles },
    { id: 'functions' as const, label: 'Function Calling', icon: Wrench },
    { id: 'models' as const, label: 'Modelos y Parámetros', icon: Bot },
    { id: 'bot' as const, label: 'Config Bot WhatsApp', icon: Settings },
    { id: 'sources' as const, label: 'Fuentes WhatsApp', icon: Radio },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00a884] border-r-transparent"></div>
          <p className="mt-4 text-[#8696a0]">Cargando configuración...</p>
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
    <div className="h-full grid grid-cols-[280px_1fr] gap-6 overflow-hidden p-4">
      {/* Sidebar Navigation - Fixed width, full height */}
      <Card className="bg-[#202c33]/80 backdrop-blur-sm border-[#2a3942] p-4 overflow-hidden flex flex-col">
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#00a884] text-white'
                    : 'text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            )
          })}
        </div>

        {/* Spacer - pushes status to bottom */}
        <div className="flex-1 min-h-0" />

        {/* Status Indicator - sticky at bottom */}
        <div className="pt-4 border-t border-[#2a3942] mt-auto">
          {isDirty && (
            <Badge variant="outline" className="w-full bg-amber-500/20 text-amber-400 border-amber-500/30">
              Cambios sin guardar
            </Badge>
          )}
        </div>
      </Card>

      {/* Main Content Area - Grid column 2, full height with internal scroll */}
      <div className="overflow-hidden flex flex-col relative">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-6"
            >
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

              {activeSection === 'specialized' && (
                <SpecializedPromptsSection
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

              {activeSection === 'sources' && (
                <SourceConfigSection />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
