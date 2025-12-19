'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Quote,
  BadgeCheck
} from 'lucide-react'
import { useRef } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'

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

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 select-none">
      <Quote className="w-10 h-10 text-[#FEE004] mb-4 pointer-events-none" />

      <div className="flex gap-1 mb-4 pointer-events-none">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-[#FEE004] fill-[#FEE004]" />
        ))}
      </div>

      <p className="text-gray-700 leading-relaxed mb-6 text-sm pointer-events-none">
        "{testimonial.quote}"
      </p>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full mb-6 pointer-events-none">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-gray-700">
          {testimonial.service}
        </span>
      </div>

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

      <p className="text-xs text-gray-400 mt-4 pointer-events-none">{testimonial.date}</p>
    </div>
  )
}

export function TestimonialsSection() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
