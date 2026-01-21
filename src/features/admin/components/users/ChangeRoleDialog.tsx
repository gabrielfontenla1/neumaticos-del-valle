import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ChangeRoleDialogProps } from '@/features/admin/types/user'

function getRoleLabel(role: 'admin' | 'vendedor' | null): string {
  if (role === 'admin') return 'Admin'
  if (role === 'vendedor') return 'Vendedor'
  return ''
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  user,
  newRole,
  onConfirm,
  isUpdating
}: ChangeRoleDialogProps) {
  if (!user || !newRole) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#262624] border-[#3a3a38]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#fafafa] text-xl">
              Cambiar Rol
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#888888]">
              ¿Cambiar el rol de{' '}
              <strong className="text-[#fafafa]">
                {user.full_name || user.email}
              </strong>{' '}
              a{' '}
              <strong className="text-[#d97757]">
                {getRoleLabel(newRole)}
              </strong>
              ?
              <br />
              <br />
              <span className="text-xs">
                Este cambio afectará los permisos del usuario inmediatamente.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isUpdating}
              className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] disabled:opacity-50"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isUpdating}
              className="bg-[#d97757] text-white hover:bg-[#d97757]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating && <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />}
              {isUpdating ? 'Actualizando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
