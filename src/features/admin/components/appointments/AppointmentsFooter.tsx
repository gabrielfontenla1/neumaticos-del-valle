'use client'

import { Card } from '@/components/ui/card'
import type { AppointmentStats } from '@/features/admin/types/appointment'

interface AppointmentsFooterProps {
  totalAppointments: number
  stats: AppointmentStats
}

export function AppointmentsFooter({ totalAppointments, stats }: AppointmentsFooterProps) {
  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20 p-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-[#888888]">
          Mostrando{' '}
          <span className="font-semibold text-[#fafafa]">{totalAppointments}</span> turnos
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
            <span className="text-[#888888]">
              Pendientes: <span className="font-semibold text-[#fafafa]">{stats.pending}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span className="text-[#888888]">
              Confirmados: <span className="font-semibold text-[#fafafa]">{stats.confirmed}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#3b82f6]" />
            <span className="text-[#888888]">
              Completados: <span className="font-semibold text-[#fafafa]">{stats.completed}</span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
