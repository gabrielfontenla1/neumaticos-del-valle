import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserRow } from './UserRow'
import type { UsersTableProps } from '@/features/admin/types/user'

export function UsersTable({
  users,
  currentUserId,
  onRoleChange,
  isLoading
}: UsersTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <Table>
          <TableHeader className="bg-[#1a1a18] border-b-2 border-[#d97757]/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-bold text-[#d97757] uppercase tracking-wider min-w-[280px] py-4">
                Usuario
              </TableHead>
              <TableHead className="text-xs font-bold text-[#d97757] uppercase tracking-wider text-center py-4">
                Rol
              </TableHead>
              <TableHead className="text-xs font-bold text-[#d97757] uppercase tracking-wider text-center py-4">
                Fecha Creación
              </TableHead>
              <TableHead className="text-xs font-bold text-[#d97757] uppercase tracking-wider text-center py-4">
                Último Acceso
              </TableHead>
              <TableHead className="text-xs font-bold text-[#d97757] uppercase tracking-wider text-center py-4">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-[#3a3a38]/50">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                onRoleChange={(newRole) => onRoleChange(user, newRole)}
              />
            ))}
          </TableBody>
        </Table>

        {/* Empty State */}
        {users.length === 0 && !isLoading && (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-[#888888] mx-auto mb-4" />
            <p className="text-[#888888]">No hay usuarios disponibles</p>
            <p className="text-[#666666] text-sm mt-2">
              {/* Mensaje según filtros aplicados */}
              Intenta cambiar los filtros de búsqueda
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
