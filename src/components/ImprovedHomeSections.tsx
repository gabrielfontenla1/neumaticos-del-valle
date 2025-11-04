'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  Shield,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Quote,
  TrendingUp,
  Users,
  Zap,
  ThumbsUp,
  BadgeCheck,
  ChevronDown
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'

// Sección de Testimonios Reales
export function TestimonialsSection() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  const testimonials = [
    {
      id: 1,
      name: 'Carlos Mendoza',
      role: 'Conductor de Uber',
      location: 'Catamarca',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      quote: 'Después de 40,000 km con mis Pirelli Cinturato, puedo confirmar que la inversión vale cada peso. El ahorro en combustible y la seguridad que siento al manejar no tienen precio.',
      date: 'Hace 2 semanas',
      verified: true,
      service: 'Cambio de 4 neumáticos'
    },
    {
      id: 2,
      name: 'María González',
      role: 'Arquitecta',
      location: 'Tucumán',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      quote: 'Atención impecable desde que reservé por WhatsApp hasta que salí con mi auto. El diagnóstico digital me mostró exactamente qué necesitaba mi vehículo. Transparencia total.',
      date: 'Hace 1 mes',
      verified: true,
      service: 'Alineación y balanceo'
    },
    {
      id: 3,
      name: 'Roberto Paz',
      role: 'Empresario',
      location: 'Salta',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      quote: 'Llevo 15 años viniendo a Neumáticos del Valle. La diferencia entre un neumático original y uno trucho se nota en cada curva. Acá sé que siempre compro productos certificados.',
      date: 'Hace 1 semana',
      verified: true,
      service: 'Cliente frecuente'
    }
  ]

  const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 select-none">
      {/* Quote Icon */}
      <Quote className="w-10 h-10 text-[#FEE004] mb-4 pointer-events-none" />

      {/* Rating */}
      <div className="flex gap-1 mb-4 pointer-events-none">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-[#FEE004] fill-[#FEE004]" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-gray-700 leading-relaxed mb-6 text-sm pointer-events-none">
        "{testimonial.quote}"
      </p>

      {/* Service Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full mb-6 pointer-events-none">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-gray-700">
          {testimonial.service}
        </span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-4 pt-6 border-t border-gray-200 pointer-events-none">
        <div className="relative w-14 h-14 rounded-full overflow-hidden">
          <Image
            src={testimonial.image}
            alt={testimonial.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
            {testimonial.verified && (
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-gray-600">{testimonial.role}</p>
          <p className="text-xs text-gray-500">{testimonial.location}</p>
        </div>
      </div>

      {/* Date */}
      <p className="text-xs text-gray-400 mt-4 pointer-events-none">{testimonial.date}</p>
    </div>
  )

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEE004]/10 rounded-full mb-6"
          >
            <Star className="w-5 h-5 text-[#FEE004] fill-[#FEE004]" />
            <span className="text-sm font-semibold text-gray-900">
              4.9/5 estrellas en Google
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Más de 100,000 conductores confían en nosotros
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Historias reales de clientes que priorizaron su seguridad
          </motion.p>
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            plugins={[autoplayPlugin.current]}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id}>
                  <TestimonialCard testimonial={testimonial} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-600 mb-6">
            Únete a miles de conductores satisfechos
          </p>
          <Link
            href="/turnos"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#FEE004] text-black rounded-lg font-semibold hover:bg-[#FEE004]/90 transition-all hover:shadow-xl"
          >
            <Calendar className="w-5 h-5" />
            Reservar Mi Turno Ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// Sección de Garantías y Certificaciones
export function GuaranteesSection() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  )

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

  return (
    <section className="py-20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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

        {/* Mobile Carousel - Hidden on Desktop */}
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
                    {/* Icon */}
                    <div className="w-16 h-16 bg-[#FEE004] rounded-2xl flex items-center justify-center mb-6 pointer-events-none">
                      <guarantee.icon className="w-8 h-8 text-black" />
                    </div>

                    {/* Content */}
                    <div className="pointer-events-none">
                      <h3 className="text-2xl font-bold mb-4">{guarantee.title}</h3>
                      <p className="text-gray-400 mb-6 leading-relaxed">
                        {guarantee.description}
                      </p>

                      {/* Features */}
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

        {/* Desktop Grid - Hidden on Mobile */}
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
              {/* Icon */}
              <div className="w-16 h-16 bg-[#FEE004] rounded-2xl flex items-center justify-center mb-6">
                <guarantee.icon className="w-8 h-8 text-black" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-4">{guarantee.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {guarantee.description}
              </p>

              {/* Features */}
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

        {/* Trust Badges */}
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

// Sección de Proceso Transparente - Versión Mejorada
export function ProcessSection() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  )

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

  const StepCard = ({ step, index }: { step: typeof steps[0], index: number }) => (
    <motion.div
      className="relative select-none h-full flex flex-col group"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tarjeta con efecto hover */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 h-full transition-all duration-300 group-hover:shadow-xl group-hover:border-[#FEE004]/30">

        {/* Badge de número del paso - Integrado con ícono */}
        <div className="relative mb-8">
          {/* Círculo de fondo con gradiente */}
          <div className="relative z-10 w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FEE004] to-[#FFC700] rounded-full opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
            <div className="relative w-full h-full bg-black rounded-full flex items-center justify-center border-4 border-[#FEE004] transition-all group-hover:scale-105">
              {/* Ícono dentro del círculo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <step.icon className="w-10 h-10 text-[#FEE004]" />
              </div>
              {/* Número en la esquina superior derecha */}
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#FEE004] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-black">
                  {step.number}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-black">
            {step.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed min-h-[3rem]">
            {step.description}
          </p>

          {/* Time badge mejorado */}
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

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#FEE004]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#FFC700]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header mejorado */}
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

        {/* Mobile Carousel */}
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
                    <StepCard step={step} index={index} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* Desktop Steps con línea de progreso mejorada */}
        <div className="hidden md:block relative">
          {/* Línea de fondo */}
          <div className="absolute top-12 left-[12.5%] right-[12.5%] h-1 bg-gray-200 rounded-full" />

          {/* Línea de progreso animada */}
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
                <StepCard step={step} index={index} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA mejorado */}
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

// Sección de FAQ Estratégico
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: '¿Cómo sé que los neumáticos son originales?',
      answer: 'Cada neumático Pirelli incluye un código único de verificación que puedes validar en el sitio oficial de Pirelli. Además, somos distribuidores oficiales certificados desde 1984, lo que garantiza que todos nuestros productos vienen directamente de fábrica con sus certificados de autenticidad.'
    },
    {
      question: '¿Cuánto tiempo tarda el servicio completo?',
      answer: 'El servicio completo (diagnóstico, instalación de 4 neumáticos, alineación y balanceo) toma aproximadamente 60-90 minutos. Si solo necesitas cambio de neumáticos, el servicio express toma menos de 30 minutos. Te recomendamos reservar turno para evitar esperas.'
    },
    {
      question: '¿Qué garantía tienen los neumáticos?',
      answer: 'Todos los neumáticos Pirelli incluyen la garantía oficial del fabricante que cubre defectos de fábrica. Además, ofrecemos garantía de instalación de 6 meses. La duración específica depende del modelo, pero la mayoría de nuestros neumáticos tienen garantía de 5 años contra defectos de manufactura.'
    },
    {
      question: '¿Puedo pagar en cuotas?',
      answer: 'Sí, aceptamos todas las tarjetas de crédito con planes de cuotas sin interés. También trabajamos con financiación propia para casos especiales. Consultá las opciones disponibles al momento de tu visita o contactanos por WhatsApp.'
    },
    {
      question: '¿Qué incluye el diagnóstico digital?',
      answer: 'El diagnóstico digital incluye: medición de profundidad de dibujo, revisión de desgaste irregular, análisis de presión, inspección de daños laterales, verificación de válvulas, y análisis de alineación con equipamiento 3D. Recibes un reporte completo con fotos y recomendaciones.'
    },
    {
      question: '¿Tienen stock de todos los modelos?',
      answer: 'Mantenemos stock permanente de los modelos más populares en nuestras 6 sucursales. Para medidas especiales o modelos específicos, podemos conseguirlos en 24-48 horas desde el depósito central de Pirelli. Te recomendamos consultarnos antes de tu visita.'
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Preguntas Frecuentes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            Respuestas claras a las dudas más comunes
          </motion.p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-gray-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-8 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center p-8 bg-white rounded-2xl border border-gray-200"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            ¿No encontraste tu respuesta?
          </h3>
          <p className="text-gray-600 mb-6">
            Nuestro equipo está listo para ayudarte
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5492995044430"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Contactar por WhatsApp
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/turnos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FEE004] text-black rounded-lg font-semibold hover:bg-[#FEE004]/90 transition-colors"
            >
              Reservar Turno
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Sección de Social Proof Dinámico
export function LiveSocialProofBanner() {
  const [currentNotification, setCurrentNotification] = useState(0)

  const notifications = [
    { name: 'Juan M.', action: 'reservó un turno', time: 'hace 3 minutos', location: 'Catamarca' },
    { name: 'María G.', action: 'compró 4 neumáticos', time: 'hace 7 minutos', location: 'Tucumán' },
    { name: 'Carlos P.', action: 'realizó un service', time: 'hace 12 minutos', location: 'Salta' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {notifications[currentNotification].name} {notifications[currentNotification].action}
          </p>
          <p className="text-xs text-gray-500">
            {notifications[currentNotification].location} • {notifications[currentNotification].time}
          </p>
        </div>
        <ThumbsUp className="w-5 h-5 text-[#FEE004]" />
      </div>
    </motion.div>
  )
}
