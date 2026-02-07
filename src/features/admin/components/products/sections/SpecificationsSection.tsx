'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProductFormData } from '../types'

interface SpecificationsSectionProps {
  formData: ProductFormData
  onChange: (data: Partial<ProductFormData>) => void
  disabled?: boolean
}

const SEASONS = [
  { value: 'all_season', label: 'Todas las Estaciones' },
  { value: 'summer', label: 'Verano' },
  { value: 'winter', label: 'Invierno' },
]

const CONSTRUCTIONS = [
  { value: 'R', label: 'Radial (R)' },
  { value: 'D', label: 'Diagonal (D)' },
  { value: 'B', label: 'Bias-Belted (B)' },
]

export function SpecificationsSection({
  formData,
  onChange,
  disabled = false
}: SpecificationsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Tire Dimensions Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="width"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Ancho (mm)
          </Label>
          <Input
            id="width"
            type="number"
            value={formData.width || ''}
            onChange={(e) => onChange({ width: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            placeholder="205"
            min="100"
            max="400"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="aspect_ratio"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Perfil (%)
          </Label>
          <Input
            id="aspect_ratio"
            type="number"
            value={formData.aspect_ratio || ''}
            onChange={(e) => onChange({ aspect_ratio: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            placeholder="55"
            min="20"
            max="100"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="rim_diameter"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Aro (pulgadas)
          </Label>
          <Input
            id="rim_diameter"
            type="number"
            value={formData.rim_diameter || ''}
            onChange={(e) => onChange({ rim_diameter: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            placeholder="16"
            min="10"
            max="30"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
      </div>

      {/* Construction */}
      <div className="space-y-2">
        <Label
          htmlFor="construction"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          Construcción
        </Label>
        <Select
          value={formData.construction || ''}
          onValueChange={(value) => onChange({ construction: value || null })}
          disabled={disabled}
        >
          <SelectTrigger className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] [&>span]:text-[#fafafa]">
            <SelectValue placeholder="Seleccionar construcción" className="text-[#fafafa]" />
          </SelectTrigger>
          <SelectContent className="bg-[#262626] border-[#3a3a38] text-[#fafafa]">
            {CONSTRUCTIONS.map((c) => (
              <SelectItem
                key={c.value}
                value={c.value}
                className="text-[#fafafa] hover:bg-[#3a3a38] focus:bg-[#3a3a38] focus:text-[#fafafa] [&>span]:text-[#fafafa]"
              >
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Load and Speed Indices */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="load_index"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Índice de Carga
          </Label>
          <Input
            id="load_index"
            type="number"
            value={formData.load_index || ''}
            onChange={(e) => onChange({ load_index: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            placeholder="91"
            min="60"
            max="200"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="speed_rating"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Índice de Velocidad
          </Label>
          <Input
            id="speed_rating"
            value={formData.speed_rating || ''}
            onChange={(e) => onChange({ speed_rating: e.target.value || null })}
            disabled={disabled}
            placeholder="V"
            maxLength={3}
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
      </div>

      {/* Season */}
      <div className="space-y-2">
        <Label
          htmlFor="season"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          Temporada
        </Label>
        <Select
          value={formData.season || ''}
          onValueChange={(value) => onChange({ season: value || null })}
          disabled={disabled}
        >
          <SelectTrigger className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] [&>span]:text-[#fafafa]">
            <SelectValue placeholder="Seleccionar temporada" className="text-[#fafafa]" />
          </SelectTrigger>
          <SelectContent className="bg-[#262626] border-[#3a3a38] text-[#fafafa]">
            {SEASONS.map((s) => (
              <SelectItem
                key={s.value}
                value={s.value}
                className="text-[#fafafa] hover:bg-[#3a3a38] focus:bg-[#3a3a38] focus:text-[#fafafa] [&>span]:text-[#fafafa]"
              >
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
