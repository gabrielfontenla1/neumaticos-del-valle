'use client'

import { useState } from 'react'
import { OrderStatus, OrderSource, PaymentStatus, type OrderFilters } from '@/features/orders/types'

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
      page: 1, // Reset to first page when filters change
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
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Filtros</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            id="search"
            placeholder="Cliente, email o teléfono..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            id="status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            disabled={loading}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Status */}
        <div>
          <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado de Pago
          </label>
          <select
            id="payment_status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.payment_status || ''}
            onChange={(e) => handleFilterChange('payment_status', e.target.value)}
            disabled={loading}
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Fuente
          </label>
          <select
            id="source"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.source || ''}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            disabled={loading}
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            type="date"
            id="date_from"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <input
            type="date"
            id="date_to"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  )
}
