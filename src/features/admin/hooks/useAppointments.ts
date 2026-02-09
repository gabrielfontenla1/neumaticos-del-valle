'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type {
  Appointment,
  AppointmentWithBranch,
  AppointmentStatus,
  AppointmentStats,
  AppointmentFilters,
  ConfirmAppointmentRequest,
  UpdateAppointmentStatusRequest,
  DateFilter,
  Branch,
} from '@/features/admin/types/appointment'

export interface UseAppointmentsReturn {
  // Data
  appointments: Appointment[]
  filteredAppointments: Appointment[]
  branches: Branch[]
  isLoading: boolean
  error: string | null

  // Filters
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: AppointmentStatus | 'all'
  setStatusFilter: (value: AppointmentStatus | 'all') => void
  dateFilter: DateFilter
  setDateFilter: (value: DateFilter) => void
  branchFilter: string
  setBranchFilter: (value: string) => void

  // Sorting
  sortBy: 'date' | 'customer' | 'status'
  setSortBy: (value: 'date' | 'customer' | 'status') => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (value: 'asc' | 'desc') => void
  toggleSort: (field: 'date' | 'customer' | 'status') => void

  // Stats
  stats: AppointmentStats

  // Actions
  loadAppointments: () => Promise<void>
  confirmAppointment: (id: string, data: ConfirmAppointmentRequest) => Promise<{ success: boolean; error?: string }>
  cancelAppointment: (id: string, reason?: string) => Promise<{ success: boolean; error?: string }>
  completeAppointment: (id: string, notes?: string) => Promise<{ success: boolean; error?: string }>
  updateAppointmentStatus: (id: string, status: AppointmentStatus, notes?: string) => Promise<{ success: boolean; error?: string }>

  // Dialog state
  selectedAppointment: Appointment | null
  setSelectedAppointment: (appointment: Appointment | null) => void
}

export function useAppointments(): UseAppointmentsReturn {
  // State
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [branchFilter, setBranchFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'customer' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Load appointments and branches on mount
  useEffect(() => {
    loadAppointments()
  }, [])

  // Load appointments from database via admin API (bypasses RLS)
  const loadAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load branches (public access via stores table)
      const { data: branchesData, error: branchesError } = await supabase
        .from('stores')
        .select('id, name, city, province, address, phone')
        .eq('active', true)
        .order('name')

      if (branchesError) throw branchesError
      if (branchesData) setBranches(branchesData)

      // Load appointments via admin API (uses service role key, bypasses RLS)
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/admin/appointments?dateFrom=${today}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar turnos')
      }

      if (result.data) {
        setAppointments(result.data as Appointment[])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los turnos'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Confirm appointment (admin sets confirmed date/time)
  const confirmAppointment = useCallback(
    async (id: string, data: ConfirmAppointmentRequest): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch('/api/admin/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: data.status,
            confirmed_date: data.confirmed_date,
            confirmed_time: data.confirmed_time,
            confirmation_notes: data.confirmation_notes,
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Error al confirmar el turno')

        // Update local state with returned data
        if (result.data) {
          setAppointments((prev) =>
            prev.map((apt) => (apt.id === id ? result.data : apt))
          )
        }

        toast.success('Turno confirmado correctamente')
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al confirmar el turno'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    []
  )

  // Cancel appointment
  const cancelAppointment = useCallback(
    async (id: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch('/api/admin/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: 'cancelled',
            confirmation_notes: reason,
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Error al cancelar el turno')

        // Update local state with returned data
        if (result.data) {
          setAppointments((prev) =>
            prev.map((apt) => (apt.id === id ? result.data : apt))
          )
        }

        toast.success('Turno cancelado')
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cancelar el turno'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    []
  )

  // Complete appointment
  const completeAppointment = useCallback(
    async (id: string, notes?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch('/api/admin/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: 'completed',
            confirmation_notes: notes,
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Error al completar el turno')

        // Update local state with returned data
        if (result.data) {
          setAppointments((prev) =>
            prev.map((apt) => (apt.id === id ? result.data : apt))
          )
        }

        toast.success('Turno marcado como completado')
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al completar el turno'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    []
  )

  // Generic update appointment status
  const updateAppointmentStatus = useCallback(
    async (id: string, status: AppointmentStatus, notes?: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch('/api/admin/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status,
            confirmation_notes: notes,
          }),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Error al actualizar el turno')

        // Update local state with returned data
        if (result.data) {
          setAppointments((prev) =>
            prev.map((apt) => (apt.id === id ? result.data : apt))
          )
        }

        toast.success('Estado del turno actualizado')
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al actualizar el turno'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    []
  )

  // Toggle sort
  const toggleSort = useCallback(
    (field: 'date' | 'customer' | 'status') => {
      if (sortBy === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      } else {
        setSortBy(field)
        setSortOrder('asc')
      }
    },
    [sortBy, sortOrder]
  )

  // Get date range for filter
  const getDateRange = useCallback((filter: DateFilter) => {
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
  }, [])

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (apt) =>
          apt.customer_name.toLowerCase().includes(search) ||
          apt.customer_phone?.includes(search) ||
          apt.customer_email?.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.status === statusFilter)
    }

    // Apply branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter((apt) => apt.store_id === branchFilter)
    }

    // Apply date filter
    const dateRange = getDateRange(dateFilter)
    if (dateRange) {
      filtered = filtered.filter(
        (apt) => apt.preferred_date >= dateRange.start && apt.preferred_date <= dateRange.end
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'date':
          aVal = `${a.preferred_date} ${a.preferred_time}`
          bVal = `${b.preferred_date} ${b.preferred_time}`
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
          aVal = a.preferred_date
          bVal = b.preferred_date
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }, [appointments, searchTerm, statusFilter, branchFilter, dateFilter, sortBy, sortOrder, getDateRange])

  // Calculate stats
  const stats = useMemo((): AppointmentStats => {
    const today = new Date().toISOString().split('T')[0]

    return {
      total: appointments.length,
      today: appointments.filter((a) => a.preferred_date === today).length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      pending: appointments.filter((a) => a.status === 'pending').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    }
  }, [appointments])

  return {
    appointments,
    filteredAppointments,
    branches,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    branchFilter,
    setBranchFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    toggleSort,
    stats,
    loadAppointments,
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
    updateAppointmentStatus,
    selectedAppointment,
    setSelectedAppointment,
  }
}
