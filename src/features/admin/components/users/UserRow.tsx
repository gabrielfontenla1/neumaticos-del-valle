import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Mail } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserRoleBadge } from './UserRoleBadge'
import type { UserRowProps } from '@/features/admin/types/user'

function getUserInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

export function UserRow({ user, isCurrentUser, onRoleChange }: UserRowProps) {
  const initials = getUserInitials(user.full_name, user.email)
  const createdDate = new Date(user.created_at).toLocaleDateString('es-AR')

  const lastAccess = user.last_sign_in_at
    ? formatDistanceToNow(new Date(user.last_sign_in_at), {
        addSuffix: true,
        locale: es
      })
    : 'Nunca'

  const newRole = user.role === 'admin' ? 'vendedor' : 'admin'

  return (
    <TableRow className="hover:bg-[#2a2a28]/60 transition-all duration-200 border-b border-[#3a3a38]/30 group cursor-pointer hover:shadow-lg hover:shadow-[#d97757]/5">
      {/* User Info */}
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback
              className="font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(217, 119, 87, 0.25), rgba(217, 119, 87, 0.13))',
                color: '#d97757'
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#fafafa] group-hover:text-[#d97757] transition-colors truncate">
                {user.full_name || user.email}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#888888]" />
              <span className="text-xs text-[#888888] font-mono truncate">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </TableCell>

      {/* Role Badge */}
      <TableCell className="text-center py-4">
        <div className="flex justify-center">
          <UserRoleBadge role={user.role} />
        </div>
      </TableCell>

      {/* Created Date */}
      <TableCell className="text-center py-4">
        <span className="text-sm text-[#a1a1aa]">{createdDate}</span>
      </TableCell>

      {/* Last Access */}
      <TableCell className="text-center py-4">
        <span className="text-sm text-[#888888]">{lastAccess}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-center py-4" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRoleChange(newRole)}
          disabled={isCurrentUser}
          className="text-[#d97757] hover:text-[#d97757]/80 hover:bg-[#d97757]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Cambiar a {newRole === 'admin' ? 'Admin' : 'Vendedor'}
        </Button>
      </TableCell>
    </TableRow>
  )
}
