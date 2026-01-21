'use client'

import { useState } from 'react'
import { CheckCircle2, Calendar, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Appointment } from '@/features/admin/types/appointment'

interface CompleteAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onComplete: (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>
  isCompleting: boolean
}

export function CompleteAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onComplete,
  isCompleting,
}: CompleteAppointmentDialogProps) {
  const [notes, setNotes] = useState('')

  const handleComplete = async () => {
    if (!appointment) return

    const result = await onComplete(appointment.id, notes || undefined)

    if (result.success) {
      onOpenChange(false)
      setNotes('')
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#fafafa] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#3b82f6]" />
            Marcar como Completado
          </DialogTitle>
          <DialogDescription className="text-[#888888]">
            Marca el turno de <span className="font-semibold text-[#fafafa]">{appointment.customer_name}</span> como completado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Appointment Summary */}
          <div className="bg-[#3a3a38] rounded-lg p-3 border border-[#444442]">
            <p className="text-xs text-[#888888] mb-2">Resumen del turno:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#d97757]" />
                <span className="text-sm text-[#fafafa]">
                  {appointment.confirmed_date
                    ? new Date(appointment.confirmed_date).toLocaleDateString('es-ES')
                    : new Date(appointment.preferred_date).toLocaleDateString('es-ES')}
                </span>
                <Clock className="w-4 h-4 text-[#d97757] ml-2" />
                <span className="text-sm font-mono text-[#fafafa]">
                  {appointment.confirmed_time || appointment.preferred_time}
                </span>
              </div>
              <div className="text-sm text-[#fafafa]">
                <span className="text-[#888888]">Servicio:</span> {appointment.service_type}
              </div>
              {appointment.stores && (
                <div className="text-sm text-[#fafafa]">
                  <span className="text-[#888888]">Sucursal:</span> {appointment.stores.name}
                </div>
              )}
            </div>
          </div>

          {/* Success indicator */}
          <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-3">
            <p className="text-xs text-[#3b82f6]">
              El turno será marcado como completado y el cliente podrá dejar una reseña del servicio.
            </p>
          </div>

          {/* Completion Notes */}
          <div className="space-y-2">
            <Label htmlFor="completion_notes" className="text-[#fafafa]">
              Notas de Finalización (opcional)
            </Label>
            <Textarea
              id="completion_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega notas sobre el servicio realizado, observaciones, etc..."
              className="bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa] placeholder-[#666666] min-h-[100px]"
            />
            <p className="text-xs text-[#666666]">
              Estas notas serán visibles en el historial del turno.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="bg-[#3a3a38] hover:bg-[#444442] text-[#fafafa]"
            disabled={isCompleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isCompleting}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
          >
            {isCompleting ? 'Completando...' : 'Marcar como Completado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
