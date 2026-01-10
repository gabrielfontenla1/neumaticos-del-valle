'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { OrderStatus, OrderSource, PaymentStatus, type OrderFilters } from '@/features/orders/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OrderFiltersProps {
  onFilterChange: (filters: OrderFilters) => void
  loading?: boolean
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: OrderStatus.PENDING, label: 'Pendiente' },
  { value: OrderStatus.CONFIRMED, label: 'Confirmado' },
  { value: OrderStatus.PROCESSING, label: 'En proceso' },
  { value: OrderStatus.SHIPPED, label: 'Enviado' },
  { value: OrderStatus.DELIVERED, label: 'Entregado' },
  { value: OrderStatus.CANCELLED, label: 'Cancelado' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Todos los pagos' },
  { value: PaymentStatus.PENDING, label: 'Pendiente' },
  { value: PaymentStatus.COMPLETED, label: 'Completado' },
  { value: PaymentStatus.FAILED, label: 'Fallido' },
  { value: PaymentStatus.REFUNDED, label: 'Reembolsado' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'Todas las fuentes' },
  { value: OrderSource.WEBSITE, label: 'Sitio Web' },
  { value: OrderSource.PHONE, label: 'Teléfono' },
  { value: OrderSource.WHATSAPP, label: 'WhatsApp' },
  { value: OrderSource.IN_STORE, label: 'En Tienda' },
  { value: OrderSource.ADMIN, label: 'Admin' },
]

export function OrderFilters({ onFilterChange, loading }: OrderFiltersProps) {
  const [filters, setFilters] = useState<OrderFilters>({
    status: undefined,
    payment_status: undefined,
    source: undefined,
    date_from: undefined,
    date_to: undefined,
    search: undefined,
    page: 1,
    limit: 20,
  })

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined,
      page: 1,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSearchChange = (value: string) => {
    const newFilters = {
      ...filters,
      search: value || undefined,
      page: 1,
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters: OrderFilters = {
      status: undefined,
      payment_status: undefined,
      source: undefined,
      date_from: undefined,
      date_to: undefined,
      search: undefined,
      page: 1,
      limit: 20,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <Card className="p-4 bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar por cliente, email o teléfono..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={loading}
            className="pl-10 bg-[#262626] border-[#3a3a38] text-[#fafafa] placeholder:text-[#888888] focus:border-[#d97757] focus-visible:ring-1 focus-visible:ring-[#d97757]"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-[#888888]" />
        </div>

        {/* Status */}
        <Select
          value={filters.status || undefined}
          onValueChange={(value) => handleFilterChange('status', value)}
          disabled={loading}
        >
          <SelectTrigger className="bg-[#262626] border-[#3a3a38] text-[#fafafa] [&>span]:text-[#888888] data-[placeholder]:text-[#888888] focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent className="bg-[#262624] border-[#3a3a38]">
            {STATUS_OPTIONS.filter(opt => opt.value).map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa] cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Status */}
        <Select
          value={filters.payment_status || undefined}
          onValueChange={(value) => handleFilterChange('payment_status', value)}
          disabled={loading}
        >
          <SelectTrigger className="bg-[#262626] border-[#3a3a38] text-[#fafafa] [&>span]:text-[#888888] data-[placeholder]:text-[#888888] focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757]">
            <SelectValue placeholder="Todos los pagos" />
          </SelectTrigger>
          <SelectContent className="bg-[#262624] border-[#3a3a38]">
            {PAYMENT_STATUS_OPTIONS.filter(opt => opt.value).map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa] cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source */}
        <Select
          value={filters.source || undefined}
          onValueChange={(value) => handleFilterChange('source', value)}
          disabled={loading}
        >
          <SelectTrigger className="bg-[#262626] border-[#3a3a38] text-[#fafafa] [&>span]:text-[#888888] data-[placeholder]:text-[#888888] focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757]">
            <SelectValue placeholder="Todas las fuentes" />
          </SelectTrigger>
          <SelectContent className="bg-[#262624] border-[#3a3a38]">
            {SOURCE_OPTIONS.filter(opt => opt.value).map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa] cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => handleFilterChange('date_from', e.target.value)}
          disabled={loading}
          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert focus:border-[#d97757] focus-visible:ring-1 focus-visible:ring-[#d97757]"
        />

        {/* Date To */}
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => handleFilterChange('date_to', e.target.value)}
          disabled={loading}
          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert focus:border-[#d97757] focus-visible:ring-1 focus-visible:ring-[#d97757]"
        />
      </div>

      {/* Reset Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleReset}
          disabled={loading}
          variant="secondary"
          className="gap-2 bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] hover:border-[#d97757] transition-all"
        >
          <X className="w-4 h-4" />
          Limpiar Filtros
        </Button>
      </div>
    </Card>
  )
}
