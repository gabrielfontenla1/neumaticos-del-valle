// Vouchers Page - Exact Rapicompras Style
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Gift,
  Search,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Ticket,
  Plus,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

type VoucherStatus = 'pending' | 'active' | 'redeemed' | 'expired'
type ServiceType = 'inspection' | 'rotation' | 'balancing' | 'alignment'

interface Voucher {
  id: string
  code: string
  review_id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_type: ServiceType
  service_value: number
  valid_from: string
  valid_until: string
  status: VoucherStatus
  notes: string | null
  created_at: string
}

interface NewVoucherForm {
  customer_name: string
  customer_email: string
  customer_phone: string
  service_type: ServiceType
  service_value: string
  valid_until: string
  notes: string
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [newVoucher, setNewVoucher] = useState<NewVoucherForm>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_type: 'inspection',
    service_value: '',
    valid_until: '',
    notes: ''
  })

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    setIsLoading(true)

    const { data: vouchersData } = await supabase
      .from('service_vouchers')
      .select('*')
      .order('created_at', { ascending: false })

    if (vouchersData) setVouchers(vouchersData as any)

    setIsLoading(false)
  }

  const generateVoucherCode = () => {
    const prefix = 'VCH'
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  const handleCreateVoucher = async () => {
    if (!newVoucher.customer_name || !newVoucher.service_value || !newVoucher.valid_until) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    setIsCreating(true)

    try {
      const code = generateVoucherCode()
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('service_vouchers')
        .insert({
          code,
          review_id: crypto.randomUUID(), // Temporary - should come from actual review
          customer_name: newVoucher.customer_name,
          customer_email: newVoucher.customer_email || null,
          customer_phone: newVoucher.customer_phone || null,
          service_type: newVoucher.service_type,
          service_value: parseFloat(newVoucher.service_value),
          valid_from: today,
          valid_until: newVoucher.valid_until,
          status: 'active',
          notes: newVoucher.notes || null
        } as any)
        .select()

      if (error) throw error

      // Reload vouchers
      await loadVouchers()

      // Reset form and close dialog
      setNewVoucher({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        service_type: 'inspection',
        service_value: '',
        valid_until: '',
        notes: ''
      })
      setIsCreateDialogOpen(false)

      alert('Voucher creado exitosamente')
    } catch (error) {
      console.error('Error creating voucher:', error)
      alert('Error al crear el voucher')
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusVariant = (status: VoucherStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active':
        return 'default'
      case 'redeemed':
        return 'secondary'
      case 'expired':
        return 'destructive'
      case 'pending':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: VoucherStatus) => {
    const labels = {
      pending: 'Pendiente',
      active: 'Activo',
      redeemed: 'Canjeado',
      expired: 'Vencido'
    }
    return labels[status] || status
  }

  const getServiceTypeLabel = (type: ServiceType) => {
    const labels = {
      inspection: 'Inspección',
      rotation: 'Rotación',
      balancing: 'Balanceo',
      alignment: 'Alineación'
    }
    return labels[type] || type
  }

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesStatus = selectedStatus === 'all' || voucher.status === selectedStatus
    const matchesSearch = searchTerm === '' ||
      voucher.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voucher.customer_phone?.includes(searchTerm)
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.status === 'active').length,
    redeemed: vouchers.filter(v => v.status === 'redeemed').length,
    expired: vouchers.filter(v => v.status === 'expired').length
  }

  if (isLoading) {
    return (
      <div>
        <TableSkeleton rows={5} columns={5} />
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
                Gestión de Vouchers
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                {filteredVouchers.length} de {vouchers.length} vouchers
              </p>
            </div>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: colors.primary,
                color: '#ffffff'
              }}
            >
              <Plus className="w-5 h-5" />
              Crear Voucher
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total', value: stats.total, Icon: Gift, color: colors.primary },
            { label: 'Activos', value: stats.active, Icon: CheckCircle, color: '#16a34a' },
            { label: 'Canjeados', value: stats.redeemed, Icon: Ticket, color: '#2563eb' },
            { label: 'Vencidos', value: stats.expired, Icon: XCircle, color: '#dc2626' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-6"
              style={{
                backgroundColor: colors.card,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.mutedForeground }}>{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: colors.foreground }}>{stat.value}</p>
                </div>
                <div style={{ color: stat.color }}>
                  <stat.Icon className="w-8 h-8" />
                </div>
              </div>
            </div>
          ))}
        </div>

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
                placeholder="Buscar por código, nombre o teléfono..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg outline-none"
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.foreground
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="redeemed">Canjeados</option>
              <option value="expired">Vencidos</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </div>

        {/* Vouchers List */}
        <div className="space-y-4">
          {filteredVouchers.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{
              backgroundColor: colors.card,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            }}>
              <Gift className="h-12 w-12 mx-auto mb-4" style={{ color: colors.mutedForeground }} />
              <p style={{ color: colors.mutedForeground }}>No hay vouchers que mostrar</p>
            </div>
          ) : (
            filteredVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="rounded-xl p-6 transition-all cursor-pointer hover:opacity-90"
                style={{
                  backgroundColor: colors.card,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                }}
              >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      {/* Main Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: colors.primary + '20',
                            color: colors.primary
                          }}
                        >
                          {voucher.code.slice(0, 2)}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg" style={{ color: colors.foreground }}>
                                {voucher.customer_name}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                  voucher.status === 'active'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : voucher.status === 'redeemed'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : voucher.status === 'expired'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                              >
                                {getStatusLabel(voucher.status)}
                              </span>
                            </div>
                            <p className="text-sm font-mono" style={{ color: colors.mutedForeground }}>
                              {voucher.code}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {voucher.customer_phone && (
                              <div className="flex items-center gap-2 text-sm" style={{ color: colors.foreground }}>
                                <Phone className="h-4 w-4" style={{ color: colors.mutedForeground }} />
                                <span>{voucher.customer_phone}</span>
                              </div>
                            )}
                            {voucher.customer_email && (
                              <div className="flex items-center gap-2 text-sm" style={{ color: colors.foreground }}>
                                <Mail className="h-4 w-4" style={{ color: colors.mutedForeground }} />
                                <span>{voucher.customer_email}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm" style={{ color: colors.foreground }}>
                              <Gift className="h-4 w-4" style={{ color: colors.mutedForeground }} />
                              <span>{getServiceTypeLabel(voucher.service_type)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date, Value & Status */}
                      <div className="flex flex-wrap gap-4 items-center md:items-start">
                        <div className="text-center">
                          <div className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Válido hasta</div>
                          <div className="font-semibold" style={{ color: colors.foreground }}>
                            {new Date(voucher.valid_until).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs mb-1" style={{ color: colors.mutedForeground }}>Valor</div>
                          <div className="font-semibold flex items-center gap-1" style={{ color: colors.primary }}>
                            <DollarSign className="h-4 w-4" />
                            {voucher.service_value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                {voucher.notes && (
                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                    <p className="text-sm" style={{ color: colors.mutedForeground }}>
                      <strong>Notas:</strong> {voucher.notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Create Voucher Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: colors.foreground }}>
                Crear Nuevo Voucher
              </DialogTitle>
              <DialogDescription style={{ color: colors.mutedForeground }}>
                Completa la información del voucher de servicio
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Customer Name */}
              <div className="space-y-2">
                <label htmlFor="customer_name" className="text-sm font-medium" style={{ color: colors.foreground }}>
                  Nombre del Cliente *
                </label>
                <input
                  id="customer_name"
                  value={newVoucher.customer_name}
                  onChange={(e) => setNewVoucher({ ...newVoucher, customer_name: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                />
              </div>

              {/* Customer Email */}
              <div className="space-y-2">
                <label htmlFor="customer_email" className="text-sm font-medium" style={{ color: colors.foreground }}>
                  Email
                </label>
                <input
                  id="customer_email"
                  type="email"
                  value={newVoucher.customer_email}
                  onChange={(e) => setNewVoucher({ ...newVoucher, customer_email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                />
              </div>

              {/* Customer Phone */}
              <div className="space-y-2">
                <label htmlFor="customer_phone" className="text-sm font-medium" style={{ color: colors.foreground }}>
                  Teléfono
                </label>
                <input
                  id="customer_phone"
                  value={newVoucher.customer_phone}
                  onChange={(e) => setNewVoucher({ ...newVoucher, customer_phone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                />
              </div>

              {/* Service Type */}
              <div className="space-y-2">
                <label htmlFor="service_type" className="text-sm font-medium" style={{ color: colors.foreground }}>
                  Tipo de Servicio *
                </label>
                <select
                  value={newVoucher.service_type}
                  onChange={(e) => setNewVoucher({ ...newVoucher, service_type: e.target.value as ServiceType })}
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                >
                  <option value="inspection">Inspección</option>
                  <option value="rotation">Rotación</option>
                  <option value="balancing">Balanceo</option>
                  <option value="alignment">Alineación</option>
                </select>
              </div>

              {/* Service Value */}
              <div className="space-y-2">
                <label htmlFor="service_value" className="text-sm font-medium" style={{ color: colors.foreground }}>
                  Valor del Servicio (ARS) *
                </label>
                <input
                  id="service_value"
                  type="number"
                  value={newVoucher.service_value}
                  onChange={(e) => setNewVoucher({ ...newVoucher, service_value: e.target.value })}
                  placeholder="50000"
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                />
              </div>

              {/* Valid Until */}
              <div className="space-y-2">
                <label htmlFor="valid_until" className="text-sm font-medium" style={{ color: colors.foreground }}>
                  Válido Hasta *
                </label>
                <input
                  id="valid_until"
                  type="date"
                  value={newVoucher.valid_until}
                  onChange={(e) => setNewVoucher({ ...newVoucher, valid_until: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium" style={{ color: colors.foreground }}>
                  Notas
                </label>
                <textarea
                  id="notes"
                  value={newVoucher.notes}
                  onChange={(e) => setNewVoucher({ ...newVoucher, notes: e.target.value })}
                  placeholder="Información adicional..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-opacity-50 transition-all resize-none"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <button
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  border: `1px solid ${colors.border}`
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateVoucher}
                disabled={isCreating}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                style={{
                  backgroundColor: colors.primary,
                  color: '#ffffff'
                }}
              >
                <Plus className="h-4 w-4" />
                {isCreating ? 'Creando...' : 'Crear Voucher'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
  )
}
