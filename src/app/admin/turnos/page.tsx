// Admin Turnos Page - Exact Rapicompras Style (Matching Products Page)
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Search,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  input: '#262626',
  secondary: '#262626',
}

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
type DateFilter = 'all' | 'today' | 'tomorrow' | 'week'

interface Branch {
  id: string
  name: string
  city: string
  province: string
  address: string
  phone: string | null
}

interface Appointment {
  id: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_type: string
  appointment_date: string
  appointment_time: string
  branch: string
  status: AppointmentStatus
  notes: string | null
  created_at: string
  store_id: string | null
  stores: Branch | null
}

export default function TurnosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterAndSortAppointments()
  }, [appointments, searchTerm, dateFilter, selectedBranch, sortBy, sortOrder])

  const loadData = async () => {
    setIsLoading(true)

    // Load stores
    const { data: storesData } = await supabase
      .from('stores')
      .select('*')
      .eq('active', true)
      .order('name')

    if (storesData) setBranches(storesData)

    // Load appointments with store info
    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        *,
        stores:store_id (
          id,
          name,
          city,
          province,
          address,
          phone
        )
      `)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date')
      .order('appointment_time')

    if (appointmentsData) setAppointments(appointmentsData as Appointment[])

    setIsLoading(false)
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#14532d20', text: '#86efac' }
      case 'completed':
        return { bg: '#1e3a8a20', text: '#93c5fd' }
      case 'pending':
        return { bg: '#78350f20', text: '#fcd34d' }
      case 'cancelled':
        return { bg: '#7f1d1d20', text: '#fca5a5' }
      default:
        return { bg: colors.secondary, text: colors.mutedForeground }
    }
  }

  const getStatusLabel = (status: AppointmentStatus) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      completed: 'Completado',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return CheckCircle2
      case 'pending':
        return Clock
      case 'cancelled':
        return XCircle
      default:
        return AlertCircle
    }
  }

  const getDateRange = (filter: DateFilter) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    switch (filter) {
      case 'today':
        return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] }
      case 'tomorrow':
        return { start: tomorrow.toISOString().split('T')[0], end: tomorrow.toISOString().split('T')[0] }
      case 'week':
        return { start: today.toISOString().split('T')[0], end: weekEnd.toISOString().split('T')[0] }
      default:
        return null
    }
  }

  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])

  const filterAndSortAppointments = () => {
    let filtered = [...appointments]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.customer_phone?.includes(searchTerm) ||
        apt.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply branch filter
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(apt => apt.store_id === selectedBranch)
    }

    // Apply date filter
    const dateRange = getDateRange(dateFilter)
    if (dateRange) {
      filtered = filtered.filter(apt =>
        apt.appointment_date >= dateRange.start && apt.appointment_date <= dateRange.end
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'date':
          aVal = `${a.appointment_date} ${a.appointment_time}`
          bVal = `${b.appointment_date} ${b.appointment_time}`
          break
        case 'customer':
          aVal = a.customer_name.toLowerCase()
          bVal = b.customer_name.toLowerCase()
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        default:
          aVal = a.appointment_date
          bVal = b.appointment_date
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredAppointments(filtered)
  }

  const toggleSort = (field: 'date' | 'customer' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const stats = {
    total: appointments.length,
    today: appointments.filter(a =>
      a.appointment_date === new Date().toISOString().split('T')[0]
    ).length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length
  }

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0]
  }

  const SortIcon = ({ field }: { field: 'date' | 'customer' | 'status' }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ?
      <ChevronUp className="w-4 h-4" /> :
      <ChevronDown className="w-4 h-4" />
  }

  if (isLoading) {
    return (
      <div>
        <TableSkeleton rows={8} columns={6} />
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
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
            Gestión de Turnos
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
            {appointments.length} turnos en total
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Total Programados', value: stats.total, Icon: Calendar, color: colors.foreground },
            { label: 'Turnos Hoy', value: stats.today, Icon: Clock, color: colors.primary },
            { label: 'Confirmados', value: stats.confirmed, Icon: CheckCircle2, color: '#10b981' }
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl p-6" style={{
              backgroundColor: colors.card,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: colors.mutedForeground }}>
                  {stat.label}
                </p>
                <stat.Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl p-4" style={{
          backgroundColor: colors.card,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        }}>
          <div className="space-y-4">
            {/* Date Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Todos', icon: null },
                { value: 'today', label: 'Hoy', icon: Clock },
                { value: 'tomorrow', label: 'Mañana', icon: null },
                { value: 'week', label: 'Esta Semana', icon: null }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setDateFilter(value as DateFilter)}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: dateFilter === value ? colors.primary : colors.secondary,
                    color: dateFilter === value ? '#ffffff' : colors.foreground,
                    borderWidth: '1px',
                    borderColor: dateFilter === value ? colors.primary : colors.border
                  }}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {label}
                </button>
              ))}
            </div>

            {/* Search and Branch Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border rounded-lg outline-none"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground
                  }}
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5" style={{ color: colors.mutedForeground }} />
              </div>

              {/* Branch Filter */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-4 py-2 border rounded-lg outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              >
                <option value="all">Todas las sucursales</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} - {branch.city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="rounded-xl overflow-hidden" style={{
          backgroundColor: colors.card,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
        }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.secondary }}>
                <tr>
                  <th
                    onClick={() => toggleSort('date')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: colors.mutedForeground }}
                  >
                    <div className="flex items-center gap-1">
                      Fecha & Hora
                      <SortIcon field="date" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('customer')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: colors.mutedForeground }}
                  >
                    <div className="flex items-center gap-1">
                      Cliente
                      <SortIcon field="customer" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: colors.mutedForeground }}>
                    Ubicación
                  </th>
                  <th
                    onClick={() => toggleSort('status')}
                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors"
                    style={{ color: colors.mutedForeground }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Estado
                      <SortIcon field="status" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderTopColor: colors.border }}>
                {filteredAppointments.map((appointment) => {
                  const StatusIcon = getStatusIcon(appointment.status)
                  const statusColor = getStatusColor(appointment.status)

                  return (
                    <tr
                      key={appointment.id}
                      className="transition-colors hover:bg-opacity-5"
                      style={{
                        borderBottomWidth: '1px',
                        borderBottomColor: colors.border,
                        backgroundColor: isToday(appointment.appointment_date) ? 'rgba(217, 119, 87, 0.05)' : 'transparent'
                      }}
                    >
                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {isToday(appointment.appointment_date) && (
                              <div className="h-2 w-2 rounded-full animate-pulse"
                                style={{ backgroundColor: colors.primary }} />
                            )}
                            <span
                              className={`text-sm ${isToday(appointment.appointment_date) ? 'font-semibold' : ''}`}
                              style={{
                                color: isToday(appointment.appointment_date) ? colors.primary : colors.foreground
                              }}
                            >
                              {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: isToday(appointment.appointment_date) ? undefined : '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs" style={{ color: colors.mutedForeground }}>
                            <Clock className="h-3 w-3" />
                            <span className="font-mono font-semibold">{appointment.appointment_time}</span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{
                              backgroundColor: 'rgba(217, 119, 87, 0.2)',
                              color: colors.primary
                            }}>
                            {appointment.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium" style={{ color: colors.foreground }}>
                            {appointment.customer_name}
                          </span>
                        </div>
                      </td>

                      {/* Service */}
                      <td className="px-6 py-4">
                        <span className="text-sm" style={{ color: colors.mutedForeground }}>
                          {appointment.service_type}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          {appointment.customer_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" style={{ color: colors.mutedForeground }} />
                              <span style={{ color: colors.foreground }}>{appointment.customer_phone}</span>
                            </div>
                          )}
                          {appointment.customer_email && (
                            <div className="flex items-center gap-1 text-xs" style={{ color: colors.mutedForeground }}>
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{appointment.customer_email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-6 py-4">
                        {appointment.stores && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: colors.primary }} />
                              <span className="text-sm font-medium" style={{ color: colors.foreground }}>
                                {appointment.stores.name}
                              </span>
                            </div>
                            <span className="text-xs pl-5" style={{ color: colors.mutedForeground }}>
                              {appointment.stores.city}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5"
                            style={{
                              backgroundColor: statusColor.bg,
                              color: statusColor.text
                            }}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {getStatusLabel(appointment.status)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: colors.mutedForeground }} />
                <p style={{ color: colors.mutedForeground }}>
                  {searchTerm || selectedBranch !== 'all' || dateFilter !== 'all'
                    ? 'No se encontraron turnos con los filtros aplicados'
                    : 'No hay turnos programados'}
                </p>
              </div>
            )}
          </div>
        </div>
    </main>
  )
}
