'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, Truck, Leaf, Building2, MapPin, Gauge, ChevronRight, ChevronLeft, Droplet, CheckCircle2 } from 'lucide-react'
import { shellHelixOils } from '@/data/shellHelixOils'
import type { OilProduct } from '@/data/shellHelixOils'

interface OilWizardProps {
  onRecommendation?: (oilId: string) => void
}

type MotorType = 'gasoline' | 'diesel' | 'hybrid'
type UsageType = 'city' | 'highway' | 'mixed' | 'heavy'

const motorOptions = [
  { id: 'gasoline', label: 'Gasolina', icon: Car, description: 'Nafta común o premium' },
  { id: 'diesel', label: 'Diésel', icon: Truck, description: 'Motor diésel o turbodiésel' },
  { id: 'hybrid', label: 'Híbrido', icon: Leaf, description: 'Motor híbrido o eléctrico' },
] as const

const usageOptions = [
  { id: 'city', label: 'Ciudad', icon: Building2, description: 'Uso urbano, tráfico frecuente' },
  { id: 'highway', label: 'Ruta', icon: MapPin, description: 'Viajes largos, autopista' },
  { id: 'mixed', label: 'Mixto', icon: Car, description: 'Ciudad y ruta por igual' },
  { id: 'heavy', label: 'Trabajo pesado', icon: Gauge, description: 'Carga, remolque, uso intensivo' },
] as const

function getRecommendation(motor: MotorType, usage: UsageType): OilProduct {
  // Lógica de recomendación según SPECS
  let recommendedId: string

  if (motor === 'hybrid') {
    recommendedId = 'ultra-x-5w30' // Híbrido → Ultra X 5W-30
  } else if (usage === 'heavy') {
    recommendedId = 'ultra-5w40-4l' // Trabajo pesado → Ultra 5W-40
  } else if (motor === 'diesel') {
    recommendedId = 'hx8-prof-av-5w40' // Diésel → HX8 5W-40
  } else if (motor === 'gasoline') {
    if (usage === 'highway') {
      recommendedId = 'hx8-pro-ag-5w30' // Gasolina + Ruta → HX8 5W-30
    } else {
      recommendedId = 'hx7-10w40' // Gasolina + Ciudad/Mixto → HX7 10W-40
    }
  } else {
    recommendedId = 'hx7-10w40' // Default
  }

  return shellHelixOils.find(oil => oil.id === recommendedId) || shellHelixOils[0]
}

export function OilWizard({ onRecommendation }: OilWizardProps) {
  const [step, setStep] = useState(1)
  const [motorType, setMotorType] = useState<MotorType | null>(null)
  const [usageType, setUsageType] = useState<UsageType | null>(null)
  const [recommendation, setRecommendation] = useState<OilProduct | null>(null)

  const handleMotorSelect = (motor: MotorType) => {
    setMotorType(motor)
    setStep(2)
  }

  const handleUsageSelect = (usage: UsageType) => {
    setUsageType(usage)
    if (motorType) {
      const recommended = getRecommendation(motorType, usage)
      setRecommendation(recommended)
      setStep(3)
    }
  }

  const handleViewProduct = () => {
    if (recommendation && onRecommendation) {
      onRecommendation(recommendation.id)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
      setMotorType(null)
    } else if (step === 3) {
      setStep(2)
      setUsageType(null)
      setRecommendation(null)
    }
  }

  const handleReset = () => {
    setStep(1)
    setMotorType(null)
    setUsageType(null)
    setRecommendation(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-black px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Droplet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">¿Qué aceite necesito?</h3>
            <p className="text-sm text-white/80">Te ayudamos a elegir en 2 pasos</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s < step
                    ? 'bg-[#FEE004] text-black'
                    : s === step
                    ? 'bg-white/30 text-white border-2 border-white'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-8 h-0.5 mx-1 ${s < step ? 'bg-white' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Motor Type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                ¿Qué tipo de motor tiene tu vehículo?
              </h4>
              <div className="grid gap-3">
                {motorOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleMotorSelect(option.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#FEE004] hover:bg-[#FEE004]/10 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-[#FEE004]/20 flex items-center justify-center transition-colors">
                      <option.icon className="w-6 h-6 text-gray-600 group-hover:text-[#FEE004] transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FEE004] transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Usage Type */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Volver"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h4 className="text-lg font-semibold text-gray-900">
                  ¿Cómo usás tu vehículo principalmente?
                </h4>
              </div>
              <div className="grid gap-3">
                {usageOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleUsageSelect(option.id)}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#FEE004] hover:bg-[#FEE004]/10 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-[#FEE004]/20 flex items-center justify-center transition-colors">
                      <option.icon className="w-6 h-6 text-gray-600 group-hover:text-[#FEE004] transition-colors" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FEE004] transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Recommendation */}
          {step === 3 && recommendation && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Volver"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h4 className="text-lg font-semibold text-gray-900">
                  Te recomendamos
                </h4>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-[#FEE004] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Droplet className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xl font-bold text-gray-900">{recommendation.name}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-sm font-medium text-gray-700">
                        {recommendation.viscosity}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FEE004]/20 rounded text-sm font-medium text-black">
                        {recommendation.category}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {recommendation.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleViewProduct}
                  className="flex-1 px-6 py-3 bg-[#FEE004] text-black rounded-xl font-semibold hover:bg-[#FDD000] transition-colors"
                >
                  Ver producto
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Empezar de nuevo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
