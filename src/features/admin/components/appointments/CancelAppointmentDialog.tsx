'use client'

import { useState } from 'react'
import { XCircle, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Appointment } from '@/features/admin/types/appointment'

interface CancelAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onCancel: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  isCancelling: boolean
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onCancel,
  isCancelling,
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState('')

  const handleCancel = async () => {
    if (!appointment) return

    const result = await onCancel(appointment.id, reason || undefined)

    if (result.success) {
      onOpenChange(false)
      setReason('')
    }
  }

  if (!appointment) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-[#fafafa] flex items-center gap-2">
            <XCircle className="w-5 h-5 text-[#ef4444]" />
            Cancelar Turno
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#888888]">
            ¿Estás seguro que deseas cancelar el turno de{' '}
            <span className="font-semibold text-[#fafafa]">{appointment.customer_name}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          {/* Warning */}
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#ef4444]">
                Esta acción no se puede deshacer. El cliente será notificado de la cancelación.
              </p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-[#3a3a38] rounded-lg p-3 border border-[#444442]">
            <p className="text-xs text-[#888888] mb-2">Detalles del turno:</p>
            <div className="space-y-1 text-sm text-[#fafafa]">
              <p>
                <span className="text-[#888888]">Servicio:</span> {appointment.service_type}
              </p>
              <p>
                <span className="text-[#888888]">Fecha:</span>{' '}
                {new Date(appointment.preferred_date).toLocaleDateString('es-ES')} a las{' '}
                {appointment.preferred_time}
              </p>
              {appointment.stores && (
                <p>
                  <span className="text-[#888888]">Sucursal:</span> {appointment.stores.name}
                </p>
              )}
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancel_reason" className="text-[#fafafa]">
              Motivo de Cancelación (opcional)
            </Label>
            <Textarea
              id="cancel_reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica el motivo de la cancelación..."
              className="bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa] placeholder-[#666666] min-h-[100px]"
            />
            <p className="text-xs text-[#666666]">
              Este motivo será visible en el historial del turno.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="bg-[#3a3a38] hover:bg-[#444442] text-[#fafafa]"
            disabled={isCancelling}
          >
            No, mantener turno
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
          >
            {isCancelling ? 'Cancelando...' : 'Sí, cancelar turno'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
