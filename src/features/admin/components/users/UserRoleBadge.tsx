import { Shield, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserRoleBadgeProps } from '@/features/admin/types/user'

const roleConfig = {
  admin: {
    icon: Shield,
    label: 'Admin',
    className: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  },
  vendedor: {
    icon: UserCog,
    label: 'Vendedor',
    className: 'bg-green-500/10 border-green-500/30 text-green-400'
  }
} as const

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border",
        config.className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}
