'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProductFormData } from '../types'

interface GeneralInfoSectionProps {
  formData: ProductFormData
  onChange: (data: Partial<ProductFormData>) => void
  disabled?: boolean
}

export function GeneralInfoSection({
  formData,
  onChange,
  disabled = false
}: GeneralInfoSectionProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          Nombre *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          disabled={disabled}
          placeholder="Nombre del producto"
          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
        />
      </div>

      {/* SKU (Read-only) */}
      <div className="space-y-2">
        <Label
          htmlFor="sku"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          SKU
        </Label>
        <Input
          id="sku"
          value={formData.sku}
          disabled
          className="bg-[#1a1a1a] border-[#3a3a38] text-[#888888] cursor-not-allowed"
        />
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label
          htmlFor="brand_name"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          Marca
        </Label>
        <Input
          id="brand_name"
          value={formData.brand_name || ''}
          onChange={(e) => onChange({ brand_name: e.target.value })}
          disabled={disabled}
          placeholder="Marca del producto"
          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
        >
          Descripción
        </Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          placeholder="Descripción del producto"
          rows={3}
          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666] resize-none"
        />
      </div>

      {/* Prices Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="price"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Precio
          </Label>
          <Input
            id="price"
            type="number"
            value={formData.price || ''}
            onChange={(e) => onChange({ price: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            placeholder="0"
            min="0"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="sale_price"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Precio Oferta
          </Label>
          <Input
            id="sale_price"
            type="number"
            value={formData.sale_price || ''}
            onChange={(e) => onChange({ sale_price: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            placeholder="0"
            min="0"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
      </div>

      {/* Stock Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="stock"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Stock
          </Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => onChange({ stock: Number(e.target.value) || 0 })}
            disabled={disabled}
            placeholder="0"
            min="0"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="min_stock_alert"
            className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide"
          >
            Alerta Stock Mínimo
          </Label>
          <Input
            id="min_stock_alert"
            type="number"
            value={formData.min_stock_alert}
            onChange={(e) => onChange({ min_stock_alert: Number(e.target.value) || 0 })}
            disabled={disabled}
            placeholder="5"
            min="0"
            className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
          />
        </div>
      </div>
    </div>
  )
}
