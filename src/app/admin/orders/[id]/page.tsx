'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrders } from '@/features/orders/hooks/useOrders'
import { OrderDetail } from '@/features/orders/components/OrderDetail'
import { Order, OrderHistory, OrderStatus } from '@/features/orders/types'

interface OrderDetailWithHistory extends Order {
  history?: OrderHistory[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getOrderDetail, updateOrderStatus } = useOrders()
  const [order, setOrder] = useState<OrderDetailWithHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOrder = async () => {
      const orderId = params.id as string
      if (!orderId) {
        setError('ID de orden no válido')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const orderData = await getOrderDetail(orderId)
        if (orderData) {
          setOrder(orderData)
        } else {
          setError('No se pudo cargar la orden')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la orden')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [params.id, getOrderDetail])

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const success = await updateOrderStatus(orderId, status)
    if (success && order) {
      // Refresh order data to get updated history
      const updatedOrder = await getOrderDetail(orderId)
      if (updatedOrder) {
        setOrder(updatedOrder)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#30302e] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-lg shadow-black/20 p-8">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d97757]"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#30302e] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#262624] border border-[#ef4444]/20 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-[#ef4444]"
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
                <h3 className="text-sm font-medium text-[#fafafa]">Error</h3>
                <div className="mt-2 text-sm text-[#ef4444]">{error || 'Orden no encontrada'}</div>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#ef4444] rounded-md hover:bg-[#dc2626]"
                >
                  Volver a la Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#30302e] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OrderDetail order={order} onStatusChange={handleStatusChange} />
      </div>
    </div>
  )
}
