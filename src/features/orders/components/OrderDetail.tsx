'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Order, OrderHistory, OrderStatus } from '@/features/orders/types'
import { ORDER_STATUS_STYLES } from '@/lib/constants/admin-theme'

interface OrderDetailProps {
  order: Order & { history?: OrderHistory[] }
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: ORDER_STATUS_STYLES.pending.badge,
  confirmed: ORDER_STATUS_STYLES.confirmed.badge,
  processing: ORDER_STATUS_STYLES.processing.badge,
  shipped: ORDER_STATUS_STYLES.shipped.badge,
  delivered: ORDER_STATUS_STYLES.delivered.badge,
  cancelled: ORDER_STATUS_STYLES.cancelled.badge,
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export function OrderDetail({ order, onStatusChange }: OrderDetailProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount)
  }

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status) {
      return
    }

    if (window.confirm('¿Está seguro de cambiar el estado de esta orden?')) {
      setUpdatingStatus(true)
      try {
        await onStatusChange(order.id, selectedStatus)
      } finally {
        setUpdatingStatus(false)
      }
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-lg shadow-black/20 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#fafafa]">Orden {order.order_number}</h1>
            <p className="mt-1 text-sm text-[#888888]">
              Creada el {formatDate(order.created_at)}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href="/admin/orders"
              className="px-4 py-2 text-sm font-medium text-[#fafafa] bg-[#3a3a38] border border-[#444442] rounded-md hover:bg-[#444442] transition-colors"
            >
              Volver a la Lista
            </Link>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-[#fafafa] bg-[#3a3a38] border border-[#444442] rounded-md hover:bg-[#444442] transition-colors"
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-lg shadow-black/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#3a3a38]">
              <h2 className="text-lg font-semibold text-[#fafafa]">Productos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#3a3a38]">
                <thead className="bg-[#1e1e1c]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#888888] uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#262624] divide-y divide-[#3a3a38]">
                  {order.items.map((item, index) => (
                    <tr key={index} className="hover:bg-[#2a2a28] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="h-12 w-12 object-cover rounded mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-[#fafafa]">
                              {item.product_name}
                            </div>
                            {item.sku && (
                              <div className="text-xs text-[#888888]">SKU: {item.sku}</div>
                            )}
                            {(item.brand || item.model) && (
                              <div className="text-xs text-[#888888]">
                                {item.brand} {item.model}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#fafafa]">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#fafafa]">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#fafafa]">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#1e1e1c]">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-[#888888]">
                      Subtotal:
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-[#fafafa]">
                      {formatCurrency(order.subtotal)}
                    </td>
                  </tr>
                  {order.tax > 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-[#888888]">
                        Impuestos:
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-[#fafafa]">
                        {formatCurrency(order.tax)}
                      </td>
                    </tr>
                  )}
                  {order.shipping > 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-[#888888]">
                        Envío:
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-[#fafafa]">
                        {formatCurrency(order.shipping)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-[#3a3a38]">
                    <td colSpan={3} className="px-6 py-3 text-right text-base font-bold text-[#fafafa]">
                      Total:
                    </td>
                    <td className="px-6 py-3 text-base font-bold text-[#d97757]">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Order History */}
          {order.history && order.history.length > 0 && (
            <div className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-lg shadow-black/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#3a3a38]">
                <h2 className="text-lg font-semibold text-[#fafafa]">Historial de Cambios</h2>
              </div>
              <div className="px-6 py-4">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {order.history.map((entry, index) => (
                      <li key={entry.id}>
                        <div className="relative pb-8">
                          {index !== order.history!.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[#3a3a38]"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-[#3b82f6] flex items-center justify-center ring-8 ring-[#262624]">
                                <svg
                                  className="h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div>
                                <p className="text-sm font-medium text-[#fafafa]">{entry.action}</p>
                                <p className="mt-0.5 text-sm text-[#888888]">{entry.description}</p>
                                {entry.previous_status && entry.new_status && (
                                  <p className="mt-1 text-xs text-[#888888]">
                                    {STATUS_LABELS[entry.previous_status]} →{' '}
                                    {STATUS_LABELS[entry.new_status]}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-[#666666]">
                                {formatDate(entry.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-lg shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-[#fafafa] mb-4">Información del Cliente</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-[#888888]">Nombre</dt>
                <dd className="mt-1 text-sm text-[#fafafa]">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#888888]">Email</dt>
                <dd className="mt-1 text-sm text-[#fafafa]">{order.customer_email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#888888]">Teléfono</dt>
                <dd className="mt-1 text-sm text-[#fafafa]">{order.customer_phone}</dd>
              </div>
            </dl>
          </div>

          {/* Order Status */}
          <div className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-lg shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-[#fafafa] mb-4">Estado de la Orden</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#888888] mb-2">
                  Estado Actual
                </label>
                <span
                  className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                    STATUS_COLORS[order.status]
                  }`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#888888] mb-2">
                  Cambiar Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-[#1e1e1c] border border-[#3a3a38] text-[#fafafa] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97757] focus:border-transparent"
                >
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus || selectedStatus === order.status}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-[#d97757] rounded-md hover:bg-[#c56647] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updatingStatus ? 'Actualizando...' : 'Actualizar Estado'}
              </button>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-lg shadow-black/20 p-6">
            <h2 className="text-lg font-semibold text-[#fafafa] mb-4">Información de la Orden</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-[#888888]">Método de Pago</dt>
                <dd className="mt-1 text-sm text-[#fafafa]">{order.payment_method}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#888888]">Estado de Pago</dt>
                <dd className="mt-1 text-sm text-[#fafafa]">{order.payment_status}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[#888888]">Fuente</dt>
                <dd className="mt-1 text-sm text-[#fafafa]">{order.source}</dd>
              </div>
              {order.voucher_code && (
                <div>
                  <dt className="text-xs font-medium text-[#888888]">Código de Cupón</dt>
                  <dd className="mt-1 text-sm text-[#fafafa]">{order.voucher_code}</dd>
                </div>
              )}
              {order.notes && (
                <div>
                  <dt className="text-xs font-medium text-[#888888]">Notas</dt>
                  <dd className="mt-1 text-sm text-[#fafafa]">{order.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-[#888888]">Última Actualización</dt>
                <dd className="mt-1 text-sm text-[#fafafa]">{formatDate(order.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
