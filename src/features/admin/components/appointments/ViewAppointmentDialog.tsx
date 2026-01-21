'use client'

import { Calendar, Clock, Phone, Mail, MapPin, FileText, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { VehicleInfoDisplay } from './VehicleInfoDisplay'
import type { Appointment } from '@/features/admin/types/appointment'

interface ViewAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
}

export function ViewAppointmentDialog({
  open,
  onOpenChange,
  appointment,
}: ViewAppointmentDialogProps) {
  if (!appointment) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#fafafa]">Detalles del Turno</DialogTitle>
          <DialogDescription className="text-[#888888]">
            Información completa del turno programado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#888888]">Estado</span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#fafafa] flex items-center gap-2">
              <User className="w-4 h-4 text-[#d97757]" />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              <div>
                <p className="text-xs text-[#888888]">Nombre</p>
                <p className="text-sm text-[#fafafa] font-medium">{appointment.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-[#888888]">Email</p>
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#888888]" />
                  <p className="text-sm text-[#fafafa]">{appointment.customer_email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#888888]">Teléfono</p>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#888888]" />
                  <p className="text-sm text-[#fafafa]">{appointment.customer_phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          {(appointment.vehicle_make || appointment.vehicle_model || appointment.vehicle_year) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#fafafa]">Vehículo</h3>
              <div className="pl-6">
                <VehicleInfoDisplay
                  make={appointment.vehicle_make}
                  model={appointment.vehicle_model}
                  year={appointment.vehicle_year}
                />
              </div>
            </div>
          )}

          {/* Service & Date Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#fafafa]">Detalles del Servicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              <div>
                <p className="text-xs text-[#888888]">Servicio</p>
                <p className="text-sm text-[#fafafa] font-medium">{appointment.service_type}</p>
              </div>
              <div>
                <p className="text-xs text-[#888888]">Fecha Preferida</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#888888]" />
                  <p className="text-sm text-[#fafafa]">{formatDate(appointment.preferred_date)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#888888]">Hora Preferida</p>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#888888]" />
                  <p className="text-sm text-[#fafafa] font-mono">{appointment.preferred_time}</p>
                </div>
              </div>

              {/* Confirmed Date/Time if different */}
              {appointment.confirmed_date && (
                <>
                  <div>
                    <p className="text-xs text-[#888888]">Fecha Confirmada</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#10b981]" />
                      <p className="text-sm text-[#10b981] font-medium">
                        {formatDate(appointment.confirmed_date)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#888888]">Hora Confirmada</p>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#10b981]" />
                      <p className="text-sm text-[#10b981] font-mono">{appointment.confirmed_time}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alternative Date/Time */}
          {(appointment.alternative_date || appointment.alternative_time) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#fafafa]">Fecha Alternativa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                {appointment.alternative_date && (
                  <div>
                    <p className="text-xs text-[#888888]">Fecha</p>
                    <p className="text-sm text-[#fafafa]">{formatDate(appointment.alternative_date)}</p>
                  </div>
                )}
                {appointment.alternative_time && (
                  <div>
                    <p className="text-xs text-[#888888]">Hora</p>
                    <p className="text-sm text-[#fafafa] font-mono">{appointment.alternative_time}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Branch */}
          {appointment.stores && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#fafafa] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#d97757]" />
                Ubicación
              </h3>
              <div className="pl-6">
                <p className="text-sm text-[#fafafa] font-medium">{appointment.stores.name}</p>
                <p className="text-xs text-[#888888]">
                  {appointment.stores.address}, {appointment.stores.city}
                </p>
                {appointment.stores.phone && (
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3 text-[#888888]" />
                    <p className="text-xs text-[#888888]">{appointment.stores.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {(appointment.notes || appointment.confirmation_notes) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#fafafa] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#d97757]" />
                Notas
              </h3>
              <div className="pl-6 space-y-2">
                {appointment.notes && (
                  <div>
                    <p className="text-xs text-[#888888]">Notas del Cliente</p>
                    <p className="text-sm text-[#fafafa]">{appointment.notes}</p>
                  </div>
                )}
                {appointment.confirmation_notes && (
                  <div>
                    <p className="text-xs text-[#888888]">Notas de Confirmación</p>
                    <p className="text-sm text-[#fafafa]">{appointment.confirmation_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="pt-4 border-t border-[#3a3a38]">
            <p className="text-xs text-[#666666]">
              Creado el {new Date(appointment.created_at).toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
