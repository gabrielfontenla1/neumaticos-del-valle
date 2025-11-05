'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Order, OrderHistory, OrderStatus } from '@/features/orders/types'

interface OrderDetailProps {
  order: Order & { history?: OrderHistory[] }
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orden {order.order_number}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Creada el {formatDate(order.created_at)}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href="/admin/orders"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Volver a la Lista
            </Link>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Productos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Precio Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
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
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_name}
                            </div>
                            {item.sku && (
                              <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                            )}
                            {(item.brand || item.model) && (
                              <div className="text-xs text-gray-500">
                                {item.brand} {item.model}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                      Subtotal:
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(order.subtotal)}
                    </td>
                  </tr>
                  {order.tax > 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                        Impuestos:
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(order.tax)}
                      </td>
                    </tr>
                  )}
                  {order.shipping > 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                        Envío:
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(order.shipping)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="px-6 py-3 text-right text-base font-bold text-gray-900">
                      Total:
                    </td>
                    <td className="px-6 py-3 text-base font-bold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Order History */}
          {order.history && order.history.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Historial de Cambios</h2>
              </div>
              <div className="px-6 py-4">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {order.history.map((entry, index) => (
                      <li key={entry.id}>
                        <div className="relative pb-8">
                          {index !== order.history!.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
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
                                <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                                <p className="mt-0.5 text-sm text-gray-500">{entry.description}</p>
                                {entry.previous_status && entry.new_status && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {STATUS_LABELS[entry.previous_status]} →{' '}
                                    {STATUS_LABELS[entry.new_status]}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customer_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customer_email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Teléfono</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customer_phone}</dd>
              </div>
            </dl>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado de la Orden</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
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
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Cambiar Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingStatus ? 'Actualizando...' : 'Actualizar Estado'}
              </button>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Orden</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">Método de Pago</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.payment_method}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Estado de Pago</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.payment_status}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Fuente</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.source}</dd>
              </div>
              {order.voucher_code && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Código de Cupón</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.voucher_code}</dd>
                </div>
              )}
              {order.notes && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Notas</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500">Última Actualización</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(order.updated_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
