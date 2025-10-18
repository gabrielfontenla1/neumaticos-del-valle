'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Calendar,
  ChevronDown,
  MapPin,
  Phone,
  MessageCircle,
  ArrowRight,
  Star,
  Users,
  Shield,
  Award,
  Zap,
  Clock,
  CheckCircle2,
  Info
} from 'lucide-react'
import { Navbar } from './Navbar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

export function TeslaHomePage() {
  const { scrollY } = useScroll()

  // Parallax effect for hero section
  const heroY = useTransform(scrollY, [0, 500], [0, 150])
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])

  const tireModels = [
    {
      id: 1,
      name: 'Scorpion Verde',
      category: 'SUV & Camionetas',
      image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=600&fit=crop',
      description: 'Máximo rendimiento para SUVs de alta gama',
      price: 'Consultar',
      features: ['Todo terreno', 'Bajo ruido', 'Eco-friendly']
    },
    {
      id: 2,
      name: 'P Zero',
      category: 'Alta Performance',
      image: 'https://images.unsplash.com/photo-1562113130-860bca0e8169?w=800&h=600&fit=crop',
      description: 'El neumático elegido por los mejores autos deportivos',
      price: 'Consultar',
      features: ['Ultra High Performance', 'Máxima adherencia', 'Control preciso']
    },
    {
      id: 3,
      name: 'Cinturato P7',
      category: 'Autos Premium',
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
      description: 'Confort, seguridad y eficiencia para tu auto',
      price: 'Consultar',
      features: ['Bajo consumo', 'Gran durabilidad', 'Confort acústico']
    }
  ]

  const services = [
    {
      title: 'Alineación y Balanceo',
      description: 'Tecnología de última generación para un perfecto equilibrio',
      image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop',
      icon: Zap
    },
    {
      title: 'Service Express',
      description: 'Cambio de neumáticos en menos de 30 minutos',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop',
      icon: Clock
    },
    {
      title: 'Diagnóstico Digital',
      description: 'Evaluación completa del estado de tus neumáticos',
      image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop',
      icon: CheckCircle2
    }
  ]

  const benefits = [
    {
      icon: Award,
      title: '40+ Años de Experiencia',
      description: 'Líder en el NOA con más de 4 décadas garantizando tu seguridad'
    },
    {
      icon: Shield,
      title: '100% Productos Originales',
      description: 'Distribuidor oficial Pirelli con garantía de autenticidad'
    },
    {
      icon: Users,
      title: '100K+ Clientes Satisfechos',
      description: 'Miles de conductores confían en nosotros cada año'
    },
    {
      icon: MapPin,
      title: '6 Sucursales en el NOA',
      description: 'Red de sucursales para atenderte cerca de donde estés'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Professional Navbar */}
      <Navbar />

      {/* Hero Section - Landing Page Style */}
      <section className="relative h-screen overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1606577924006-27d39b132ae2?w=1920&h=1080&fit=crop&q=80')`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </div>
        </motion.div>

        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            {/* Badge/Trust Signal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEE004]/20 backdrop-blur-sm rounded-full mb-8 border border-[#FEE004]/30"
            >
              <Award className="w-5 h-5 text-[#FEE004]" />
              <span className="text-white font-medium text-sm">
                Distribuidor Oficial Pirelli desde 1984
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              Neumáticos Premium
              <br />
              <span className="text-[#FEE004]">Con Garantía Total</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-10 font-light max-w-3xl mx-auto">
              La mayor red de distribución Pirelli en el NOA. Más de 40 años garantizando tu seguridad en cada viaje.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/turnos"
                className="group px-8 py-4 bg-[#FEE004] text-black rounded-lg font-semibold text-lg hover:bg-[#FEE004]/90 transition-all hover:shadow-xl hover:shadow-[#FEE004]/30 inline-flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Reservar Turno
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/productos"
                className="px-8 py-4 bg-white/10 text-white border-2 border-white/30 backdrop-blur-sm rounded-lg font-semibold text-lg hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2"
              >
                Ver Catálogo
              </Link>
            </div>

            {/* Trust Indicators with Tooltips */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Star className="w-5 h-5 text-[#FEE004] fill-[#FEE004]" />
                    <span className="text-sm font-medium">4.9/5 Estrellas</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-[#FEE004]">
                  <p>Basado en más de 5,000 reseñas de Google</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Users className="w-5 h-5 text-[#FEE004]" />
                    <span className="text-sm font-medium">+100K Clientes</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-[#FEE004]">
                  <p>Atendidos en los últimos 5 años</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <Shield className="w-5 h-5 text-[#FEE004]" />
                    <span className="text-sm font-medium">Garantía Total</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white border-[#FEE004]">
                  <p>Productos originales con garantía del fabricante</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-white animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - Above the Fold Alternative */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              ¿Por qué elegirnos?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              La confianza de miles de conductores respaldada por décadas de excelencia
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform cursor-help">
                      <benefit.icon className="w-7 h-7 text-[#FEE004]" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white border-[#FEE004]">
                    <p className="font-semibold">{benefit.title}</p>
                  </TooltipContent>
                </Tooltip>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tire Models Section with Carousel */}
      <section id="modelos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Neumáticos Pirelli
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600"
            >
              Tecnología italiana de clase mundial para cada tipo de vehículo
            </motion.p>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {tireModels.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="group cursor-pointer">
                      <div className="relative h-[450px] overflow-hidden rounded-2xl bg-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500">
                        <Image
                          src={model.image}
                          alt={model.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <p className="text-sm font-semibold text-[#FEE004] mb-2 uppercase tracking-wide">
                            {model.category}
                          </p>
                          <h3 className="text-3xl font-bold mb-3">{model.name}</h3>
                          <p className="text-white/90 text-sm mb-4 line-clamp-2">
                            {model.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {model.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-3">
                            <Link
                              href="/productos"
                              className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors text-center"
                            >
                              Ver Detalles
                            </Link>
                            <Link
                              href="/turnos"
                              className="px-4 py-2.5 bg-[#FEE004] text-black rounded-lg text-sm font-semibold hover:bg-[#FEE004]/90 transition-colors"
                            >
                              Cotizar
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 bg-black text-white border-[#FEE004]">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#FEE004]">{model.name}</h4>
                      <p className="text-sm text-gray-300">{model.description}</p>
                      <div className="pt-2 space-y-1">
                        <p className="text-xs text-gray-400 font-semibold">Características:</p>
                        {model.features.map((feature, idx) => (
                          <p key={idx} className="text-xs text-gray-300">• {feature}</p>
                        ))}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </motion.div>
            ))}
          </div>

          {/* Mobile: Carousel */}
          <div className="md:hidden">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {tireModels.map((model) => (
                  <CarouselItem key={model.id}>
                    <div className="p-1">
                      <div className="relative h-[450px] overflow-hidden rounded-2xl bg-gray-100 shadow-lg">
                        <Image
                          src={model.image}
                          alt={model.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <p className="text-sm font-semibold text-[#FEE004] mb-2 uppercase tracking-wide">
                            {model.category}
                          </p>
                          <h3 className="text-3xl font-bold mb-3">{model.name}</h3>
                          <p className="text-white/90 text-sm mb-4 line-clamp-2">
                            {model.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {model.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-3">
                            <Link
                              href="/productos"
                              className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors text-center"
                            >
                              Ver Detalles
                            </Link>
                            <Link
                              href="/turnos"
                              className="px-4 py-2.5 bg-[#FEE004] text-black rounded-lg text-sm font-semibold hover:bg-[#FEE004]/90 transition-colors"
                            >
                              Cotizar
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-black/50 text-white border-[#FEE004] hover:bg-black/70" />
              <CarouselNext className="right-2 bg-black/50 text-white border-[#FEE004] hover:bg-black/70" />
            </Carousel>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Ver Catálogo Completo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Servicios Premium
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              Tecnología de última generación y profesionales certificados
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-[350px] rounded-2xl overflow-hidden mb-6">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  <div className="absolute top-6 left-6">
                    <div className="w-12 h-12 bg-[#FEE004] rounded-xl flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-black" />
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {service.description}
                    </p>
                  </div>
                </div>

                <Link
                  href="/turnos"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Reservar Turno
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#FEE004]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { number: '33,639', label: 'Neumáticos instalados', suffix: '+' },
              { number: '10,440', label: 'Services realizados', suffix: '+' },
              { number: '4.9', label: 'Calificación promedio', suffix: '★' },
              { number: '98', label: 'Clientes satisfechos', suffix: '%' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-4xl lg:text-5xl font-bold text-black mb-2">
                  {stat.number}
                  <span className="ml-1">{stat.suffix}</span>
                </div>
                <div className="text-gray-900 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section id="sucursales" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Nuestras Sucursales
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600"
            >
              6 sucursales estratégicamente ubicadas en el NOA
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Catamarca',
                address: 'Av. Virgen del Valle 1234',
                image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop'
              },
              {
                name: 'La Banda',
                address: 'Ruta Nacional 34 Km 752',
                image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop'
              },
              {
                name: 'San Fernando del Valle',
                address: 'Av. Belgrano 567',
                image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop'
              },
              {
                name: 'Salta',
                address: 'Av. Bolivia 2345',
                image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop&flip=h'
              },
              {
                name: 'Santiago del Estero',
                address: 'Av. Libertad 890',
                image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop&flip=h'
              },
              {
                name: 'Tucumán',
                address: 'Av. Mate de Luna 1567',
                image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop&flip=h'
              }
            ].map((branch, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative h-[300px] overflow-hidden rounded-2xl bg-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500">
                  <Image
                    src={branch.image}
                    alt={branch.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-[#FEE004] flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{branch.name}</h3>
                        <p className="text-white/90 text-sm">{branch.address}</p>
                      </div>
                    </div>

                    <Link
                      href="/turnos"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FEE004] text-black rounded-lg text-sm font-semibold hover:bg-[#FEE004]/90 transition-colors"
                    >
                      Reservar Turno
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=600&fit=crop')`
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              ¿Listo para garantizar tu seguridad?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Reserva tu turno online y evita esperas. Nuestro equipo te atenderá en minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/turnos"
                className="group px-8 py-4 bg-[#FEE004] text-black rounded-lg font-semibold text-lg hover:bg-[#FEE004]/90 transition-all hover:shadow-xl hover:shadow-[#FEE004]/30 inline-flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Agendar Turno
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://wa.me/5492995044430"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-green-500 text-white rounded-lg font-semibold text-lg hover:bg-green-600 transition-all inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-4">Neumáticos del Valle</h3>
              <p className="text-gray-400 text-sm mb-4">
                Distribuidor Oficial Pirelli
              </p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-[#FEE004] fill-[#FEE004]" />
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/productos" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link href="/turnos" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Turnos
                  </Link>
                </li>
                <li>
                  <Link href="/servicios" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Servicios
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Alineación y Balanceo</li>
                <li>Service Express</li>
                <li>Diagnóstico Digital</li>
                <li>Rotación de Neumáticos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <div className="space-y-3">
                <a
                  href="tel:+5492995044430"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  (299) 504-4430
                </a>
                <a
                  href="https://wa.me/5492995044430"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Neumáticos del Valle. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/admin" className="hover:text-white transition-colors">
                Admin
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
