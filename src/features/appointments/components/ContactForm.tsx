// Contact Form Component

'use client'

import React, { useEffect } from 'react'
import { User } from 'lucide-react'
import { AppointmentSummary } from './AppointmentSummary'
import type { Branch, AppointmentFormData } from '../types'

interface ContactFormData {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  voucher_code?: string
  notes?: string
  preferred_date?: string
  preferred_time?: string
  branch_id?: string
}

interface VoucherValidationResult {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
}

interface ContactFormProps {
  formData: ContactFormData
  onUpdate: (data: Partial<ContactFormData>) => void
  onValidateVoucher?: (code: string) => Promise<VoucherValidationResult | null>
  hasValidVoucher?: boolean
  simplified?: boolean
  branch?: Branch
  selectedServices?: string[]
}

export function ContactForm({ formData, onUpdate, onValidateVoucher, hasValidVoucher, simplified = false, branch, selectedServices = [] }: ContactFormProps) {
  const [isMobile, setIsMobile] = React.useState(false)

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (simplified) {
      const savedData = localStorage.getItem('customerData')
      if (savedData) {
        try {
          const customer = JSON.parse(savedData)
          if (customer.name && !formData.customer_name) {
            onUpdate({ customer_name: customer.name })
          }
        } catch (e) {
          console.error('Error loading saved data:', e)
        }
      }
    }
  }, [simplified])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    onUpdate({ [name]: value })
  }

  // Simplified form - summary + name
  if (simplified) {
    return (
      <div className="space-y-6 md:space-y-8">
        {/* Summary Section */}
        <AppointmentSummary
          formData={formData as unknown as AppointmentFormData}
          branch={branch}
          hasValidVoucher={hasValidVoucher}
          selectedServices={selectedServices}
        />

        {/* Name Input Section */}
        <div className="border-t border-gray-200 pt-6 md:pt-8">
          <div className="text-center mb-4 md:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#FEE004] to-yellow-300 rounded-full mb-3 md:mb-4 shadow-lg">
              <User className="w-6 h-6 md:w-8 md:h-8 text-black" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-2">
              ¿Cómo te llamas?
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Para finalizar, déjanos tu nombre
            </p>
          </div>

          {/* Input field */}
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <User className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name || ''}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
                className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#FEE004]/20 focus:border-[#FEE004] text-base md:text-lg text-gray-900 transition-all placeholder:text-gray-400"
                autoFocus
                required
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Original full form (kept for backwards compatibility)
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || undefined
    onUpdate({ vehicle_year: value })
  }

  const handleVoucherValidate = async () => {
    if (formData.voucher_code && onValidateVoucher) {
      const result = await onValidateVoucher(formData.voucher_code)
      if (result) {
        // Pre-fill customer data from voucher if available
        if (result.customer_name && !formData.customer_name) {
          onUpdate({ customer_name: result.customer_name })
        }
        if (result.customer_email && !formData.customer_email) {
          onUpdate({ customer_email: result.customer_email })
        }
        if (result.customer_phone && !formData.customer_phone) {
          onUpdate({ customer_phone: result.customer_phone })
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>

      {/* Customer Information */}
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="inline w-4 h-4 mr-1" />
              Nombre Completo *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name || ''}
              onChange={handleInputChange}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FEE004] focus:border-transparent text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="customer_email"
              value={formData.customer_email || ''}
              onChange={handleInputChange}
              placeholder="juan@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FEE004] focus:border-transparent text-gray-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            name="customer_phone"
            value={formData.customer_phone || ''}
            onChange={handleInputChange}
            placeholder="11 2345-6789"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FEE004] focus:border-transparent text-gray-900"
            required
          />
        </div>
      </div>
    </div>
  )
}