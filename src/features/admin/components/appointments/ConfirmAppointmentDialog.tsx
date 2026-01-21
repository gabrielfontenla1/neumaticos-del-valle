'use client'

import { useState } from 'react'
import { Calendar, Clock, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Appointment, ConfirmAppointmentRequest } from '@/features/admin/types/appointment'

interface ConfirmAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  onConfirm: (id: string, data: ConfirmAppointmentRequest) => Promise<{ success: boolean; error?: string }>
  isConfirming: boolean
}

export function ConfirmAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
  isConfirming,
}: ConfirmAppointmentDialogProps) {
  const [confirmedDate, setConfirmedDate] = useState('')
  const [confirmedTime, setConfirmedTime] = useState('')
  const [notes, setNotes] = useState('')

  // Initialize with preferred date/time when dialog opens
  useState(() => {
    if (appointment) {
      setConfirmedDate(appointment.preferred_date)
      setConfirmedTime(appointment.preferred_time)
    }
  })

  const handleConfirm = async () => {
    if (!appointment || !confirmedDate || !confirmedTime) return

    const result = await onConfirm(appointment.id, {
      status: 'confirmed',
      confirmed_date: confirmedDate,
      confirmed_time: confirmedTime,
      confirmation_notes: notes || undefined,
    })

    if (result.success) {
      onOpenChange(false)
      // Reset form
      setConfirmedDate('')
      setConfirmedTime('')
      setNotes('')
    }
  }

  if (!appointment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#fafafa] flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#10b981]" />
            Confirmar Turno
          </DialogTitle>
          <DialogDescription className="text-[#888888]">
            Confirma la fecha y hora para el turno de <span className="font-semibold text-[#fafafa]">{appointment.customer_name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Show preferred date/time */}
          <div className="bg-[#3a3a38] rounded-lg p-3 border border-[#444442]">
            <p className="text-xs text-[#888888] mb-2">Fecha y hora solicitada por el cliente:</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#d97757]" />
                <span className="text-sm text-[#fafafa]">
                  {new Date(appointment.preferred_date).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d97757]" />
                <span className="text-sm font-mono text-[#fafafa]">{appointment.preferred_time}</span>
              </div>
            </div>
          </div>

          {/* Confirmed Date */}
          <div className="space-y-2">
            <Label htmlFor="confirmed_date" className="text-[#fafafa]">
              Fecha Confirmada *
            </Label>
            <Input
              id="confirmed_date"
              type="date"
              value={confirmedDate}
              onChange={(e) => setConfirmedDate(e.target.value)}
              className="bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa]"
              required
            />
          </div>

          {/* Confirmed Time */}
          <div className="space-y-2">
            <Label htmlFor="confirmed_time" className="text-[#fafafa]">
              Hora Confirmada *
            </Label>
            <Input
              id="confirmed_time"
              type="time"
              value={confirmedTime}
              onChange={(e) => setConfirmedTime(e.target.value)}
              className="bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa]"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="confirmation_notes" className="text-[#fafafa]">
              Notas de Confirmación (opcional)
            </Label>
            <Textarea
              id="confirmation_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agrega notas o instrucciones adicionales..."
              className="bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa] placeholder-[#666666] min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="bg-[#3a3a38] hover:bg-[#444442] text-[#fafafa]"
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming || !confirmedDate || !confirmedTime}
            className="bg-[#10b981] hover:bg-[#059669] text-white"
          >
            {isConfirming ? 'Confirmando...' : 'Confirmar Turno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
