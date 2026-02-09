'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type {
  Order,
  OrderFilters,
  OrderStatus,
  OrderHistory,
  UpdateOrderRequest,
  ListOrdersResponse,
} from '@/features/orders/types'

interface OrderDetailWithHistory extends Order {
  history: OrderHistory[]
}

interface UseOrdersReturn {
  orders: Order[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  error: string | null
  fetchOrders: (filters: OrderFilters) => Promise<void>
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>
  getOrderDetail: (id: string) => Promise<OrderDetailWithHistory | null>
}

export function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async (filters: OrderFilters) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.status) params.append('status', filters.status)
      if (filters.payment_status) params.append('payment_status', filters.payment_status)
      if (filters.source) params.append('source', filters.source)
      if (filters.date_from) params.append('date_from', filters.date_from)
      if (filters.date_to) params.append('date_to', filters.date_to)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/admin/orders?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data: ListOrdersResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders')
      }

      setOrders(data.orders)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      setOrders([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateOrderStatus = useCallback(
    async (id: string, status: OrderStatus): Promise<boolean> => {
      setLoading(true)
      setError(null)

      try {
        const updateData: UpdateOrderRequest = {
          status,
        }

        const response = await fetch(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })

        let data
        try {
          data = await response.json()
        } catch {
          toast.error('Error de comunicación con el servidor')
          return false
        }

        if (!response.ok || !data.success) {
          const errorMsg = data.error || 'Failed to update order status'
          // Show specific error for invalid transitions
          if (errorMsg.includes('Invalid status transition')) {
            toast.error('Transición de estado no válida. Revisa el flujo permitido.')
          } else {
            toast.error(errorMsg)
          }
          return false
        }

        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === id ? { ...order, status, updated_at: new Date().toISOString() } : order
          )
        )

        toast.success('Estado de la orden actualizado correctamente')
        return true
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error('Error al actualizar el estado de la orden')
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const getOrderDetail = useCallback(
    async (id: string): Promise<OrderDetailWithHistory | null> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/orders/${id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch order detail')
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch order detail')
        }

        return data.order as OrderDetailWithHistory
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    orders,
    total,
    page,
    totalPages,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    getOrderDetail,
  }
}
