// Appointment Summary Component

'use client'

import { Calendar, Clock, MapPin, User, Mail, Phone, Car, Wrench, Hash } from 'lucide-react'
import type { AppointmentFormData, Branch } from '../types'
import { SERVICES } from '../types'

interface AppointmentSummaryProps {
  formData: AppointmentFormData
  branch?: Branch
  hasValidVoucher?: boolean
  selectedServices?: string[]
}

export function AppointmentSummary({ formData, branch, hasValidVoucher, selectedServices = [] }: AppointmentSummaryProps) {
  // Get all selected services
  const services = selectedServices.length > 0
    ? selectedServices.map(id => SERVICES.find(s => s.id === id)).filter(Boolean)
    : formData.service_type
      ? [SERVICES.find(s => s.id === formData.service_type)].filter(Boolean)
      : []

  const totalPrice = services.reduce((sum, service) => {
    if (service) {
      const isFree = hasValidVoucher && service.voucherEligible
      return sum + (isFree ? 0 : service.price)
    }
    return sum
  }, 0)

  const totalDuration = services.reduce((sum, service) => service ? sum + service.duration : sum, 0)

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T12:00:00')
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return date.toLocaleDateString('es-AR', options)
  }

  // Show skeleton if data is not ready
  const isLoading = !branch || !formData.preferred_date || !formData.preferred_time

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {/* Header Skeleton */}
        <div className="text-center mb-3">
          <div className="h-7 md:h-8 bg-gray-200 rounded-lg w-32 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-40 mx-auto"></div>
        </div>

        {/* Card Skeleton */}
        <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 space-y-3">
          {/* Branch Skeleton */}
          <div className="pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-48 ml-5 md:ml-6"></div>
          </div>

          {/* Services Skeleton */}
          <div className="py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="ml-5 md:ml-6 space-y-1">
              <div className="h-3 bg-gray-200 rounded w-40"></div>
              <div className="h-3 bg-gray-200 rounded w-36"></div>
            </div>
          </div>

          {/* Date & Time Skeleton */}
          <div className="py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-28"></div>
            </div>
            <div className="ml-5 md:ml-6 space-y-1">
              <div className="h-3 bg-gray-200 rounded w-56"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>

          {/* Customer Skeleton */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-32 ml-5 md:ml-6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
          Resumen
        </h3>
        <p className="text-xs md:text-sm text-gray-600">
          Confirmá tu turno
        </p>
      </div>

      {/* Compact Single Card */}
      <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border border-gray-100">
        {/* Branch */}
        {branch && (
          <div className="pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-0.5">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FEE004]" />
              <span className="text-sm md:text-base font-semibold text-gray-900">{branch.name}</span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 ml-5 md:ml-6">{branch.address}</p>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Wrench className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FEE004]" />
              <span className="text-sm md:text-base font-semibold text-gray-900">Servicios</span>
            </div>
            <div className="ml-5 md:ml-6 space-y-0.5">
              {services.map((service) => {
                if (!service) return null
                return (
                  <div key={service.id} className="flex justify-between items-center">
                    <span className="text-xs md:text-sm text-gray-900">{service.name}</span>
                    <span className="text-xs text-gray-500">{service.duration} min</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div className="py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FEE004]" />
            <span className="text-sm md:text-base font-semibold text-gray-900">Fecha y Hora</span>
          </div>
          <div className="ml-5 md:ml-6 space-y-0.5">
            <p className="text-xs md:text-sm text-gray-900 capitalize">{formatDate(formData.preferred_date)}</p>
            <p className="text-xs md:text-sm text-gray-600">{formData.preferred_time} hs</p>
          </div>
        </div>

        {/* Customer */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-1.5">
            <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#FEE004]" />
            <span className="text-sm md:text-base font-semibold text-gray-900">Cliente</span>
          </div>
          <p className="text-xs md:text-sm text-gray-900 ml-5 md:ml-6">{formData.customer_name}</p>
        </div>
      </div>
    </div>
  )
}