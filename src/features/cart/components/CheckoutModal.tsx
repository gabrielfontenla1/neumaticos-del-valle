'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, X, MapPin, MessageCircle, Check, ChevronRight } from 'lucide-react'
import type { Branch } from '@/types/branch'

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuantity?: number
  showQuantityStep?: boolean
  onConfirm: (quantity: number, branch: Branch) => void
}

type Step = 'quantity' | 'branch'

const QUANTITY_OPTIONS = [
  { value: 1, label: '1', sublabel: 'unidad' },
  { value: 2, label: '2', sublabel: 'unidades' },
  { value: 4, label: '4', sublabel: 'unidades' },
]

export function CheckoutModal({
  open,
  onOpenChange,
  initialQuantity = 1,
  showQuantityStep = true,
  onConfirm,
}: CheckoutModalProps) {
  const [step, setStep] = useState<Step>(showQuantityStep ? 'quantity' : 'branch')
  const [selectedQuantity, setSelectedQuantity] = useState(initialQuantity)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSteps = showQuantityStep ? 2 : 1
  const currentStepNumber = step === 'quantity' ? 1 : (showQuantityStep ? 2 : 1)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(showQuantityStep ? 'quantity' : 'branch')
      setSelectedQuantity(initialQuantity)
      setSelectedBranch(null)
      setError(null)
      // Fetch branches immediately when modal opens
      if (branches.length === 0) {
        fetchBranches()
      }
    }
  }, [open, initialQuantity, showQuantityStep])

  const fetchBranches = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/branches')
      const data = await response.json()
      if (data.success && data.branches) {
        setBranches(data.branches)
        const mainBranch = data.branches.find((b: Branch) => b.is_main)
        if (mainBranch) {
          setSelectedBranch(mainBranch)
        }
      } else {
        setError('No se pudieron cargar las sucursales')
      }
    } catch {
      setError('Error al cargar las sucursales')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleQuantityContinue = () => {
    setStep('branch')
  }

  const handleBack = () => {
    if (step === 'branch' && showQuantityStep) {
      setStep('quantity')
    } else {
      handleClose()
    }
  }

  const handleConfirm = () => {
    if (selectedBranch) {
      onConfirm(selectedQuantity, selectedBranch)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />

      {/* Modal - Full screen on mobile, centered on desktop */}
      <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
        <div
          className="w-full lg:max-w-md bg-white rounded-t-2xl lg:rounded-2xl shadow-[0_-4px_25px_rgba(0,0,0,0.15)] lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-h-[90vh] lg:max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-4 py-4 flex-shrink-0">
            {/* Close button */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleClose}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <span className="text-sm text-gray-500">
                Paso {currentStepNumber} de {totalSteps}
              </span>
              <div className="w-9" /> {/* Spacer for alignment */}
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-2">
              {showQuantityStep && (
                <>
                  {/* Step 1 */}
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${step === 'quantity'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-600 text-white'
                      }
                    `}>
                      {step === 'branch' ? <Check className="h-4 w-4" /> : '1'}
                    </div>
                    <span className={`text-sm font-medium ${step === 'quantity' ? 'text-gray-900' : 'text-gray-500'}`}>
                      Cantidad
                    </span>
                  </div>

                  {/* Connector */}
                  <div className={`w-8 h-0.5 ${step === 'branch' ? 'bg-green-600' : 'bg-gray-200'}`} />

                  {/* Step 2 */}
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${step === 'branch'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}>
                      2
                    </div>
                    <span className={`text-sm font-medium ${step === 'branch' ? 'text-gray-900' : 'text-gray-500'}`}>
                      Sucursal
                    </span>
                  </div>
                </>
              )}

              {!showQuantityStep && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-green-600 text-white">
                    1
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Seleccionar sucursal
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {/* Step 1: Quantity */}
            {step === 'quantity' && showQuantityStep && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    ¿Cuántas unidades necesitás?
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Los neumáticos se cambian en pares o juegos completos
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {QUANTITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedQuantity(option.value)}
                      className={`
                        p-6 rounded-xl border-2 flex flex-col items-center justify-center
                        transition-all duration-200 bg-white
                        ${selectedQuantity === option.value
                          ? 'border-green-600 bg-green-50 shadow-[0_0_0_4px_rgba(22,163,74,0.1)]'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                    >
                      <span className={`text-3xl font-bold ${selectedQuantity === option.value ? 'text-green-600' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                      <span className={`text-sm mt-1 ${selectedQuantity === option.value ? 'text-green-600' : 'text-gray-500'}`}>
                        {option.sublabel}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quick tip */}
                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Tip:</span> Al cambiar 4 neumáticos a la vez obtenés mejor rendimiento y seguridad.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Branch */}
            {step === 'branch' && (
              <div className="p-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    ¿Desde qué sucursal te atendemos?
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Seleccioná la más cercana a tu ubicación
                  </p>
                </div>

                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
                    <p className="text-gray-500">Cargando sucursales...</p>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button variant="outline" onClick={fetchBranches}>
                      Reintentar
                    </Button>
                  </div>
                )}

                {!loading && !error && branches.length > 0 && (
                  <div className="space-y-3">
                    {branches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => setSelectedBranch(branch)}
                        className={`
                          w-full text-left p-4 rounded-xl border-2 bg-white
                          transition-all duration-200
                          ${selectedBranch?.id === branch.id
                            ? 'border-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.1)]'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {/* Radio indicator */}
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
                            flex items-center justify-center
                            ${selectedBranch?.id === branch.id
                              ? 'border-green-600 bg-green-600'
                              : 'border-gray-300'
                            }
                          `}>
                            {selectedBranch?.id === branch.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${selectedBranch?.id === branch.id ? 'text-green-700' : 'text-gray-900'}`}>
                                {branch.name}
                              </span>
                              {branch.is_main && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                  Principal
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{branch.address}</span>
                            </div>
                            {branch.phone && (
                              <p className="text-sm text-gray-500 mt-1">
                                Tel: {branch.phone}
                              </p>
                            )}
                          </div>

                          {selectedBranch?.id === branch.id && (
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0 safe-area-bottom">
            {step === 'quantity' && showQuantityStep && (
              <Button
                onClick={handleQuantityContinue}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-green-600/20"
              >
                Continuar
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            )}

            {step === 'branch' && (
              <div className="space-y-3">
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedBranch || loading}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:shadow-none"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Enviar por WhatsApp
                </Button>

                {showQuantityStep && (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="w-full h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                  >
                    Volver a cantidad
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
