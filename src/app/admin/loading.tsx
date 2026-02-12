// Admin Loading State - Shown during page transitions
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { adminColors as colors } from '@/lib/constants/admin-theme'

export default function AdminLoading() {
  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      <DashboardSkeleton />
    </div>
  )
}
