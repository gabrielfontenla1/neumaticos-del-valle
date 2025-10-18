// Admin Loading State - Shown during page transitions
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

const colors = {
  background: '#30302e',
}

export default function AdminLoading() {
  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh' }}>
      <DashboardSkeleton />
    </div>
  )
}
