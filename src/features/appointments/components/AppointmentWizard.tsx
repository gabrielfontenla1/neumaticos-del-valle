// Main Appointment Wizard Component

'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Trophy, Zap, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppointment } from '../hooks/useAppointment'
import { deserializeAppointmentFromURL, validateAppointmentParams, serializeAppointmentToURL } from '../url-params'
import WelcomeStep from './steps/WelcomeStep'
import ProvinceStep from './steps/ProvinceStep'
import BranchStep from './steps/BranchStep'
import DateStep from './steps/DateStep'
import TimeStep from './steps/TimeStep'
import { ServiceSelector } from './ServiceSelector'
import { ContactForm } from './ContactForm'
import { AppointmentSummary } from './AppointmentSummary'
import { AppointmentSuccess } from './AppointmentSuccess'
import { SERVICES } from '../types'

type Step = 'welcome' | 'province' | 'branch' | 'service' | 'date' | 'time' | 'contact' | 'summary' | 'success'

const STEPS: Step[] = ['welcome', 'province', 'branch', 'service', 'date', 'time', 'contact']

const STEP_LABELS: Record<Step, string> = {
  welcome: 'Bienvenido',
  province: 'Provincia',
  branch: 'Sucursal',
  service: 'Servicio',
  date: 'Fecha',
  time: 'Hora',
  contact: 'Confirmación',
  summary: 'Resumen',
  success: 'Confirmación'
}

const MOTIVATIONAL_MESSAGES: Record<Step, string> = {
  welcome: '¡Comencemos!',
  province: '¡Excelente elección!',
  branch: '¡Ya casi estás!',
  service: '¡Perfecto! Ahora elige tus servicios',
  date: '¡Genial! Selecciona tu fecha',
  time: '¡Casi listo! Elige tu horario',
  contact: '¡Último paso! Revisa y confirma',
  summary: '¡Revisa los detalles!',
  success: '¡Felicitaciones!'
}

// Animation variants for smooth fade transitions
const pageVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
}

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.2
}

export function AppointmentWizard() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<Step>('welcome')
  const [direction, setDirection] = useState(0)
  const [hasValidVoucher, setHasValidVoucher] = useState(false)
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [selectedProvince, setSelectedProvince] = useState<string | undefined>(undefined)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isFromWhatsApp, setIsFromWhatsApp] = useState(false)
  const urlParamsProcessed = useRef(false)

  const {
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
  } = useAppointment()

  // Check if branches are loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Process URL params when branches are loaded
  useEffect(() => {
    if (urlParamsProcessed.current || branches.length === 0) return

    const params = new URLSearchParams()
    searchParams.forEach((value, key) => params.set(key, value))

    const appointmentParams = deserializeAppointmentFromURL(params)
    if (!appointmentParams) return

    urlParamsProcessed.current = true

    if (appointmentParams.source === 'wa') {
      setIsFromWhatsApp(true)
    }

    // Clear sessionStorage to avoid conflicts
    clearForm()

    const validation = validateAppointmentParams(appointmentParams)

    // Determine the furthest valid step we can jump to
    let targetStep: Step = 'province'
    const formUpdates: Record<string, string | undefined> = {}

    // Validate branch
    if (appointmentParams.branch_id) {
      const branch = branches.find(b => b.id === appointmentParams.branch_id)
      if (branch) {
        formUpdates.branch_id = branch.id
        if (branch.province) {
          setSelectedProvince(branch.province)
        }
        targetStep = 'service'
      } else {
        setError('La sucursal del link no es válida. Seleccioná una.')
        setCurrentStep('province')
        return
      }
    }

    // Validate services
    if (appointmentParams.services && appointmentParams.services.length > 0) {
      const validServices = appointmentParams.services.filter(id =>
        SERVICES.some(s => s.id === id)
      )
      if (validServices.length > 0) {
        setSelectedServices(validServices)
        if (targetStep === 'service') targetStep = 'date'
      }
    }

    // Validate date
    if (appointmentParams.preferred_date) {
      const dateErrors = validation.errors.filter(e =>
        e.includes('Fecha') || e.includes('fecha') || e.includes('domingo') || e.includes('pasó')
      )
      if (dateErrors.length === 0) {
        formUpdates.preferred_date = appointmentParams.preferred_date
        if (targetStep === 'date') targetStep = 'time'
      } else {
        // Date invalid, stop here
        setError(dateErrors[0])
        updateFormData(formUpdates)
        setCurrentStep(targetStep)
        return
      }
    }

    // Validate time
    if (appointmentParams.preferred_time) {
      const timeErrors = validation.errors.filter(e =>
        e.includes('Horario') || e.includes('horario')
      )
      if (timeErrors.length === 0) {
        formUpdates.preferred_time = appointmentParams.preferred_time
        if (targetStep === 'time') targetStep = 'contact'
      }
    }

    // Pre-fill name and phone
    if (appointmentParams.customer_name) {
      formUpdates.customer_name = appointmentParams.customer_name
    }
    if (appointmentParams.customer_phone) {
      formUpdates.customer_phone = appointmentParams.customer_phone
    }

    // Apply all form data at once
    updateFormData(formUpdates)
    setCurrentStep(targetStep)
  }, [branches, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync wizard state to URL as user progresses (replaceState to avoid history pollution)
  useEffect(() => {
    if (currentStep === 'welcome' || currentStep === 'success') return

    const queryString = serializeAppointmentToURL({
      branch_id: formData.branch_id || undefined,
      services: selectedServices.length > 0 ? selectedServices : undefined,
      preferred_date: formData.preferred_date || undefined,
      preferred_time: formData.preferred_time || undefined,
      customer_name: formData.customer_name || undefined,
      customer_phone: formData.customer_phone || undefined,
      source: isFromWhatsApp ? 'wa' : undefined,
    })

    const newUrl = queryString ? `/turnos?${queryString}` : '/turnos'

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', newUrl)
    }
  }, [formData.branch_id, formData.preferred_date, formData.preferred_time, formData.customer_name, formData.customer_phone, selectedServices, currentStep, isFromWhatsApp])

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const currentStepIndex = STEPS.indexOf(currentStep)

  const handleNext = () => {
    // Clear any previous errors
    setError(null)

    // Show celebration animation
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 800)

    // Validate current step
    if (currentStep === 'province' && !selectedProvince) {
      setError('Por favor selecciona una provincia')
      return
    }
    if (currentStep === 'branch' && !formData.branch_id) {
      setError('Por favor selecciona una sucursal')
      return
    }
    if (currentStep === 'service' && selectedServices.length === 0) {
      setError('Por favor selecciona al menos un servicio')
      return
    }
    if (currentStep === 'date' && !formData.preferred_date) {
      setError('Por favor selecciona una fecha')
      return
    }
    if (currentStep === 'time' && !formData.preferred_time) {
      setError('Por favor selecciona un horario')
      return
    }
    if (currentStep === 'contact') {
      if (!formData.customer_name) {
        setError('Por favor ingresa tu nombre')
        return
      }
    }

    // Move to next step
    if (currentStep === 'contact') {
      handleSubmit()
    } else {
      const nextIndex = currentStepIndex + 1
      if (nextIndex < STEPS.length) {
        setDirection(1)
        setCurrentStep(STEPS[nextIndex])
      }
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setDirection(-1)
      setCurrentStep(STEPS[prevIndex])
      setError(null)
    }
  }

  const handleSubmit = async () => {
    const result = await submitAppointment(selectedServices)
    if (result) {
      setAppointmentId(result.id)
      setCurrentStep('success')
    }
  }

  const handleVoucherValidate = async (code: string) => {
    const result = await validateVoucherCode(code)
    if (result) {
      setHasValidVoucher(true)
      // Map DBVoucher to VoucherValidationResult (only return relevant customer fields)
      return {
        customer_name: result.customer_name,
        customer_email: result.customer_email,
        customer_phone: result.customer_phone
      }
    }
    return null
  }

  const handleToggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }

  const getTimeSlots = async (date: string) => {
    if (!formData.branch_id) return []
    return getAvailableTimeSlots(formData.branch_id, date)
  }

  const selectedBranch = branches.find(b => b.id === formData.branch_id)
  const selectedService = SERVICES.find(s => s.id === formData.service_type)

  // Get service names from selected service IDs
  const selectedServiceNames = selectedServices
    .map(serviceId => SERVICES.find(s => s.id === serviceId)?.name)
    .filter((name): name is string => !!name)

  // Show loading screen while initializing
  if (isInitializing || (branches.length === 0 && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Preparando todo...</h2>
              <p className="text-gray-600">Un momento por favor</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show success screen
  if (currentStep === 'success' && appointmentId && formData) {
    return (
      <AppointmentSuccess
        appointmentId={appointmentId}
        appointmentDetails={{
          branch_name: selectedBranch?.name || '',
          services: selectedServiceNames,
          date: formData.preferred_date || '',
          time: formData.preferred_time || '',
          customer_name: formData.customer_name || '',
          customer_email: formData.customer_email || ''
        }}
      />
    )
  }

  // Mobile view - fullscreen without mock
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="bg-black p-4 relative overflow-hidden">
          {/* Celebration Effect */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Sparkles className="w-16 h-16 text-[#FEE004]" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#FEE004]" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-[#FEE004]">
                  {STEP_LABELS[currentStep]}
                </h1>
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-white/70"
                >
                  {MOTIVATIONAL_MESSAGES[currentStep]}
                </motion.p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-white/80 block">
                {currentStepIndex + 1}/{STEPS.length}
              </span>
              {currentStepIndex > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs text-[#FEE004] flex items-center gap-1 justify-end"
                >
                  <Zap className="w-3 h-3" />
                  +{currentStepIndex * 10}%
                </motion.span>
              )}
            </div>
          </div>

          {/* Progress Bar with glow effect */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FEE004] to-yellow-300 shadow-lg shadow-[#FEE004]/50"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            {currentStepIndex === STEPS.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <Trophy className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Content area with animations */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="absolute inset-0 p-6 overflow-y-auto"
            >
              {/* WhatsApp pre-fill banner */}
              {isFromWhatsApp && currentStep !== 'welcome' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 text-sm">Turno pre-cargado desde WhatsApp. Revisá los datos y confirmá.</p>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-800 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Step Content */}
              <div>
                {currentStep === 'welcome' && (
                  <WelcomeStep
                    onStart={() => {
                      setDirection(1)
                      setCurrentStep('province')
                    }}
                  />
                )}

                {currentStep === 'province' && (
                  <ProvinceStep
                    branches={branches}
                    selectedProvince={undefined}
                    onSelect={(province) => {
                      setSelectedProvince(province)
                      setDirection(1)
                      setTimeout(() => setCurrentStep('branch'), 100)
                    }}
                  />
                )}

                {currentStep === 'branch' && (
                  <BranchStep
                    branches={branches}
                    selectedProvince={selectedProvince}
                    selectedBranchId={undefined}
                    onSelect={(id) => {
                      updateFormData({ branch_id: id })
                      setDirection(1)
                      setTimeout(() => setCurrentStep('service'), 100)
                    }}
                  />
                )}

                {currentStep === 'service' && (
                  <ServiceSelector
                    selectedServices={selectedServices}
                    onToggleService={handleToggleService}
                    hasVoucher={hasValidVoucher}
                  />
                )}

                {currentStep === 'date' && (
                  <DateStep
                    selectedDate={undefined}
                    onSelect={(date) => {
                      updateFormData({ preferred_date: date })
                      setDirection(1)
                      setTimeout(() => setCurrentStep('time'), 100)
                    }}
                  />
                )}

                {currentStep === 'time' && (
                  <TimeStep
                    selectedDate={formData.preferred_date || ''}
                    selectedTime={undefined}
                    onSelect={(time) => {
                      updateFormData({ preferred_time: time })
                      setDirection(1)
                      setTimeout(() => setCurrentStep('contact'), 100)
                    }}
                    getTimeSlots={getTimeSlots}
                  />
                )}

                {currentStep === 'contact' && (
                  <ContactForm
                    formData={formData}
                    onUpdate={updateFormData}
                    onValidateVoucher={handleVoucherValidate}
                    hasValidVoucher={hasValidVoucher}
                    simplified={true}
                    branch={selectedBranch}
                    selectedServices={selectedServices}
                  />
                )}
              </div>

              {/* Navigation Button for manual steps */}
              {(currentStep === 'service' || currentStep === 'contact') && (
                <div className="mt-8 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={loading || (currentStep === 'service' && selectedServices.length === 0)}
                    className={`
                      px-8 py-3 rounded-full font-medium transition-all shadow-lg
                      ${loading || (currentStep === 'service' && selectedServices.length === 0)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#FEE004] text-black hover:shadow-xl'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                        Procesando...
                      </>
                    ) : currentStep === 'contact' ? (
                      'Enviar resumen y confirmar turno'
                    ) : (
                      <>
                        Continuar
                        <ChevronRight className="w-5 h-5 inline ml-1" />
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Desktop view - vertical form layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Card */}
        <div className="bg-black rounded-2xl shadow-lg p-6 mb-6 relative overflow-hidden">
          {/* Celebration Effect */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <Sparkles className="w-20 h-20 text-[#FEE004]" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#FEE004]" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#FEE004]">
                  {STEP_LABELS[currentStep]}
                </h1>
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-white/70 mt-1"
                >
                  {MOTIVATIONAL_MESSAGES[currentStep]}
                </motion.p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-white/80 block mb-1">
                Paso {currentStepIndex + 1} de {STEPS.length}
              </span>
              {currentStepIndex > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 justify-end text-[#FEE004]"
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-bold">+{currentStepIndex * 10}%</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Progress Bar with glow effect */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FEE004] to-yellow-300 shadow-lg shadow-[#FEE004]/50"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            {currentStepIndex === STEPS.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Trophy className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="w-full"
            >
              {/* WhatsApp pre-fill banner */}
              {isFromWhatsApp && currentStep !== 'welcome' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-green-800 text-sm">Turno pre-cargado desde WhatsApp. Revisá los datos y confirmá.</p>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-800 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Step Content */}
              <div>
                {currentStep === 'welcome' && (
                  <WelcomeStep
                    onStart={() => {
                      setDirection(1)
                      setCurrentStep('province')
                    }}
                  />
                )}

                {currentStep === 'province' && (
                  <ProvinceStep
                    branches={branches}
                    selectedProvince={undefined}
                    onSelect={(province) => {
                      setSelectedProvince(province)
                      setDirection(1)
                      setTimeout(() => setCurrentStep('branch'), 100)
                    }}
                  />
                )}

                {currentStep === 'branch' && (
                  <BranchStep
                    branches={branches}
                    selectedProvince={selectedProvince}
                    selectedBranchId={undefined}
                    onSelect={(id) => {
                      updateFormData({ branch_id: id })
                      setDirection(1)
                      setTimeout(() => setCurrentStep('service'), 100)
                    }}
                  />
                )}

                {currentStep === 'service' && (
                  <ServiceSelector
                    selectedServices={selectedServices}
                    onToggleService={handleToggleService}
                    hasVoucher={hasValidVoucher}
                  />
                )}

                {currentStep === 'date' && (
                  <DateStep
                    selectedDate={undefined}
                    onSelect={(date) => {
                      updateFormData({ preferred_date: date })
                      setDirection(1)
                      setTimeout(() => setCurrentStep('time'), 100)
                    }}
                  />
                )}

                {currentStep === 'time' && (
                  <TimeStep
                    selectedDate={formData.preferred_date || ''}
                    selectedTime={undefined}
                    onSelect={(time) => {
                      updateFormData({ preferred_time: time })
                      setDirection(1)
                      setTimeout(() => setCurrentStep('contact'), 100)
                    }}
                    getTimeSlots={getTimeSlots}
                  />
                )}

                {currentStep === 'contact' && (
                  <ContactForm
                    formData={formData}
                    onUpdate={updateFormData}
                    onValidateVoucher={handleVoucherValidate}
                    hasValidVoucher={hasValidVoucher}
                    simplified={true}
                    branch={selectedBranch}
                    selectedServices={selectedServices}
                  />
                )}
              </div>

              {/* Navigation Button for manual steps */}
              {(currentStep === 'service' || currentStep === 'contact') && (
                <div className="mt-8 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    disabled={loading || (currentStep === 'service' && selectedServices.length === 0)}
                    className={`
                      px-8 py-3 rounded-full font-medium transition-all shadow-lg
                      ${loading || (currentStep === 'service' && selectedServices.length === 0)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#FEE004] text-black hover:shadow-xl'
                      }
                    `}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                        Procesando...
                      </>
                    ) : currentStep === 'contact' ? (
                      'Enviar resumen y confirmar turno'
                    ) : (
                      <>
                        Continuar
                        <ChevronRight className="w-5 h-5 inline ml-1" />
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
