// Recent Appointments Component for Dashboard
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Car } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
}

interface Appointment {
  id: string
  customer_name: string
  customer_phone: string
  service_type: string
  preferred_date: string
  preferred_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  stores?: {
    name: string
  }
}

export function RecentAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodayAppointments()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          loadTodayAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          customer_name,
          customer_phone,
          service_type,
          preferred_date,
          preferred_time,
          status,
          stores (
            name
          )
        `)
        .gte('preferred_date', today)
        .order('preferred_date', { ascending: true })
        .order('preferred_time', { ascending: true })
        .limit(5)

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.primary
      case 'completed':
        return '#10b981'
      case 'cancelled':
        return '#ef4444'
      default:
        return '#f59e0b'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'completed':
        return 'Completado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Pendiente'
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date + 'T12:00:00')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Mañana'
    } else {
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <div className="text-center py-8" style={{ color: colors.mutedForeground }}>
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay turnos programados</p>
        </div>
      ) : (
        <>
          {appointments.map((appointment, index) => (
            <motion.div
              key={appointment.id}
              className="p-4 rounded-lg border transition-all hover:shadow-md"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} />
                    <p className="font-medium truncate" style={{ color: colors.foreground }}>
                      {appointment.customer_name}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm" style={{ color: colors.mutedForeground }}>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{appointment.customer_phone}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Car className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{appointment.service_type}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{formatDate(appointment.preferred_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{appointment.preferred_time} hs</span>
                      </div>
                    </div>

                    {appointment.stores && (
                      <p className="text-xs truncate">{appointment.stores.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span
                    className="inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: `${getStatusColor(appointment.status)}20`,
                      color: getStatusColor(appointment.status)
                    }}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          <Link
            href="/admin/turnos"
            className="block w-full text-center py-2 px-4 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              backgroundColor: colors.primary,
              color: 'white'
            }}
          >
            Ver todos los turnos
          </Link>
        </>
      )}
    </div>
  )
}
