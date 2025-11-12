'use client'

import React, { useState } from 'react'
import { CreditCard, Info, Minus, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface InstallmentOption {
  installments: number
  discount: number
  finalPrice: number
  monthlyPayment: number
  totalSavings: number
}

interface InstallmentTableProps {
  priceList: number
  quantity?: number
  onQuantityChange?: (quantity: number) => void
}

export default function InstallmentTable({ priceList, quantity: externalQuantity = 1, onQuantityChange }: InstallmentTableProps) {
  const [localQuantity, setLocalQuantity] = useState(externalQuantity)

  // Actualizar el estado local cuando cambie la cantidad externa (desde arriba)
  React.useEffect(() => {
    setLocalQuantity(externalQuantity)
  }, [externalQuantity])

  const handleLocalQuantityChange = (newQuantity: number) => {
    // Solo actualizar el estado local, NO notificar al padre
    setLocalQuantity(newQuantity)
  }

  const quantity = localQuantity
  // Calcular las opciones de cuotas basadas en el precio de lista
  const calculateInstallments = (): InstallmentOption[] => {
    const totalPriceList = priceList * quantity

    const options = [
      { installments: 3, discount: 0.25 },  // 25% descuento
      { installments: 6, discount: 0.15 },  // 15% descuento
      { installments: 9, discount: 0.10 },  // 10% descuento
      { installments: 12, discount: 0.05 }, // 5% descuento
    ]

    return options.map(option => {
      const finalPrice = totalPriceList * (1 - option.discount)
      const monthlyPayment = finalPrice / option.installments
      const totalSavings = totalPriceList - finalPrice

      return {
        installments: option.installments,
        discount: option.discount * 100,
        finalPrice,
        monthlyPayment,
        totalSavings
      }
    })
  }

  const installmentOptions = calculateInstallments()

  // Encontrar la mejor opción (mayor ahorro)
  const bestOption = installmentOptions[0]

  return (
    <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-gray-900">
              Simulador de cuotas
            </h3>
          </div>

          {/* Selector de cantidad */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">Cubiertas:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLocalQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="rounded-none rounded-l-lg h-7 w-7 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-3 py-1 text-xs font-medium text-gray-900 border-x border-gray-300 min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLocalQuantityChange(quantity + 1)}
                className="rounded-none rounded-r-lg h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {installmentOptions.map((option, index) => (
          <div
            key={option.installments}
            className={`rounded-lg p-3 border ${
              index === 0
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Cuota Mensual - Lo más importante */}
              <div className="mb-3">
                <p className="text-[11px] text-gray-500 mb-1">
                  {option.installments} cuotas de
                </p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  ${option.monthlyPayment.toLocaleString('es-AR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </p>
              </div>

              {/* Información secundaria */}
              <div className="space-y-1.5 flex-1 text-[11px] text-gray-500">
                <div className="flex justify-between items-center">
                  <span>Precio final</span>
                  <span className="font-medium text-gray-700">
                    ${option.finalPrice.toLocaleString('es-AR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Descuento</span>
                  <span className="font-medium text-green-600">
                    {option.discount}% OFF
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span>Ahorras</span>
                  <span className="font-semibold text-green-600">
                    ${option.totalSavings.toLocaleString('es-AR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </span>
                </div>
              </div>

              {/* Badge de mejor oferta al final */}
              {index === 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-600 hover:bg-green-50 text-[9px] h-4 px-1.5"
                  >
                    Mejor oferta
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-[10px] text-gray-500 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Precio de lista por cubierta: ${priceList.toLocaleString('es-AR')}
        </p>
      </div>
    </div>
  )
}
