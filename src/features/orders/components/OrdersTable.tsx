'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Order, OrderStatus } from '@/features/orders/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ORDER_STATUS_STYLES } from '@/lib/constants/admin-theme'

interface OrdersTableProps {
  orders: Order[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: ORDER_STATUS_STYLES.pending.badge,
  [OrderStatus.CONFIRMED]: ORDER_STATUS_STYLES.confirmed.badge,
  [OrderStatus.PROCESSING]: ORDER_STATUS_STYLES.processing.badge,
  [OrderStatus.SHIPPED]: ORDER_STATUS_STYLES.shipped.badge,
  [OrderStatus.DELIVERED]: ORDER_STATUS_STYLES.delivered.badge,
  [OrderStatus.CANCELLED]: ORDER_STATUS_STYLES.cancelled.badge,
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.CONFIRMED]: 'Confirmado',
  [OrderStatus.PROCESSING]: 'En proceso',
  [OrderStatus.SHIPPED]: 'Enviado',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
}

export function OrdersTable({
  orders,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onStatusChange,
}: OrdersTableProps) {
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (window.confirm('¿Está seguro de cambiar el estado de esta orden?')) {
      setUpdatingOrderId(orderId)
      try {
        await onStatusChange(orderId, newStatus)
      } finally {
        setUpdatingOrderId(null)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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

  if (loading) {
    return (
      <Card className="p-12 flex justify-center items-center bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d97757]" />
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-12 bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-[#3a3a38]">
              <FileText className="w-8 h-8 text-[#888888]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#fafafa]">
              No hay órdenes todavía
            </h3>
            <p className="mt-2 text-sm text-[#888888]">
              No se encontraron órdenes con los filtros seleccionados.
            </p>
            <div className="mt-6 space-y-3">
              <p className="text-sm text-[#888888]">
                Para comenzar a recibir órdenes:
              </p>
              <ol className="text-sm text-left inline-block space-y-1 text-[#888888]">
                <li>1. Los clientes pueden hacer pedidos desde el checkout</li>
                <li>2. Los pedidos se crearán automáticamente al enviar por WhatsApp</li>
                <li>3. También puedes crear órdenes manualmente desde el panel</li>
              </ol>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#3a3a38] hover:bg-transparent">
              <TableHead className="text-[#888888] font-semibold">Número</TableHead>
              <TableHead className="text-[#888888] font-semibold">Cliente</TableHead>
              <TableHead className="text-[#888888] font-semibold">Estado</TableHead>
              <TableHead className="text-[#888888] font-semibold">Total</TableHead>
              <TableHead className="text-[#888888] font-semibold">Fecha</TableHead>
              <TableHead className="text-[#888888] font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => (
              <motion.tr
                key={order.id}
                className="border-b border-[#3a3a38] transition-colors hover:bg-[#3a3a38]/40"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TableCell className="font-medium text-[#fafafa]">
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-[#fafafa]">
                    {order.customer_name}
                  </div>
                  <div className="text-xs text-[#a1a1aa]">
                    {order.customer_email}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                    disabled={updatingOrderId === order.id}
                  >
                    <SelectTrigger
                      className={`w-[140px] h-auto px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE_CLASSES[order.status]} hover:opacity-80 transition-opacity`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#262624] border-[#3a3a38]">
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa] cursor-pointer"
                        >
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE_CLASSES[value as OrderStatus]}`}>
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-[#fafafa]">
                    {formatCurrency(order.total_amount)}
                  </div>
                  <div className="text-xs text-[#a1a1aa]">
                    {order.payment_method}
                  </div>
                </TableCell>
                <TableCell className="text-[#fafafa]">
                  {formatDate(order.created_at)}
                </TableCell>
                <TableCell>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] hover:border-[#d97757] transition-all"
                  >
                    <Link href={`/admin/orders/${order.id}`} className="gap-2">
                      <Eye className="w-4 h-4" />
                      Ver
                    </Link>
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#3a3a38]">
          <div className="text-sm text-[#888888]">
            Página {currentPage} de {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="secondary"
              size="icon"
              className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] hover:border-[#d97757] disabled:opacity-50 disabled:hover:bg-[#262626] disabled:hover:border-[#3a3a38] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    variant="secondary"
                    size="sm"
                    className={currentPage === pageNum ? 'bg-[#d97757] border-[#d97757] text-white hover:bg-[#d97757]/90 transition-all' : 'bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] hover:border-[#d97757] transition-all'}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="secondary"
              size="icon"
              className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] hover:border-[#d97757] disabled:opacity-50 disabled:hover:bg-[#262626] disabled:hover:border-[#3a3a38] transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
