'use client'

import { Calendar, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AppointmentsHeaderProps {
  totalAppointments: number
  filteredCount: number
  onReload: () => void
  isLoading: boolean
}

export function AppointmentsHeader({
  totalAppointments,
  filteredCount,
  onReload,
  isLoading,
}: AppointmentsHeaderProps) {
  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#d97757]/20 border border-[#d97757]/30">
              <Calendar className="w-8 h-8 text-[#d97757]" />
            </div>
            <div>
              <CardTitle className="text-2xl text-[#fafafa]">Gestión de Turnos</CardTitle>
              <CardDescription className="text-[#888888]">
                {totalAppointments > 0
                  ? `${totalAppointments} turno${totalAppointments !== 1 ? 's' : ''} en total${
                      filteredCount !== totalAppointments ? ` (${filteredCount} mostrados)` : ''
                    }`
                  : 'Administra todos los turnos del sistema'}
              </CardDescription>
            </div>
          </div>

          <Button
            onClick={onReload}
            disabled={isLoading}
            variant="secondary"
            size="sm"
            className="bg-[#3a3a38] hover:bg-[#444442] text-[#fafafa] border-[#444442] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
