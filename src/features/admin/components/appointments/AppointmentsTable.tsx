'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Phone, Mail, MapPin, User, Eye, CheckCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react'
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
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { VehicleInfoDisplay } from './VehicleInfoDisplay'
import type { Appointment } from '@/features/admin/types/appointment'

interface AppointmentsTableProps {
  appointments: Appointment[]
  isLoading: boolean
  sortBy: 'date' | 'customer' | 'status'
  sortOrder: 'asc' | 'desc'
  onToggleSort: (field: 'date' | 'customer' | 'status') => void
  onViewAppointment: (appointment: Appointment) => void
  onConfirmAppointment: (appointment: Appointment) => void
  onCancelAppointment: (appointment: Appointment) => void
  onCompleteAppointment: (appointment: Appointment) => void
}

export function AppointmentsTable({
  appointments,
  isLoading,
  sortBy,
  sortOrder,
  onToggleSort,
  onViewAppointment,
  onConfirmAppointment,
  onCancelAppointment,
  onCompleteAppointment,
}: AppointmentsTableProps) {
  const SortIcon = ({ field }: { field: 'date' | 'customer' | 'status' }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date().toISOString().split('T')[0]
    const isToday = dateString === today

    return {
      formatted: date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: isToday ? undefined : '2-digit',
      }),
      isToday,
    }
  }

  if (isLoading) {
    return (
      <Card className="p-12 flex justify-center items-center bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d97757]" />
      </Card>
    )
  }

  if (appointments.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-12 bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-[#3a3a38]">
              <Calendar className="w-8 h-8 text-[#888888]" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#fafafa]">No hay turnos</h3>
            <p className="mt-2 text-sm text-[#888888]">
              No se encontraron turnos con los filtros seleccionados.
            </p>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#3a3a38] hover:bg-transparent">
              <TableHead
                onClick={() => onToggleSort('date')}
                className="text-[#888888] font-semibold cursor-pointer hover:text-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Fecha & Hora
                  <SortIcon field="date" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => onToggleSort('customer')}
                className="text-[#888888] font-semibold cursor-pointer hover:text-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-1">
                  Cliente
                  <SortIcon field="customer" />
                </div>
              </TableHead>
              <TableHead className="text-[#888888] font-semibold">Servicio</TableHead>
              <TableHead className="text-[#888888] font-semibold">Contacto</TableHead>
              <TableHead className="text-[#888888] font-semibold">Ubicación</TableHead>
              <TableHead
                onClick={() => onToggleSort('status')}
                className="text-[#888888] font-semibold text-center cursor-pointer hover:text-[#fafafa] transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  Estado
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="text-[#888888] font-semibold text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment, index) => {
              const dateInfo = formatDate(appointment.preferred_date)

              return (
                <motion.tr
                  key={appointment.id}
                  className={`border-b border-[#3a3a38] transition-colors hover:bg-[#3a3a38]/40 ${
                    dateInfo.isToday ? 'bg-[#d97757]/5' : ''
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Date & Time */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {dateInfo.isToday && (
                          <div className="h-2 w-2 rounded-full bg-[#d97757] animate-pulse" />
                        )}
                        <span
                          className={`text-sm ${dateInfo.isToday ? 'font-semibold text-[#d97757]' : 'text-[#fafafa]'}`}
                        >
                          {dateInfo.formatted}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#888888]">
                        <Clock className="h-3 w-3" />
                        <span className="font-mono font-semibold">{appointment.preferred_time}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#d97757]/20 flex items-center justify-center text-xs font-semibold text-[#d97757]">
                        {appointment.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#fafafa]">{appointment.customer_name}</span>
                    </div>
                  </TableCell>

                  {/* Service */}
                  <TableCell>
                    <div className="space-y-1">
                      <span className="text-sm text-[#fafafa]">{appointment.service_type}</span>
                      <VehicleInfoDisplay
                        make={appointment.vehicle_make}
                        model={appointment.vehicle_model}
                        year={appointment.vehicle_year}
                        compact
                      />
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {appointment.customer_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-[#888888]" />
                          <span className="text-[#fafafa]">{appointment.customer_phone}</span>
                        </div>
                      )}
                      {appointment.customer_email && (
                        <div className="flex items-center gap-1 text-xs text-[#888888]">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{appointment.customer_email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Branch */}
                  <TableCell>
                    {appointment.stores && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#d97757]" />
                          <span className="text-sm font-medium text-[#fafafa]">{appointment.stores.name}</span>
                        </div>
                        <span className="text-xs pl-5 text-[#888888]">{appointment.stores.city}</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={() => onViewAppointment(appointment)}
                        variant="secondary"
                        size="sm"
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] hover:border-[#d97757] transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {appointment.status === 'pending' && (
                        <Button
                          onClick={() => onConfirmAppointment(appointment)}
                          variant="secondary"
                          size="sm"
                          className="bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/20 transition-all"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}

                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <Button
                          onClick={() => onCancelAppointment(appointment)}
                          variant="secondary"
                          size="sm"
                          className="bg-[#ef4444]/10 border-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/20 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}

                      {appointment.status === 'confirmed' && (
                        <Button
                          onClick={() => onCompleteAppointment(appointment)}
                          variant="secondary"
                          size="sm"
                          className="bg-[#3b82f6]/10 border-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-all"
                        >
                          Completar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
