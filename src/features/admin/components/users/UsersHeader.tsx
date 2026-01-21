import { motion } from 'framer-motion'
import { Users, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { UsersHeaderProps } from '@/features/admin/types/user'

export function UsersHeader({
  totalUsers,
  filteredCount,
  onCreateUser,
  onReload,
  isLoading
}: UsersHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#d97757]/20 border border-[#d97757]/30">
                <Users className="w-8 h-8 text-[#d97757]" />
              </div>
              <div>
                <CardTitle className="text-2xl text-[#fafafa]">Gestión de Usuarios</CardTitle>
                <CardDescription className="text-[#888888]">
                  {filteredCount} de {totalUsers} usuarios
                </CardDescription>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={onReload}
                disabled={isLoading}
                variant="outline"
                className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Recargar
              </Button>
              <Button
                onClick={onCreateUser}
                className="bg-[#d97757] text-white hover:bg-[#d97757]/90 transition-colors shadow-lg shadow-[#d97757]/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  )
}
