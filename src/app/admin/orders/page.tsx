'use client'

import { useEffect } from 'react'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { OrderFilters } from '@/features/orders/components/OrderFilters'
import { OrdersTable } from '@/features/orders/components/OrdersTable'
import type { OrderFilters as OrderFiltersType, OrderStatus } from '@/features/orders/types'

export default function AdminOrdersPage() {
  const {
    orders,
    total,
    page,
    totalPages,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
  } = useOrders()

  // Load initial data
  useEffect(() => {
    fetchOrders({ page: 1, limit: 20 })
  }, [fetchOrders])

  const handleFilterChange = (filters: OrderFiltersType) => {
    fetchOrders(filters)
  }

  const handlePageChange = (newPage: number) => {
    fetchOrders({ page: newPage, limit: 20 })
  }

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Órdenes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Administra todas las órdenes del sistema
          </p>
          {total > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {total} orden{total !== 1 ? 'es' : ''} en total
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar las órdenes</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                {error.includes('Failed to fetch orders') && (
                  <div className="mt-3 space-y-2 text-xs text-red-600">
                    <p className="font-semibold">Posibles soluciones:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Verifica que la tabla 'orders' existe en Supabase</li>
                      <li>Ejecuta el script SQL en: src/database/migrations/create_orders_tables_fixed.sql</li>
                      <li>Configura las políticas RLS para permitir lectura</li>
                      <li>Ejecuta: <code className="bg-red-100 px-1 rounded">node src/scripts/diagnose-orders.mjs</code></li>
                    </ol>
                    <p className="mt-2">
                      📖 Ver instrucciones completas en: <code className="bg-red-100 px-1 rounded">FIX_ORDERS_DASHBOARD.md</code>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <OrderFilters onFilterChange={handleFilterChange} loading={loading} />

        {/* Orders Table */}
        <OrdersTable
          orders={orders}
          loading={loading}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  )
}
