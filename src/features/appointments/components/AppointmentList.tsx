// Appointment List Component for Admin

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Car, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

interface Appointment {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  service_type: string
  preferred_date: string
  preferred_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  stores?: {
    name: string
    address: string
  }
  created_at: string
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [filter, dateFilter])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          stores (
            name,
            address
          )
        `)
        .order('preferred_date', { ascending: true })
        .order('preferred_time', { ascending: true })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      if (dateFilter) {
        query = query.eq('preferred_date', dateFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      // Create untyped client to avoid type inference issues
      const untypedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await untypedClient
        .from('appointments')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)

      if (error) throw error

      // Reload appointments
      loadAppointments()
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      confirmed: { icon: CheckCircle, color: 'bg-blue-100 text-blue-800', label: 'Confirmado' },
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Completado' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Cancelado' }
    }

    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get today's date for the date filter
  const today = new Date().toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter('all')
                setDateFilter('')
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No se encontraron turnos con los filtros seleccionados
          </div>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left side - Appointment Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {appointment.customer_name}
                      </h3>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {appointment.customer_phone}
                        </p>
                        <p>{appointment.customer_email}</p>
                      </div>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Servicio:</span>
                      <p className="text-gray-600">{appointment.service_type}</p>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Fecha:
                      </span>
                      <p className="text-gray-600">{formatDate(appointment.preferred_date)}</p>
                    </div>

                    <div>
                      <span className="font-medium text-gray-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Hora:
                      </span>
                      <p className="text-gray-600">{appointment.preferred_time} hs</p>
                    </div>

                    {appointment.vehicle_make && (
                      <div>
                        <span className="font-medium text-gray-700 flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          Vehículo:
                        </span>
                        <p className="text-gray-600">
                          {[appointment.vehicle_make, appointment.vehicle_model, appointment.vehicle_year]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      </div>
                    )}

                    {appointment.stores && (
                      <div>
                        <span className="font-medium text-gray-700">Sucursal:</span>
                        <p className="text-gray-600">{appointment.stores.name}</p>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notas:</span> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right side - Actions */}
                <div className="flex gap-2">
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(appointment.id, 'confirmed')}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => updateStatus(appointment.id, 'cancelled')}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(appointment.id, 'completed')}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                    >
                      Completar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}