/**
 * Specialized Prompts Section Component
 * Edit specialized AI prompts (product, sales, technical, faq)
 */

'use client'

import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save, Loader2, ShoppingBag, TrendingUp, Wrench, HelpCircle } from 'lucide-react'
import type { AIPromptsConfig } from '@/lib/ai/config-types'

interface SpecializedPromptsSectionProps {
  config: AIPromptsConfig
  onChange: (config: AIPromptsConfig) => void
  onSave: () => Promise<void>
  isSaving: boolean
}

export function SpecializedPromptsSection({ config, onChange, onSave, isSaving }: SpecializedPromptsSectionProps) {
  return (
    <div className="relative">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,168,132,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,168,132,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,168,132,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,168,132,0.02)_1px,transparent_1px)] bg-[size:25px_25px] animate-pulse" />
      </div>

      <div className="relative space-y-6">
        {/* Product Prompt */}
        <Card className="bg-[#202c33] border-[#2a3942] p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#00a884]/20">
                <ShoppingBag className="h-5 w-5 text-[#00a884]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Prompt de Productos</h3>
                <p className="text-sm text-gray-400">Experto en neumáticos y productos del catálogo</p>
              </div>
            </div>
            <Textarea
              value={config.productPrompt}
              onChange={(e) => onChange({ ...config, productPrompt: e.target.value })}
              placeholder="Sos un experto en neumáticos..."
              className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[150px]"
            />
          </div>
        </Card>

        {/* Sales Prompt */}
        <Card className="bg-[#202c33] border-[#2a3942] p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Prompt de Ventas</h3>
                <p className="text-sm text-gray-400">Enfoque en ventas consultivas y conversión</p>
              </div>
            </div>
            <Textarea
              value={config.salesPrompt}
              onChange={(e) => onChange({ ...config, salesPrompt: e.target.value })}
              placeholder="Sos un vendedor consultivo..."
              className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[150px]"
            />
          </div>
        </Card>

        {/* Technical Prompt */}
        <Card className="bg-[#202c33] border-[#2a3942] p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Wrench className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Prompt Técnico</h3>
                <p className="text-sm text-gray-400">Especialista en servicios de gomería y mecánica</p>
              </div>
            </div>
            <Textarea
              value={config.technicalPrompt}
              onChange={(e) => onChange({ ...config, technicalPrompt: e.target.value })}
              placeholder="Sos un técnico especializado..."
              className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[150px]"
            />
          </div>
        </Card>

        {/* FAQ Prompt */}
        <Card className="bg-[#202c33] border-[#2a3942] p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <HelpCircle className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Prompt de FAQ</h3>
                <p className="text-sm text-gray-400">Respondedor de preguntas frecuentes</p>
              </div>
            </div>
            <Textarea
              value={config.faqPrompt}
              onChange={(e) => onChange({ ...config, faqPrompt: e.target.value })}
              placeholder="Respondé preguntas frecuentes..."
              className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-gray-100 min-h-[150px]"
            />
          </div>
        </Card>

        {/* Save Button - Inside the section */}
        <Card className="bg-[#202c33] border-[#2a3942] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Estos prompts se usan según el contexto de la conversación
            </p>
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
              Guardar Prompts
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
