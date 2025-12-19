'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Award,
  CheckCircle2,
  BadgeCheck
} from 'lucide-react'
import { useRef } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'

const guarantees = [
  {
    icon: Shield,
    title: 'Garantía de Autenticidad',
    description: 'Todos nuestros productos son 100% originales con certificado de autenticidad Pirelli. Cada neumático incluye su código de verificación único.',
    features: [
      'Productos directos de fábrica',
      'Certificado de garantía oficial',
      'Trazabilidad completa'
    ]
  },
  {
    icon: Award,
    title: 'Distribuidor Oficial Desde 1984',
    description: '40 años siendo el distribuidor oficial Pirelli en el NOA. Reconocidos por Pirelli Argentina como centro de excelencia.',
    features: [
      'Acceso a toda la línea Pirelli',
      'Capacitación técnica continua',
      'Soporte directo de fábrica'
    ]
  },
  {
    icon: BadgeCheck,
    title: 'Instalación Certificada',
    description: 'Técnicos certificados con equipamiento de última generación. Cada servicio incluye reporte digital completo.',
    features: [
      'Equipos de alineación 3D',
      'Diagnóstico computarizado',
      'Garantía de instalación'
    ]
  }
]

export function GuaranteesSection() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  )

  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEE004]/20 rounded-full mb-6"
          >
            <Shield className="w-5 h-5 text-[#FEE004]" />
            <span className="text-sm font-semibold text-white">
              Tu seguridad es nuestra prioridad
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Garantías que respaldan tu inversión
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Compromiso total con la calidad y tu tranquilidad
          </motion.p>
        </div>

        <div className="md:hidden mb-8">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
          >
            <CarouselContent>
              {guarantees.map((guarantee, index) => (
                <CarouselItem key={index}>
                  <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 select-none">
                    <div className="w-16 h-16 bg-[#FEE004] rounded-2xl flex items-center justify-center mb-6 pointer-events-none">
                      <guarantee.icon className="w-8 h-8 text-black" />
                    </div>

                    <div className="pointer-events-none">
                      <h3 className="text-2xl font-bold mb-4">{guarantee.title}</h3>
                      <p className="text-gray-400 mb-6 leading-relaxed">
                        {guarantee.description}
                      </p>

                      <ul className="space-y-3">
                        {guarantee.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#FEE004] flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {guarantees.map((guarantee, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-[#FEE004]/50 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-[#FEE004] rounded-2xl flex items-center justify-center mb-6">
                <guarantee.icon className="w-8 h-8 text-black" />
              </div>

              <h3 className="text-2xl font-bold mb-4">{guarantee.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {guarantee.description}
              </p>

              <ul className="space-y-3">
                {guarantee.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#FEE004] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 pt-16 border-t border-white/10"
        >
          <p className="text-center text-gray-400 mb-8">
            Certificados y reconocimientos que nos respaldan
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              'Distribuidor Oficial Pirelli',
              'ISO 9001:2015',
              'Cámara de Comercio NOA',
              'Premio Excelencia 2023'
            ].map((badge, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
              >
                <p className="text-sm font-semibold text-white">{badge}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
