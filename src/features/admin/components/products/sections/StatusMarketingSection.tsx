'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProductFormData } from '../types'

interface StatusMarketingSectionProps {
  formData: ProductFormData
  onChange: (data: Partial<ProductFormData>) => void
  disabled?: boolean
}

const STATUSES = [
  { value: 'active', label: 'Activo', color: '#22c55e' },
  { value: 'inactive', label: 'Inactivo', color: '#888888' },
  { value: 'out_of_stock', label: 'Sin Stock', color: '#ef4444' },
]

export function StatusMarketingSection({
  formData,
  onChange,
  disabled = false
}: StatusMarketingSectionProps) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="space-y-2">
        <Label
          htmlFor="status"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          Estado
        </Label>
        <Select
          value={formData.status}
          onValueChange={(value) => onChange({ status: value as 'active' | 'inactive' | 'out_of_stock' })}
          disabled={disabled}
        >
          <SelectTrigger className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] [&>span]:text-[#fafafa]">
            <SelectValue placeholder="Seleccionar estado" className="text-[#fafafa]" />
          </SelectTrigger>
          <SelectContent className="bg-[#262626] border-[#3a3a38] text-[#fafafa]">
            {STATUSES.map((s) => (
              <SelectItem
                key={s.value}
                value={s.value}
                className="text-[#fafafa] hover:bg-[#3a3a38] focus:bg-[#3a3a38] focus:text-[#fafafa] [&>span]:text-[#fafafa]"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Marketing Flags */}
      <div className="space-y-4">
        <h3 className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
          Marketing
        </h3>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e1c]">
          <div>
            <Label className="text-[#fafafa] font-medium">Destacado</Label>
            <p className="text-[#888888] text-xs mt-0.5">
              Mostrar en la sección de productos destacados
            </p>
          </div>
          <Switch
            checked={formData.featured}
            onCheckedChange={(checked) => onChange({ featured: checked })}
            disabled={disabled}
            className="data-[state=checked]:bg-[#d97757]"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e1c]">
          <div>
            <Label className="text-[#fafafa] font-medium">Best Seller</Label>
            <p className="text-[#888888] text-xs mt-0.5">
              Marcar como producto más vendido
            </p>
          </div>
          <Switch
            checked={formData.best_seller}
            onCheckedChange={(checked) => onChange({ best_seller: checked })}
            disabled={disabled}
            className="data-[state=checked]:bg-[#d97757]"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e1c]">
          <div>
            <Label className="text-[#fafafa] font-medium">Nuevo</Label>
            <p className="text-[#888888] text-xs mt-0.5">
              Mostrar etiqueta de nuevo producto
            </p>
          </div>
          <Switch
            checked={formData.new_arrival}
            onCheckedChange={(checked) => onChange({ new_arrival: checked })}
            disabled={disabled}
            className="data-[state=checked]:bg-[#d97757]"
          />
        </div>
      </div>
    </div>
  )
}
