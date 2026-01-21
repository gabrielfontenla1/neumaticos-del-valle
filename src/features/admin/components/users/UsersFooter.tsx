import { Card, CardContent } from '@/components/ui/card'
import type { UsersFooterProps } from '@/features/admin/types/user'

export function UsersFooter({ totalUsers, stats }: UsersFooterProps) {
  return (
    <Card className="bg-[#262624] border-[#3a3a38]">
      <CardContent className="py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-[#888888]">
            <span>
              Total: <strong className="text-[#fafafa]">{totalUsers}</strong>
            </span>
            <span>
              Admins: <strong className="text-blue-400">{stats.admins}</strong>
            </span>
            <span>
              Vendedores: <strong className="text-green-400">{stats.vendedores}</strong>
            </span>
          </div>
          <div className="text-[#666666] text-xs">
            No puedes cambiar tu propio rol
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
