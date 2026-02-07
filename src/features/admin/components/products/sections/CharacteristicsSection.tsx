'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ProductFormData } from '../types'

interface CharacteristicsSectionProps {
  formData: ProductFormData
  onChange: (data: Partial<ProductFormData>) => void
  disabled?: boolean
}

export function CharacteristicsSection({
  formData,
  onChange,
  disabled = false
}: CharacteristicsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Switch options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e1c]">
          <div>
            <Label className="text-[#fafafa] font-medium">Extra Load (XL)</Label>
            <p className="text-[#888888] text-xs mt-0.5">
              Neumático reforzado para mayor capacidad de carga
            </p>
          </div>
          <Switch
            checked={formData.extra_load}
            onCheckedChange={(checked) => onChange({ extra_load: checked })}
            disabled={disabled}
            className="data-[state=checked]:bg-[#d97757]"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e1c]">
          <div>
            <Label className="text-[#fafafa] font-medium">Run Flat</Label>
            <p className="text-[#888888] text-xs mt-0.5">
              Permite conducir con neumático desinflado
            </p>
          </div>
          <Switch
            checked={formData.run_flat}
            onCheckedChange={(checked) => onChange({ run_flat: checked })}
            disabled={disabled}
            className="data-[state=checked]:bg-[#d97757]"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e1c]">
          <div>
            <Label className="text-[#fafafa] font-medium">Seal Inside</Label>
            <p className="text-[#888888] text-xs mt-0.5">
              Tecnología de sellado ante pinchazos
            </p>
          </div>
          <Switch
            checked={formData.seal_inside}
            onCheckedChange={(checked) => onChange({ seal_inside: checked })}
            disabled={disabled}
            className="data-[state=checked]:bg-[#d97757]"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e1c]">
          <div>
            <Label className="text-[#fafafa] font-medium">Con Cámara</Label>
            <p className="text-[#888888] text-xs mt-0.5">
              Neumático que requiere cámara
            </p>
          </div>
          <Switch
            checked={formData.tube_type}
            onCheckedChange={(checked) => onChange({ tube_type: checked })}
            disabled={disabled}
            className="data-[state=checked]:bg-[#d97757]"
          />
        </div>
      </div>

      {/* Homologation */}
      <div className="space-y-2">
        <Label
          htmlFor="homologation"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          Homologación
        </Label>
        <Input
          id="homologation"
          value={formData.homologation || ''}
          onChange={(e) => onChange({ homologation: e.target.value || null })}
          disabled={disabled}
          placeholder="Ej: MO, N0, *"
          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
        />
        <p className="text-[#888888] text-xs">
          Código de homologación del fabricante (Mercedes, Porsche, BMW, etc.)
        </p>
      </div>
    </div>
  )
}
