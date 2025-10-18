// Admin Orders Management Page - Exact Rapicompras Style (Matching Turnos)
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Package,
  FileText,
  Download
} from 'lucide-react'
import { getOrders } from '@/features/admin/api'
import { Order } from '@/features/admin/types'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  input: '#262626',
  secondary: '#262626',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, dateFilter])

  const loadOrders = async () => {
    setIsLoading(true)
    const ordersData = await getOrders(100) // Load more orders
    setOrders(ordersData)
    setIsLoading(false)
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Date filter
    const now = new Date()
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filtered = filtered.filter(order =>
        new Date(order.created_at) >= today
      )
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(order =>
        new Date(order.created_at) >= weekAgo
      )
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      filtered = filtered.filter(order =>
        new Date(order.created_at) >= monthAgo
      )
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Create untyped client to avoid type inference issues
      const untypedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await untypedClient
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (!error) {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr))
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'confirmed':
        return <AlertCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmado'
      case 'completed': return 'Completado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Fecha', 'Cliente', 'Teléfono', 'Email', 'Total', 'Estado'],
      ...filteredOrders.map(order => [
        order.id,
        formatDate(order.created_at),
        order.customer_name,
        order.customer_phone,
        order.customer_email || '',
        order.total_amount.toString(),
        getStatusLabel(order.status)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div>
        <TableSkeleton rows={10} columns={6} />
      </div>
    )
  }

  return (
      <main className="p-6 space-y-6">
        {/* Header Card */}
        <motion.div
          className="rounded-lg shadow-xl p-6"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
                Gestión de Pedidos
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                {filteredOrders.length} de {orders.length} pedidos
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff'
              }}
            >
              <Download className="w-5 h-5" />
              Exportar CSV
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5" style={{ color: colors.mutedForeground }} />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg outline-none"
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.foreground
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg outline-none"
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.foreground
              }}
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.secondary }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderTopColor: colors.border }}>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-opacity-5"
                    style={{
                      borderBottomWidth: '1px',
                      borderBottomColor: colors.border
                    }}
                  >
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono" style={{ color: colors.foreground }}>
                            #{order.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: colors.foreground }}>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" style={{ color: colors.mutedForeground }} />
                            {formatDate(order.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium" style={{ color: colors.foreground }}>
                              {order.customer_name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs" style={{ color: colors.mutedForeground }}>
                                <Phone className="w-3 h-3" />
                                {order.customer_phone}
                              </span>
                              {order.customer_email && (
                                <span className="flex items-center gap-1 text-xs" style={{ color: colors.mutedForeground }}>
                                  <Mail className="w-3 h-3" />
                                  {order.customer_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold" style={{ color: colors.foreground }}>
                            {formatCurrency(order.total_amount)}
                          </p>
                          <p className="text-xs" style={{ color: colors.mutedForeground }}>
                            {order.items.length} productos
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1 rounded transition-all hover:scale-110"
                        style={{ color: colors.primary }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="text-center py-12">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: colors.mutedForeground }} />
                        <p style={{ color: colors.mutedForeground }}>
                          No se encontraron pedidos con los filtros aplicados
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedOrder(null)}
            />
            <div
              className="fixed right-0 top-0 h-full w-full md:w-96 shadow-xl z-50 overflow-y-auto"
              style={{ backgroundColor: colors.card }}
            >
              <div className="p-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: colors.foreground }}>
                    Detalles del Pedido
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 rounded transition-all hover:bg-opacity-10"
                    style={{ color: colors.foreground }}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

                  <div className="p-6 space-y-6">
                    {/* Order Info */}
                    <div>
                      <h3 className="font-semibold mb-3" style={{ color: colors.foreground }}>
                        Información del Pedido
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span style={{ color: colors.mutedForeground }}>ID:</span>
                          <span className="font-mono text-sm" style={{ color: colors.foreground }}>#{selectedOrder.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: colors.mutedForeground }}>Fecha:</span>
                          <span style={{ color: colors.foreground }}>{formatDate(selectedOrder.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: colors.mutedForeground }}>Estado:</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                            {getStatusIcon(selectedOrder.status)}
                            {getStatusLabel(selectedOrder.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <h3 className="font-semibold mb-3" style={{ color: colors.foreground }}>
                        Información del Cliente
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span style={{ color: colors.mutedForeground }}>Nombre:</span>
                          <span style={{ color: colors.foreground }}>{selectedOrder.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: colors.mutedForeground }}>Teléfono:</span>
                          <span style={{ color: colors.foreground }}>{selectedOrder.customer_phone}</span>
                        </div>
                        {selectedOrder.customer_email && (
                          <div className="flex justify-between">
                            <span style={{ color: colors.mutedForeground }}>Email:</span>
                            <span className="text-sm" style={{ color: colors.foreground }}>{selectedOrder.customer_email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.foreground }}>
                        <Package className="w-5 h-5" style={{ color: colors.primary }} />
                        Productos ({selectedOrder.items.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: colors.background }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium" style={{ color: colors.foreground }}>
                                  {item.product_name}
                                </p>
                                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                                  Cantidad: {item.quantity} × {formatCurrency(item.price)}
                                </p>
                              </div>
                              <p className="font-semibold" style={{ color: colors.foreground }}>
                                {formatCurrency(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-semibold" style={{ color: colors.foreground }}>
                          Total
                        </span>
                        <span className="text-2xl font-bold" style={{ color: colors.primary }}>
                          {formatCurrency(selectedOrder.total_amount)}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedOrder.notes && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.foreground }}>
                          <FileText className="w-5 h-5" style={{ color: colors.primary }} />
                          Notas
                        </h3>
                        <p className="p-3 rounded-lg" style={{
                          color: colors.foreground,
                          backgroundColor: colors.background
                        }}>
                          {selectedOrder.notes}
                        </p>
                      </div>
                    )}

              {/* Status Actions */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: colors.foreground }}>
                  Cambiar Estado
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'pending')}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedOrder.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : ''
                    }`}
                    style={selectedOrder.status !== 'pending' ? {
                      backgroundColor: colors.background,
                      color: colors.mutedForeground
                    } : {}}
                  >
                    Pendiente
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedOrder.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : ''
                    }`}
                    style={selectedOrder.status !== 'confirmed' ? {
                      backgroundColor: colors.background,
                      color: colors.mutedForeground
                    } : {}}
                  >
                    Confirmado
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedOrder.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : ''
                    }`}
                    style={selectedOrder.status !== 'completed' ? {
                      backgroundColor: colors.background,
                      color: colors.mutedForeground
                    } : {}}
                  >
                    Completado
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedOrder.status === 'cancelled'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : ''
                    }`}
                    style={selectedOrder.status !== 'cancelled' ? {
                      backgroundColor: colors.background,
                      color: colors.mutedForeground
                    } : {}}
                  >
                    Cancelado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
        )}
      </main>
  )
}
