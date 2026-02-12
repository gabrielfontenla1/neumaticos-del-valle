// Turnos Loading State - Shown during page transitions
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { adminColors as colors } from '@/lib/constants/admin-theme'

export default function TurnosLoading() {
  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      <TableSkeleton rows={8} columns={6} />
    </div>
  )
}
