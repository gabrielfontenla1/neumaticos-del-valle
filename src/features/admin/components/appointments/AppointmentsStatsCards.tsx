'use client'

import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { AppointmentStats } from '@/features/admin/types/appointment'

interface AppointmentsStatsCardsProps {
  stats: AppointmentStats
}

export function AppointmentsStatsCards({ stats }: AppointmentsStatsCardsProps) {
  const cards = [
    {
      label: 'Total Programados',
      value: stats.total,
      icon: Calendar,
      color: '#fafafa',
      bgColor: 'rgba(250, 250, 250, 0.1)',
    },
    {
      label: 'Turnos Hoy',
      value: stats.today,
      icon: Clock,
      color: '#d97757',
      bgColor: 'rgba(217, 119, 87, 0.1)',
    },
    {
      label: 'Confirmados',
      value: stats.confirmed,
      icon: CheckCircle2,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Pendientes',
      value: stats.pending,
      icon: Clock,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20 p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[#888888]">{card.label}</p>
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: card.bgColor }}
            >
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
          </div>
          <p className="text-2xl font-bold" style={{ color: card.color }}>
            {card.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
