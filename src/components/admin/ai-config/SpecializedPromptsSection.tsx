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
    <div className="space-y-4">
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Product Prompt */}
            <Card className="bg-[#202c33] border-[#2a3942] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#00a884]/20">
                  <ShoppingBag className="h-4 w-4 text-[#00a884]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Prompt de Productos</h3>
                  <p className="text-xs text-[#8696a0]">Experto en neumáticos y catálogo</p>
                </div>
              </div>
              <Textarea
                value={config.productPrompt}
                onChange={(e) => onChange({ ...config, productPrompt: e.target.value })}
                placeholder="Sos un experto en neumáticos..."
                className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[150px] resize-none"
              />
            </Card>

            {/* Technical Prompt */}
            <Card className="bg-[#202c33] border-[#2a3942] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Wrench className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Prompt Técnico</h3>
                  <p className="text-xs text-[#8696a0]">Especialista en gomería y mecánica</p>
                </div>
              </div>
              <Textarea
                value={config.technicalPrompt}
                onChange={(e) => onChange({ ...config, technicalPrompt: e.target.value })}
                placeholder="Sos un técnico especializado..."
                className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[150px] resize-none"
              />
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Sales Prompt */}
            <Card className="bg-[#202c33] border-[#2a3942] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Prompt de Ventas</h3>
                  <p className="text-xs text-[#8696a0]">Ventas consultivas y conversión</p>
                </div>
              </div>
              <Textarea
                value={config.salesPrompt}
                onChange={(e) => onChange({ ...config, salesPrompt: e.target.value })}
                placeholder="Sos un vendedor consultivo..."
                className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[150px] resize-none"
              />
            </Card>

            {/* FAQ Prompt */}
            <Card className="bg-[#202c33] border-[#2a3942] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <HelpCircle className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Prompt de FAQ</h3>
                  <p className="text-xs text-[#8696a0]">Preguntas frecuentes</p>
                </div>
              </div>
              <Textarea
                value={config.faqPrompt}
                onChange={(e) => onChange({ ...config, faqPrompt: e.target.value })}
                placeholder="Respondé preguntas frecuentes..."
                className="font-mono text-sm bg-[#111b21] border-[#2a3942] text-[#e9edef] min-h-[150px] resize-none"
              />
            </Card>
          </div>
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
            Guardar Prompts
          </Button>
        </div>
    </div>
  )
}
