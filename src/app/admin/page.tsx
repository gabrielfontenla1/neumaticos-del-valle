// Admin Dashboard - Exact Rapicompras Style
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/features/admin/hooks/useAuth'
import { getDashboardStats } from '@/features/admin/api'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'
import { RecentAppointments } from '@/features/admin/components/RecentAppointments'
import {
  Ticket,
  ShoppingCart,
  Package,
  CalendarDays
} from 'lucide-react'
import { adminColors as colors } from '@/lib/constants/admin-theme'

interface DashboardStats {
  todayAppointments: number
  pendingVouchers: number
  recentOrders: number
  lowStockProducts: number
}

export default function AdminDashboard() {
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingVouchers: 0,
    recentOrders: 0,
    lowStockProducts: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    const stats = await getDashboardStats()
    setDashboardStats(stats)
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div>
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <main className="p-6 space-y-6">
            {/* Header Card */}
            <motion.div
              className="rounded-lg shadow-xl p-6"
              style={{
                backgroundColor: colors.card,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
                Dashboard Administrativo
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                Panel de control y métricas del negocio
              </p>
            </motion.div>
            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {[
                { label: 'Turnos del Día', value: dashboardStats.todayAppointments, Icon: CalendarDays },
                { label: 'Vouchers Activos', value: dashboardStats.pendingVouchers, Icon: Ticket },
                { label: 'Órdenes Recientes', value: dashboardStats.recentOrders, Icon: ShoppingCart },
                { label: 'Stock Bajo', value: dashboardStats.lowStockProducts, Icon: Package }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="rounded-lg shadow-xl p-6 transition-all hover:scale-105"
                  style={{
                    backgroundColor: colors.card,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: colors.mutedForeground }}>{stat.label}</p>
                      <p className="text-2xl font-bold" style={{ color: colors.foreground }}>{stat.value}</p>
                    </div>
                    <div style={{ color: colors.primary }}>
                      <stat.Icon className="w-8 h-8" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Recent Appointments Section */}
            <motion.div
              className="rounded-lg shadow-xl p-6"
              style={{
                backgroundColor: colors.card,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Turnos Próximos</h2>
              <RecentAppointments />
            </motion.div>
    </main>
  )
}
