'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useRef } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'

const steps = [
  {
    number: '01',
    title: 'Reserva Online',
    description: 'Agenda tu turno en menos de 2 minutos desde cualquier dispositivo',
    icon: Calendar,
    time: '2 min'
  },
  {
    number: '02',
    title: 'Diagnóstico Digital',
    description: 'Evaluación completa con equipamiento de última generación',
    icon: Zap,
    time: '15 min'
  },
  {
    number: '03',
    title: 'Cotización Transparente',
    description: 'Presupuesto detallado sin sorpresas ni costos ocultos',
    icon: CheckCircle2,
    time: '5 min'
  },
  {
    number: '04',
    title: 'Instalación Express',
    description: 'Servicio profesional certificado con garantía de instalación',
    icon: Clock,
    time: '30 min'
  }
]

function StepCard({ step }: { step: typeof steps[0] }) {
  return (
    <motion.div
      className="relative select-none h-full flex flex-col group"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 h-full transition-all duration-300 group-hover:shadow-xl group-hover:border-[#FEE004]/30">
        <div className="relative mb-8">
          <div className="relative z-10 w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FEE004] to-[#FFC700] rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
            <div className="relative w-full h-full bg-black rounded-full flex items-center justify-center border-4 border-[#FEE004] transition-all group-hover:scale-105">
              <div className="absolute inset-0 flex items-center justify-center">
                <step.icon className="w-10 h-10 text-[#FEE004]" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#FEE004] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-black">
                  {step.number}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-black">
            {step.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed min-h-[3rem]">
            {step.description}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FEE004]/10 to-[#FFC700]/10 border border-[#FEE004]/20 rounded-full transition-all group-hover:border-[#FEE004]/40 group-hover:shadow-md">
            <Clock className="w-4 h-4 text-[#FFC700]" />
            <span className="text-sm font-semibold text-gray-900">
              {step.time}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ProcessSection() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  )

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#FEE004]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#FFC700]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FEE004] to-[#FFC700] rounded-full mb-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <TrendingUp className="w-5 h-5 text-black" />
            <span className="text-sm font-bold text-black">
              Proceso simple y transparente
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            De la reserva a la carretera <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-[#FFC700] to-gray-900">
              en 4 pasos
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto"
          >
            Servicio profesional en menos de una hora
          </motion.p>
        </div>

        <div className="md:hidden mb-12">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
          >
            <CarouselContent>
              {steps.map((step, index) => (
                <CarouselItem key={index}>
                  <div className="px-2">
                    <StepCard step={step} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="hidden md:block relative">
          <div className="absolute top-12 left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full" />

          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '75%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
            className="absolute top-12 left-[12.5%] h-1 bg-gradient-to-r from-[#FEE004] via-[#FFC700] to-[#FEE004] rounded-full shadow-lg shadow-[#FFC700]/50"
          />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
              >
                <StepCard step={step} />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center"
        >
          <p className="text-lg text-gray-600 mb-8 font-medium">
            Servicio express sin comprometer la calidad
          </p>
          <Link
            href="/turnos"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#FEE004] to-[#FFC700] text-black rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-[#FFC700]/50 transition-all duration-300 hover:scale-105 border-2 border-black"
          >
            Comenzar Ahora
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
