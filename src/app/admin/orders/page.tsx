'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, AlertCircle } from 'lucide-react'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { OrderFilters } from '@/features/orders/components/OrderFilters'
import { OrdersTable } from '@/features/orders/components/OrdersTable'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

  const handleStatusChange = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    const success = await updateOrderStatus(orderId, status)
    if (success) {
      // Refresh the orders list to get updated data
      fetchOrders({ page, limit: 20 })
    }
    return success
  }

  if (loading && orders.length === 0) {
    return (
      <div className="p-6 bg-[#30302e] min-h-screen">
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <main className="p-6 space-y-6 bg-[#30302e] min-h-screen">
      {/* Header Card */}
      <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#d97757]/20 border border-[#d97757]/30">
              <ShoppingCart className="w-8 h-8 text-[#d97757]" />
            </div>
            <div>
              <CardTitle className="text-2xl text-[#fafafa]">Gestión de Órdenes</CardTitle>
              <CardDescription className="text-[#888888]">
                {total > 0 ? `${total} orden${total !== 1 ? 'es' : ''} en total` : 'Administra todas las órdenes del sistema'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error al cargar las órdenes:</strong> {error}
          </AlertDescription>
        </Alert>
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
    </main>
  )
}
