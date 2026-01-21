// Service Selector Component

'use client'

import { Clock, DollarSign, CheckCircle, Check, ChevronRight, Loader2 } from 'lucide-react'
import { useServices } from '../hooks/useServices'

interface ServiceSelectorProps {
  selectedServices?: string[]
  onToggleService: (serviceId: string) => void
  hasVoucher?: boolean
}

export function ServiceSelector({ selectedServices = [], onToggleService, hasVoucher }: ServiceSelectorProps) {
  const { services, loading, error } = useServices()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FEE004]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar los servicios. Por favor intenta de nuevo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          ¿Qué servicios necesitas?
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona uno o más servicios
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = selectedServices.includes(service.id)
          const isFree = hasVoucher && service.voucherEligible

          return (
            <button
              key={service.id}
              onClick={() => onToggleService(service.id)}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all w-full
                ${isSelected
                  ? 'border-[#FEE004] bg-yellow-50 shadow-md'
                  : 'border-gray-200 hover:border-[#FEE004] hover:shadow-sm bg-white'
                }
                ${isFree ? 'ring-2 ring-green-500 ring-offset-2' : ''}
              `}
            >
              {isFree && (
                <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  GRATIS
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900 text-base">
                    {service.name}
                  </h4>

                  <p className="text-xs text-gray-500 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span className={isFree ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}>
                        ${(service.price / 1000).toFixed(0)}k
                      </span>
                      {isFree && (
                        <span className="text-green-600 text-xs font-semibold ml-1">
                          GRATIS
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Checkbox */}
                <div className="flex items-center">
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${isSelected
                      ? 'border-[#FEE004] bg-[#FEE004]'
                      : 'border-gray-300'
                    }
                  `}>
                    {isSelected && (
                      <Check className="w-4 h-4 text-black" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {hasVoucher && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>¡Voucher activo!</strong> Inspección gratis
          </p>
        </div>
      )}
    </div>
  )
}