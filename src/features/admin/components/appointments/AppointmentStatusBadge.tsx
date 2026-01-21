'use client'

import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { APPOINTMENT_STATUS_STYLES } from '@/lib/constants/admin-theme'
import type { AppointmentStatus } from '@/features/admin/types/appointment'

interface AppointmentStatusBadgeProps {
  status: AppointmentStatus
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  'no-show': 'No asistió',
}

const STATUS_ICONS: Record<AppointmentStatus, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  'no-show': AlertCircle,
}

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const Icon = STATUS_ICONS[status]
  const badgeClass = APPOINTMENT_STATUS_STYLES[status].badge

  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1.5 ${badgeClass}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {STATUS_LABELS[status]}
    </span>
  )
}
