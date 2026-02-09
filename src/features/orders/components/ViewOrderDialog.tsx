'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Package,
  User,
  CreditCard,
  FileText,
  AlertTriangle,
  Printer,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Order, OrderStatus, PaymentStatus } from '@/features/orders/types'

interface ViewOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onStatusChange?: (orderId: string, status: OrderStatus) => Promise<boolean>
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.CONFIRMED]: 'Confirmado',
  [OrderStatus.PROCESSING]: 'En proceso',
  [OrderStatus.SHIPPED]: 'Enviado',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.CANCELLED]: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  [OrderStatus.CONFIRMED]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [OrderStatus.PROCESSING]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  [OrderStatus.SHIPPED]: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  [OrderStatus.DELIVERED]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [OrderStatus.CANCELLED]: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  credit_card: 'Tarjeta de Crédito',
  debit_card: 'Tarjeta de Débito',
  transfer: 'Transferencia',
  mercadopago: 'MercadoPago',
  other: 'Otro',
  pending: 'Pendiente',
}

const SOURCE_LABELS: Record<string, string> = {
  website: 'Sitio Web',
  whatsapp: 'WhatsApp',
  phone: 'Teléfono',
  store: 'Tienda',
  in_store: 'Tienda',
  admin: 'Admin',
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pendiente',
  [PaymentStatus.COMPLETED]: 'Pagado',
  [PaymentStatus.FAILED]: 'Fallido',
  [PaymentStatus.REFUNDED]: 'Reembolsado',
}

// Valid status transitions - must match API validation
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  [PaymentStatus.COMPLETED]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [PaymentStatus.FAILED]: 'bg-red-500/20 text-red-400 border-red-500/30',
  [PaymentStatus.REFUNDED]: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function ViewOrderDialog({
  open,
  onOpenChange,
  order,
  onStatusChange,
}: ViewOrderDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [updating, setUpdating] = useState(false)

  if (!order) return null

  // Reset selected status when order changes
  const currentStatus = selectedStatus ?? order.status

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isWhatsAppPending = order.source === 'whatsapp' && order.customer_name.includes('WhatsApp')

  const handleStatusUpdate = async () => {
    if (!onStatusChange || currentStatus === order.status) return

    if (window.confirm('¿Está seguro de cambiar el estado de esta orden?')) {
      setUpdating(true)
      try {
        const success = await onStatusChange(order.id, currentStatus)
        if (success) {
          setSelectedStatus(null)
        }
      } finally {
        setUpdating(false)
      }
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedStatus(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-[#fafafa]">
            <Package className="w-5 h-5 text-[#d97757]" />
            Orden {order.order_number}
          </DialogTitle>
          <DialogDescription className="text-[#888888]">
            Creada el {formatDate(order.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* WhatsApp Alert */}
          {isWhatsAppPending && (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-300">
                Pedido de WhatsApp - Actualiza los datos del cliente cuando te contacte
              </AlertDescription>
            </Alert>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#888888]">Estado Actual</span>
            <Badge className={`${STATUS_COLORS[order.status]} border`}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>

          {/* Cliente + Pago Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cliente */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-[#fafafa]">
                <User className="w-4 h-4 text-[#d97757]" />
                Cliente
              </h3>
              <div className="pl-6 space-y-3">
                <div>
                  <p className="text-xs text-[#888888]">Nombre</p>
                  <p className="text-sm font-medium text-[#fafafa]">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#888888]">Email</p>
                  <p className="text-sm text-[#fafafa]">{order.customer_email}</p>
                </div>
                <div>
                  <p className="text-xs text-[#888888]">Teléfono</p>
                  <p className="text-sm text-[#fafafa]">{order.customer_phone}</p>
                </div>
              </div>
            </div>

            {/* Pago */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-[#fafafa]">
                <CreditCard className="w-4 h-4 text-[#d97757]" />
                Información de Pago
              </h3>
              <div className="pl-6 space-y-3">
                <div>
                  <p className="text-xs text-[#888888]">Método</p>
                  <p className="text-sm font-medium text-[#fafafa]">
                    {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#888888]">Estado de Pago</p>
                  <Badge className={`${PAYMENT_STATUS_COLORS[order.payment_status]} border`}>
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#888888]">Fuente</p>
                  <p className="text-sm text-[#fafafa]">
                    {SOURCE_LABELS[order.source] || order.source}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-[#fafafa]">
              <Package className="w-4 h-4 text-[#d97757]" />
              Productos ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#1e1e1c]"
                >
                  {item.image_url && (
                    <div className="relative h-12 w-12 rounded overflow-hidden bg-[#262624] flex-shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#fafafa] truncate">
                      {item.product_name}
                    </p>
                    <div className="flex gap-2 text-xs text-[#888888]">
                      {item.sku && <span>SKU: {item.sku}</span>}
                      {item.brand && <span>• {item.brand}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-[#fafafa]">x{item.quantity}</p>
                    <p className="text-sm font-medium text-[#d97757]">
                      {formatCurrency(item.total_price)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="pt-3 border-t border-[#3a3a38] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#888888]">Subtotal</span>
                  <span className="text-[#fafafa]">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888888]">Impuestos</span>
                    <span className="text-[#fafafa]">{formatCurrency(order.tax)}</span>
                  </div>
                )}
                {order.shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#888888]">Envío</span>
                    <span className="text-[#fafafa]">{formatCurrency(order.shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-[#3a3a38]">
                  <span className="font-semibold text-[#fafafa]">Total</span>
                  <span className="font-bold text-lg text-[#d97757]">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Voucher */}
          {order.voucher_code && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-[#fafafa]">
                <FileText className="w-4 h-4 text-[#d97757]" />
                Cupón Aplicado
              </h3>
              <p className="text-sm pl-6 text-[#fafafa] font-mono bg-[#1e1e1c] px-3 py-2 rounded inline-block">
                {order.voucher_code}
              </p>
            </div>
          )}

          {/* Notas */}
          {order.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-[#fafafa]">
                <FileText className="w-4 h-4 text-[#d97757]" />
                Notas
              </h3>
              <p className="text-sm pl-6 text-[#888888]">{order.notes}</p>
            </div>
          )}

          {/* Last Updated */}
          <div className="pt-4 border-t border-[#3a3a38]">
            <p className="text-xs text-[#666666]">
              Última actualización: {new Date(order.updated_at).toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-[#3a3a38] pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {onStatusChange && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-[#888888]">Estado:</span>
              {VALID_TRANSITIONS[order.status].length > 0 ? (
                <>
                  <Select
                    value={currentStatus}
                    onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
                  >
                    <SelectTrigger className="w-[160px] bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa] focus:ring-[#d97757]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa]">
                      <SelectItem
                        value={order.status}
                        className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa] hover:bg-[#3a3a38] hover:text-[#fafafa] cursor-pointer"
                      >
                        {STATUS_LABELS[order.status]}
                      </SelectItem>
                      {VALID_TRANSITIONS[order.status].map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa] hover:bg-[#3a3a38] hover:text-[#fafafa] cursor-pointer"
                        >
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={updating || currentStatus === order.status}
                    className="bg-[#d97757] hover:bg-[#c56647] text-white disabled:opacity-50"
                  >
                    {updating ? 'Guardando...' : 'Actualizar'}
                  </Button>
                </>
              ) : (
                <span className="text-sm text-[#666666] italic">
                  {STATUS_LABELS[order.status]} - Estado final
                </span>
              )}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="bg-[#3a3a38] border-[#444442] text-[#fafafa] hover:bg-[#444442] hover:text-[#fafafa]"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
