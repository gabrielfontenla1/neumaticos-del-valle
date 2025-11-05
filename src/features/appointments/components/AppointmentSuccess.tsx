// Appointment Success Component

'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Sparkles, Star, MapPin, Calendar, Clock, Wrench } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import QRCode from 'react-qr-code'

interface AppointmentSuccessProps {
  appointmentId: string
  appointmentDetails: {
    branch_name: string
    services: string[] // Array of service names
    date: string
    time: string
    customer_name: string
    customer_email: string
  }
}

export function AppointmentSuccess({ appointmentId, appointmentDetails }: AppointmentSuccessProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Subtle celebration icons
  const [showIcons, setShowIcons] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIcons(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Subtle confetti on mount
  useEffect(() => {
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 45,
        origin: { x: 0 },
        colors: ['#FEE004', '#000000']
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 45,
        origin: { x: 1 },
        colors: ['#FEE004', '#000000']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }
    return date.toLocaleDateString('es-AR', options)
  }

  // QR code data with all appointment info
  const qrData = JSON.stringify({
    id: appointmentId,
    name: appointmentDetails.customer_name,
    branch: appointmentDetails.branch_name,
    services: appointmentDetails.services,
    date: appointmentDetails.date,
    time: appointmentDetails.time
  })

  // WhatsApp message with full summary
  const handleWhatsApp = () => {
    const servicesText = appointmentDetails.services.map(s => `• ${s}`).join('\n')
    const message = encodeURIComponent(
      `¡Hola! Acabo de realizar una reserva y fue confirmada automáticamente:\n\n` +
      `Fecha: ${formatDate(appointmentDetails.date)} a las ${appointmentDetails.time}hs\n` +
      `${servicesText}\n` +
      `Sucursal: ${appointmentDetails.branch_name}\n\n` +
      `Mis datos:\n` +
      `Nombre: ${appointmentDetails.customer_name}\n` +
      (appointmentDetails.customer_email ? `Email: ${appointmentDetails.customer_email}\n` : '') +
      `\n` +
      `• ID de Reserva: #${appointmentId.slice(0, 8).toUpperCase()}\n\n` +
      `Muchas gracias!`
    )
    const whatsappUrl = `https://wa.me/5493855946462?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  // Mobile view - fullscreen without mock
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col relative overflow-hidden">
        {/* Celebration confetti background */}
        <AnimatePresence>
          {showIcons && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20, x: -20 }}
                animate={{ opacity: [0, 1, 0], y: -100, x: 20 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute top-20 left-8 pointer-events-none z-10"
              >
                <Star className="w-6 h-6 text-[#FEE004] fill-[#FEE004]" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={{ opacity: [0, 1, 0], y: -100, x: -20 }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                className="absolute top-24 right-8 pointer-events-none z-10"
              >
                <Sparkles className="w-5 h-5 text-[#FEE004]" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: [0, 1, 0], y: -80 }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.4 }}
                className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-10"
              >
                <Star className="w-4 h-4 text-[#FEE004] fill-[#FEE004]" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-900 p-4 shadow-lg">
          <div className="text-center mb-3">
            <h1 className="text-lg font-bold text-[#FEE004]">
              Turno Confirmado
            </h1>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-[#FEE004]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-5 pb-20">
          {/* Success Card with Animation */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center pt-3"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FEE004] to-yellow-300 rounded-full mb-4 shadow-lg shadow-yellow-200">
              <CheckCircle className="w-11 h-11 text-black" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Listo, {appointmentDetails.customer_name.split(' ')[0]}!
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-3">
              <span className="text-xs font-mono text-gray-600">ID:</span>
              <span className="text-sm font-bold text-gray-900">#{appointmentId.slice(0, 8).toUpperCase()}</span>
            </div>
            <p className="text-base text-gray-700 max-w-xs mx-auto">
              Tu turno está confirmado y te esperamos
            </p>
          </motion.div>

          {/* Date & Time - Prominent Card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#FEE004] to-yellow-300 rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-black" />
                <span className="text-sm font-semibold text-black/80">Fecha y Hora</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-black capitalize">
                {formatDate(appointmentDetails.date)}
              </p>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-black/70" />
                <span className="text-xl font-bold text-black">{appointmentDetails.time} hs</span>
              </div>
            </div>
          </motion.div>

          {/* Details Cards */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            {/* Branch */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-500 block mb-1">Sucursal</span>
                  <span className="text-base font-bold text-gray-900">{appointmentDetails.branch_name}</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Wrench className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-500 block mb-2">Servicios Solicitados</span>
                  <div className="space-y-2">
                    {appointmentDetails.services.map((service, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#FEE004]" />
                        <span className="text-sm font-semibold text-gray-900">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* QR Code Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 relative"
          >
            <div className="text-center mb-4">
              <h3 className="text-base font-bold text-gray-900 mb-1">Código QR del Turno</h3>
              <p className="text-xs text-gray-600">Mostrá este código al llegar a la sucursal</p>
            </div>
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-inner">
                <QRCode
                  value={qrData}
                  size={160}
                  level="H"
                  fgColor="#000000"
                />
              </div>
            </div>
            <p className="absolute bottom-2 right-3 text-[9px] text-gray-400 italic">Tomale un screenshot</p>
          </motion.div>

        </div>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <div className="space-y-3 max-w-lg mx-auto">
            {/* WhatsApp Button - Primary */}
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white font-bold text-base rounded-xl hover:bg-[#20BD5A] transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Enviar reserva a la sucursal</span>
            </button>

          </div>
        </div>
      </div>
    )
  }

  // Desktop view - centered card
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Celebration icons */}
      <AnimatePresence>
        {showIcons && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30, x: -30 }}
              animate={{ opacity: [0, 1, 0], y: -120, x: 30 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute top-20 left-1/4 pointer-events-none z-10"
            >
              <Star className="w-8 h-8 text-[#FEE004] fill-[#FEE004]" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30, x: 30 }}
              animate={{ opacity: [0, 1, 0], y: -120, x: -30 }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
              className="absolute top-24 right-1/4 pointer-events-none z-10"
            >
              <Sparkles className="w-7 h-7 text-[#FEE004]" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-3xl w-full relative z-0">
        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-black to-gray-900 p-8">
            <h1 className="text-3xl font-bold text-[#FEE004] mb-2">
              Turno Confirmado
            </h1>
            <p className="text-white/80 text-base">Tu reserva fue registrada exitosamente</p>

            {/* Progress Bar */}
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[#FEE004]"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* Success Message */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#FEE004] to-yellow-300 rounded-full mb-5 shadow-lg shadow-yellow-200">
                <CheckCircle className="w-14 h-14 text-black" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                ¡Listo, {appointmentDetails.customer_name.split(' ')[0]}!
              </h2>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 rounded-full mb-3">
                <span className="text-sm font-mono text-gray-600">ID de Reserva:</span>
                <span className="text-lg font-bold text-gray-900">#{appointmentId.slice(0, 8).toUpperCase()}</span>
              </div>
              <p className="text-lg text-gray-700">
                Tu turno está confirmado y te esperamos
              </p>
            </div>

            {/* Date & Time - Prominent Card */}
            <div className="bg-gradient-to-br from-[#FEE004] to-yellow-300 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-black" />
                <span className="text-base font-bold text-black">Fecha y Hora</span>
              </div>
              <div className="space-y-3">
                <p className="text-3xl font-bold text-black capitalize">
                  {formatDate(appointmentDetails.date)}
                </p>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-black/70" />
                  <span className="text-2xl font-bold text-black">{appointmentDetails.time} hs</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Branch */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <MapPin className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-500 block mb-2">Sucursal</span>
                    <span className="text-lg font-bold text-gray-900">{appointmentDetails.branch_name}</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Wrench className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-500 block mb-3">Servicios Solicitados</span>
                    <div className="space-y-2">
                      {appointmentDetails.services.map((service, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#FEE004]" />
                          <span className="text-base font-semibold text-gray-900">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 relative">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Código QR del Turno</h3>
                <p className="text-sm text-gray-600">Mostrá este código al llegar a la sucursal</p>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-xl border-2 border-gray-300 shadow-lg">
                  <QRCode
                    value={qrData}
                    size={200}
                    level="H"
                    fgColor="#000000"
                  />
                </div>
              </div>
              <p className="absolute bottom-3 right-4 text-[10px] text-gray-400 italic">Tomale un screenshot</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white font-bold text-lg rounded-xl hover:bg-[#20BD5A] transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Enviar reserva a la sucursal</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
