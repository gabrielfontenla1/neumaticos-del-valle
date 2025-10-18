'use client'

import { Calendar, Clock, CheckCircle, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

interface WelcomeStepProps {
  onStart: () => void
}

export default function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center mb-6"
      >
        <div className="bg-[#FEE004] rounded-full p-4">
          <Calendar className="w-12 h-12 text-black" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
      >
        Agenda tu Turno para el Taller
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto"
      >
        Reserva tu horario en pocos minutos. Evita esperas y asegura la atención de nuestros expertos.
      </motion.p>

      {/* Benefits */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
      >
        <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
          <div className="bg-[#FEE004] rounded-full p-3 mb-3">
            <Clock className="w-6 h-6 text-black" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Rápido y Fácil</h3>
          <p className="text-sm text-gray-600">Solo 2 minutos para agendar</p>
        </div>

        <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
          <div className="bg-[#FEE004] rounded-full p-3 mb-3">
            <MapPin className="w-6 h-6 text-black" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">6 Sucursales</h3>
          <p className="text-sm text-gray-600">En todo el NOA</p>
        </div>

        <div className="flex flex-col items-center p-4 rounded-xl bg-gray-50">
          <div className="bg-[#FEE004] rounded-full p-3 mb-3">
            <CheckCircle className="w-6 h-6 text-black" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Confirmación Inmediata</h3>
          <p className="text-sm text-gray-600">Por WhatsApp</p>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="px-10 py-4 bg-[#FEE004] text-black rounded-full font-semibold text-lg hover:shadow-xl transition-all"
      >
        Comenzar Reserva
      </motion.button>
    </div>
  )
}
