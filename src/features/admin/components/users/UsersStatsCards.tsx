import { Users, Shield, UserCog } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { UsersStatsCardsProps } from '@/features/admin/types/user'

const statsConfig = [
  {
    label: 'Total Usuarios',
    key: 'total' as const,
    Icon: Users,
    color: '#fafafa'
  },
  {
    label: 'Administradores',
    key: 'admins' as const,
    Icon: Shield,
    color: '#3b82f6'
  },
  {
    label: 'Vendedores',
    key: 'vendedores' as const,
    Icon: UserCog,
    color: '#10b981'
  }
] as const

export function UsersStatsCards({ stats }: UsersStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statsConfig.map((stat) => {
        const Icon = stat.Icon
        const value = stats[stat.key]

        return (
          <Card
            key={stat.key}
            className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#a1a1aa]">
                  {stat.label}
                </p>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {value}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
