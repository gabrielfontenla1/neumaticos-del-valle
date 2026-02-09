'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Order, OrderHistory, OrderStatus, PaymentStatus } from '@/features/orders/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Printer, CheckCircle, AlertTriangle, Package, User, CreditCard, Clock } from 'lucide-react'

interface OrderDetailProps {
  order: Order & { history?: OrderHistory[] }
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  shipped: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
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
  admin: 'Admin',
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
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.status) return

    if (window.confirm('¿Está seguro de cambiar el estado de esta orden?')) {
      setUpdatingStatus(true)
      try {
        await onStatusChange(order.id, selectedStatus)
      } finally {
        setUpdatingStatus(false)
      }
    }
  }

  const isWhatsAppPending = order.source === 'whatsapp' && order.customer_name.includes('WhatsApp')

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-[#262624]/90 backdrop-blur-sm border-[#3a3a38]">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl text-[#fafafa]">Orden {order.order_number}</CardTitle>
              <p className="text-sm text-[#888888] mt-1">
                Creada el {formatDate(order.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                asChild
                className="bg-[#3a3a38] border-[#444442] text-[#fafafa] hover:bg-[#444442] hover:text-[#fafafa]"
              >
                <Link href="/admin/orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="bg-[#3a3a38] border-[#444442] text-[#fafafa] hover:bg-[#444442] hover:text-[#fafafa]"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* WhatsApp Pending Alert */}
      {isWhatsAppPending && (
        <Alert className="bg-yellow-500/10 border-yellow-500/50">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-400">Pedido de WhatsApp - Datos Pendientes</AlertTitle>
          <AlertDescription className="text-yellow-300/80">
            Este pedido fue creado desde WhatsApp. Actualiza los datos del cliente cuando te contacte.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products Table */}
          <Card className="bg-[#262624]/90 backdrop-blur-sm border-[#3a3a38]">
            <CardHeader className="border-b border-[#3a3a38]">
              <CardTitle className="flex items-center gap-2 text-[#fafafa]">
                <Package className="h-5 w-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e1e1c] border-[#3a3a38] hover:bg-[#1e1e1c]">
                    <TableHead className="text-[#888888]">Producto</TableHead>
                    <TableHead className="text-center text-[#888888]">Cantidad</TableHead>
                    <TableHead className="text-right text-[#888888]">Precio Unit.</TableHead>
                    <TableHead className="text-right text-[#888888]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={index} className="border-[#3a3a38] hover:bg-[#2a2a28]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <div className="relative h-12 w-12 rounded overflow-hidden bg-[#1e1e1c]">
                              <Image
                                src={item.image_url}
                                alt={item.product_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[#fafafa]">{item.product_name}</p>
                            {item.sku && (
                              <p className="text-xs text-[#888888]">SKU: {item.sku}</p>
                            )}
                            {item.brand && (
                              <p className="text-xs text-[#888888]">{item.brand}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-[#fafafa]">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-[#fafafa]">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-[#fafafa]">
                        {formatCurrency(item.total_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-[#1e1e1c]">
                  <TableRow className="border-[#3a3a38] hover:bg-[#1e1e1c]">
                    <TableCell colSpan={3} className="text-right text-[#888888]">Subtotal</TableCell>
                    <TableCell className="text-right text-[#fafafa]">{formatCurrency(order.subtotal)}</TableCell>
                  </TableRow>
                  {order.tax > 0 && (
                    <TableRow className="border-[#3a3a38] hover:bg-[#1e1e1c]">
                      <TableCell colSpan={3} className="text-right text-[#888888]">Impuestos</TableCell>
                      <TableCell className="text-right text-[#fafafa]">{formatCurrency(order.tax)}</TableCell>
                    </TableRow>
                  )}
                  {order.shipping > 0 && (
                    <TableRow className="border-[#3a3a38] hover:bg-[#1e1e1c]">
                      <TableCell colSpan={3} className="text-right text-[#888888]">Envío</TableCell>
                      <TableCell className="text-right text-[#fafafa]">{formatCurrency(order.shipping)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow className="border-t-2 border-[#3a3a38] hover:bg-[#1e1e1c]">
                    <TableCell colSpan={3} className="text-right font-bold text-base text-[#fafafa]">Total</TableCell>
                    <TableCell className="text-right font-bold text-base text-[#d97757]">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Order History */}
          {order.history && order.history.length > 0 && (
            <Card className="bg-[#262624]/90 backdrop-blur-sm border-[#3a3a38]">
              <CardHeader className="border-b border-[#3a3a38]">
                <CardTitle className="flex items-center gap-2 text-[#fafafa]">
                  <Clock className="h-5 w-5" />
                  Historial de Cambios
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.history.map((entry, index) => (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-[#3b82f6]" />
                        </div>
                        {index !== order.history!.length - 1 && (
                          <div className="w-0.5 flex-1 bg-[#3a3a38] mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-sm text-[#fafafa]">{entry.action}</p>
                        <p className="text-sm text-[#888888]">{entry.description}</p>
                        {entry.previous_status && entry.new_status && (
                          <p className="text-xs text-[#666666] mt-1">
                            {STATUS_LABELS[entry.previous_status]} → {STATUS_LABELS[entry.new_status]}
                          </p>
                        )}
                        <p className="text-xs text-[#666666] mt-1">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="bg-[#262624]/90 backdrop-blur-sm border-[#3a3a38]">
            <CardHeader className="border-b border-[#3a3a38]">
              <CardTitle className="flex items-center gap-2 text-[#fafafa]">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-[#888888]">Nombre</p>
                <p className="font-medium text-[#fafafa]">{order.customer_name}</p>
              </div>
              <Separator className="bg-[#3a3a38]" />
              <div>
                <p className="text-xs text-[#888888]">Email</p>
                <p className="font-medium text-[#fafafa]">{order.customer_email}</p>
              </div>
              <Separator className="bg-[#3a3a38]" />
              <div>
                <p className="text-xs text-[#888888]">Teléfono</p>
                <p className="font-medium text-[#fafafa]">{order.customer_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="bg-[#262624]/90 backdrop-blur-sm border-[#3a3a38]">
            <CardHeader className="border-b border-[#3a3a38]">
              <CardTitle className="text-[#fafafa]">Estado de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-[#888888] mb-2">Estado Actual</p>
                <Badge className={`${STATUS_COLORS[order.status]} border`}>
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>
              <Separator className="bg-[#3a3a38]" />
              <div className="space-y-3">
                <p className="text-xs text-[#888888]">Cambiar Estado</p>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
                >
                  <SelectTrigger className="bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa] focus:ring-[#d97757]">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa]">
                    {Object.values(OrderStatus).map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa] hover:bg-[#3a3a38] hover:text-[#fafafa] cursor-pointer"
                      >
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus || selectedStatus === order.status}
                  className="w-full bg-[#d97757] hover:bg-[#c56647] text-white disabled:opacity-50"
                >
                  {updatingStatus ? 'Actualizando...' : 'Actualizar Estado'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card className="bg-[#262624]/90 backdrop-blur-sm border-[#3a3a38]">
            <CardHeader className="border-b border-[#3a3a38]">
              <CardTitle className="flex items-center gap-2 text-[#fafafa]">
                <CreditCard className="h-5 w-5" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-[#888888]">Método de Pago</p>
                <p className="font-medium text-[#fafafa]">{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</p>
              </div>
              <Separator className="bg-[#3a3a38]" />
              <div>
                <p className="text-xs text-[#888888]">Estado de Pago</p>
                <Badge className={
                  order.payment_status === PaymentStatus.COMPLETED
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }>
                  {order.payment_status === PaymentStatus.COMPLETED ? 'Pagado' :
                   order.payment_status === PaymentStatus.PENDING ? 'Pendiente' :
                   order.payment_status === PaymentStatus.FAILED ? 'Fallido' :
                   order.payment_status === PaymentStatus.REFUNDED ? 'Reembolsado' : order.payment_status}
                </Badge>
              </div>
              <Separator className="bg-[#3a3a38]" />
              <div>
                <p className="text-xs text-[#888888]">Fuente</p>
                <p className="font-medium text-[#fafafa]">{SOURCE_LABELS[order.source] || order.source}</p>
              </div>
              {order.voucher_code && (
                <>
                  <Separator className="bg-[#3a3a38]" />
                  <div>
                    <p className="text-xs text-[#888888]">Cupón</p>
                    <p className="font-medium text-[#fafafa]">{order.voucher_code}</p>
                  </div>
                </>
              )}
              {order.notes && (
                <>
                  <Separator className="bg-[#3a3a38]" />
                  <div>
                    <p className="text-xs text-[#888888]">Notas</p>
                    <p className="text-sm text-[#fafafa]">{order.notes}</p>
                  </div>
                </>
              )}
              <Separator className="bg-[#3a3a38]" />
              <div>
                <p className="text-xs text-[#888888]">Última Actualización</p>
                <p className="text-sm text-[#fafafa]">{formatDate(order.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
