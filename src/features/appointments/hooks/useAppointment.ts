// useAppointment Hook

'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { AppointmentFormData, Appointment, Branch, TimeSlot } from '../types'
import { TIME_SLOTS } from '../types'
import {
  createAppointment,
  getBranches,
  getAppointmentsByDate,
  validateVoucher
} from '../api'

export function useAppointment() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Form data stored in sessionStorage
  const [formData, setFormData] = useState<Partial<AppointmentFormData>>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('appointment-form')
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(formData).length > 0) {
      sessionStorage.setItem('appointment-form', JSON.stringify(formData))
    }
  }, [formData])

  // Load branches on mount and check for authenticated user
  useEffect(() => {
    loadBranches()
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', user.id)
          .single()

        if (profile) {
          // Auto-fill form with user data if not already filled
          setFormData(prev => ({
            ...prev,
            customer_name: prev.customer_name || profile.full_name || '',
            customer_email: prev.customer_email || profile.email || '',
            customer_phone: prev.customer_phone || profile.phone || ''
          }))
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadBranches = async () => {
    const result = await getBranches()
    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('data' in result && result.data) {
      setBranches(result.data)
    }
  }

  const updateFormData = (data: Partial<AppointmentFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const getAvailableTimeSlots = async (branchId: string, date: string): Promise<TimeSlot[]> => {
    try {
      const result = await getAppointmentsByDate(branchId, date)
      if ('error' in result && result.error) {
        setError(result.error)
        return []
      }

      const appointments = ('data' in result ? result.data : null) || []
      const bookedSlots = appointments.reduce((acc: Record<string, number>, apt: Pick<Appointment, 'preferred_time'>) => {
        const key = apt.preferred_time
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      // Check if date is today and filter past time slots
      const now = new Date()
      const selectedDate = new Date(date)
      const isToday = selectedDate.toDateString() === now.toDateString()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      return TIME_SLOTS.map(time => {
        // Mark as unavailable if it's today and time has passed
        if (isToday && time < currentTime) {
          return { date, time, available: false }
        }

        // Max 2 appointments per slot
        const count = bookedSlots[time] || 0
        return { date, time, available: count < 2 }
      })
    } catch (error) {
      console.error('Error getting time slots:', error)
      return TIME_SLOTS.map(time => ({ date, time, available: true }))
    }
  }

  const validateVoucherCode = async (code: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await validateVoucher(code)

      if ('error' in result && result.error) {
        setError(result.error)
        return null
      }

      return 'data' in result ? result.data : null
    } catch (error) {
      setError('Error al validar el voucher')
      return null
    } finally {
      setLoading(false)
    }
  }

  const submitAppointment = async (selectedServices?: string[]) => {
    if (!isFormComplete()) {
      setError('Por favor completa todos los campos requeridos')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Get current user to link appointment
      const { data: { user } } = await supabase.auth.getUser()

      // Add user_id and selectedServices to form data if user is authenticated
      const appointmentData = {
        ...formData,
        user_id: user?.id || null,
        selectedServices: selectedServices || []
      } as AppointmentFormData

      const result = await createAppointment(appointmentData)

      if ('error' in result && result.error) {
        setError(result.error)
        return null
      }

      // Clear session storage on success
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('appointment-form')
      }

      return 'data' in result ? result.data : null
    } catch (error) {
      setError('Error al crear el turno')
      return null
    } finally {
      setLoading(false)
    }
  }

  const isFormComplete = () => {
    const required = [
      'customer_name',
      'branch_id',
      'preferred_date',
      'preferred_time'
    ]

    return required.every(field => formData[field as keyof AppointmentFormData])
  }

  const clearForm = () => {
    setFormData({})
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('appointment-form')
    }
  }

  return {
    formData,
    branches,
    loading,
    error,
    updateFormData,
    getAvailableTimeSlots,
    validateVoucherCode,
    submitAppointment,
    isFormComplete,
    clearForm,
    setError
  }
}