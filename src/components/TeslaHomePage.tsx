'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Calendar,
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
  Info,
  Pause,
  Droplet,
  Play
} from 'lucide-react'
import { Navbar } from './Navbar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import {
  TestimonialsSection,
  GuaranteesSection,
  ProcessSection,
  FAQSection
} from './ImprovedHomeSections'
import { useRef, useState, useEffect } from 'react'

export function TeslaHomePage() {
  const autoplayPlugin = useRef(Autoplay({ delay: 7000 }))
  const [isPlaying, setIsPlaying] = useState(true)
  const [carouselApi, setCarouselApi] = useState<any>(null)

  const toggleAutoplay = () => {
    const plugin = autoplayPlugin.current
    if (isPlaying) {
      plugin.stop()
    } else {
      plugin.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!carouselApi) return

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        carouselApi.scrollPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        carouselApi.scrollNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [carouselApi])

  const tireModels = [
    {
      id: 1,
      name: 'Scorpion Verde',
      category: 'SUV & Camionetas',
      image: '/Scorpion-Verde-1505470074533 (1).webp',
      description: 'Máximo rendimiento para SUVs de alta gama',
      price: 'Consultar',
      features: ['Todo terreno', 'Bajo ruido', 'Eco-friendly']
    },
    {
      id: 2,
      name: 'P Zero',
      category: 'Alta Performance',
      image: '/Pzero-Nuovo-1505470072726.webp',
      description: 'El neumático elegido por los mejores autos deportivos',
      price: 'Consultar',
      features: ['Ultra High Performance', 'Máxima adherencia', 'Control preciso']
    },
    {
      id: 3,
      name: 'Cinturato P7',
      category: 'Autos Premium',
      image: '/Cinturato-P1-Verde-1505470090255.webp',
      description: 'Confort, seguridad y eficiencia para tu auto',
      price: 'Consultar',
      features: ['Bajo consumo', 'Gran durabilidad', 'Confort acústico']
    },
    {
      id: 4,
      name: 'Scorpion HT',
      category: 'Pick-ups & Camionetas',
      image: '/Scorpion-HT-4505525112686.webp',
      description: 'Perfectos para camionetas y uso mixto on/off road',
      price: 'Consultar',
      features: ['Durabilidad extrema', 'Tracción superior', 'Bajo desgaste']
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

      {/* Hero Section - Carousel */}
      <section className="relative bg-white overflow-hidden">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[autoplayPlugin.current]}
          className="w-full"
          setApi={setCarouselApi}
        >
          <CarouselContent>
            {/* Slide 1 - Ofertas */}
            <CarouselItem key="ofertas">
              <div className="relative bg-white h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden">
                <div className="relative lg:static lg:container lg:mx-auto lg:px-4 h-full">
                  <div className="relative lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-center h-full py-8 lg:py-0">
                    {/* Left Column - Sales Copy - Above background on mobile */}
                    <div className="text-center lg:text-left space-y-4 sm:space-y-6 lg:space-y-8 max-w-xl mx-auto lg:mx-0 flex flex-col justify-center h-full lg:h-auto order-2 lg:order-1 relative z-30 px-4 lg:px-0">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white lg:text-black leading-[1.1] font-helvetica">
                        Seguridad y Performance
                        <br />
                        <span className="inline-block bg-white lg:bg-black text-black lg:text-white px-2 sm:px-4 py-1 mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-7xl">Instalados Hoy</span>
                      </h1>

                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 lg:text-[#333333] max-w-lg leading-relaxed font-montserrat font-normal">
                        Encontrá el neumático Pirelli exacto para tu vehículo. Te asesoramos en el acto y lo instalamos con precisión milimétrica.
                      </p>

                      {/* CTAs */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                        <Link
                          href="/productos"
                          className="group px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-[#FEE004] text-black rounded-xl font-medium hover:bg-[#FDD000] transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 font-montserrat inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <span>Ver Catálogo Pirelli</span>
                          <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                          href="/turnos"
                          className="group px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-white border-2 border-black text-black rounded-xl font-medium hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-montserrat inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <Calendar className="w-5 h-5" />
                          <span>Pedir Asesoramiento</span>
                        </Link>
                      </div>
                    </div>

                    {/* Right Column - Infinite Scroll Image Grid - Full width and height background on mobile */}
                    <div className="absolute lg:relative inset-0 lg:inset-auto overflow-hidden h-full order-1 lg:order-2 flex">
                      {/* Dark overlay for mobile - Full width */}
                      <div className="absolute left-0 right-0 top-0 bottom-0 bg-black/50 lg:hidden z-20 pointer-events-none" />

                      {/* Top fade gradient - Black on mobile, white on desktop */}
                      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black lg:from-white to-transparent z-10 pointer-events-none" />

                      {/* Bottom fade gradient - Black on mobile, white on desktop */}
                      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black lg:from-white to-transparent z-10 pointer-events-none" />

                      <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-6 w-full h-full">
                        {/* First Column - Scrolls UP infinitely */}
                        <div className="relative overflow-hidden">
                          <motion.div
                            className="flex flex-col gap-2 lg:gap-4"
                            animate={{
                              y: [0, "-50%"]
                            }}
                            transition={{
                              duration: 60,
                              repeat: Infinity,
                              ease: "linear",
                              repeatType: "loop"
                            }}
                          >
                            {[
                              '/Scorpion-Verde-1505470074533 (1).webp',
                              '/Scorpion-HT-4505525112686.webp',
                              '/Scorpion-4505525112390.webp',
                              '/Scorpion-All-Terrain-Plus-4505483375619.webp',
                              '/Scorpion-Atr-1505470067539.webp',
                              '/Scorpion-MTR-1505470071047.webp',
                              '/Scorpion-Zero-1505470088294.webp',
                              '/Scorpion-Zero-All-Season-1505470086399.webp',
                              '/Scorpion-Verde-1505470074533 (1).webp',
                              '/Scorpion-HT-4505525112686.webp',
                              '/Scorpion-4505525112390.webp',
                              '/Scorpion-All-Terrain-Plus-4505483375619.webp',
                              '/Scorpion-Atr-1505470067539.webp',
                              '/Scorpion-MTR-1505470071047.webp',
                              '/Scorpion-Zero-1505470088294.webp',
                              '/Scorpion-Zero-All-Season-1505470086399.webp'
                            ].map((src, idx) => (
                              <div key={`col1-${idx}`} className="relative aspect-square lg:aspect-auto lg:h-80 rounded-xl lg:rounded-2xl overflow-hidden lg:bg-gray-100 flex-shrink-0 p-2 lg:p-4">
                                <Image
                                  src={src}
                                  alt="Neumático Pirelli"
                                  width={280}
                                  height={280}
                                  sizes="(max-width: 1024px) 45vw, 25vw"
                                  quality={75}
                                  priority={idx < 3}
                                  className="object-contain"
                                />
                              </div>
                            ))}
                          </motion.div>
                        </div>

                        {/* Second Column - Scrolls DOWN infinitely */}
                        <div className="relative overflow-hidden">
                          <motion.div
                            className="flex flex-col gap-2 lg:gap-4"
                            animate={{
                              y: ["-50%", 0]
                            }}
                            transition={{
                              duration: 65,
                              repeat: Infinity,
                              ease: "linear",
                              repeatType: "loop"
                            }}
                          >
                            {[
                              '/Cinturato-P1-Verde-1505470090255.webp',
                              '/Cinturato-P7-1505470083092.webp',
                              '/cinturato-p7-4505517104514.webp',
                              '/Pzero-Nuovo-1505470072726.webp',
                              '/Pzero-Corsa-PZC4-1505470090635.webp',
                              '/Pzero-Corsa-System-Direzionale-1505470088408.webp',
                              '/Pzero-vecchio-1505470066413.webp',
                              '/Chrono-1505470062195.webp',
                              // Duplicate for seamless loop
                              '/Cinturato-P1-Verde-1505470090255.webp',
                              '/Cinturato-P7-1505470083092.webp',
                              '/cinturato-p7-4505517104514.webp',
                              '/Pzero-Nuovo-1505470072726.webp',
                              '/Pzero-Corsa-PZC4-1505470090635.webp',
                              '/Pzero-Corsa-System-Direzionale-1505470088408.webp',
                              '/Pzero-vecchio-1505470066413.webp',
                              '/Chrono-1505470062195.webp'
                            ].map((src, idx) => (
                              <div key={`col2-${idx}`} className="relative aspect-square lg:aspect-auto lg:h-80 rounded-xl lg:rounded-2xl overflow-hidden lg:bg-gray-100 flex-shrink-0 p-2 lg:p-4">
                                <Image
                                  src={src}
                                  alt="Neumático Pirelli"
                                  width={280}
                                  height={280}
                                  sizes="(max-width: 1024px) 45vw, 25vw"
                                  quality={75}
                                  priority={idx < 3}
                                  className="object-contain"
                                />
                              </div>
                            ))}
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </CarouselItem>

            {/* Slide 2 - Cambio de Aceite y Filtros */}
            <CarouselItem key="aceite">
              <div className="relative bg-[#F7F7F7] h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden">
                <div className="relative lg:container lg:mx-auto lg:px-4 h-full">

                  {/* Mobile Background Container - Full Width on Mobile */}
                  <div className="absolute lg:relative inset-0 lg:inset-auto h-full">
                    {/* Dark overlay for mobile */}
                    <div className="absolute left-0 right-0 top-0 bottom-0 bg-black/50 lg:hidden z-20 pointer-events-none" />

                    {/* Top gradient fade - BLACK - Mobile Only */}
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none lg:hidden" />

                    {/* Bottom gradient fade - BLACK - Mobile Only */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none lg:hidden" />

                    {/* 2-Column Grid for Mobile Oil Products */}
                    <div className="grid grid-cols-2 lg:hidden gap-2 h-full p-4">
                      {/* Column 1 - Scrolls UP on Mobile */}
                      <div className="relative overflow-hidden h-full">
                        <motion.div
                          className="flex flex-col gap-2"
                          animate={{ y: [0, "-50%"] }}
                          transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear",
                            repeatType: "loop"
                          }}
                        >
                          {[
                            '/helix-hx2-10w-30.jpeg',
                            '/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg',
                            '/4l-helix-hx3-15w-40-high.jpeg',
                            '/4l-helix-hx5-10w-30.jpeg',
                            '/helix-hx2-10w-30.jpeg',
                            '/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg',
                            '/4l-helix-hx3-15w-40-high.jpeg',
                            '/4l-helix-hx5-10w-30.jpeg'
                          ].map((src, idx) => (
                            <div key={`mobile-oil-col1-${idx}`} className="relative aspect-square rounded-xl overflow-hidden flex-shrink-0 p-2">
                              <Image
                                src={src}
                                alt="Shell Helix Oil"
                                width={200}
                                height={200}
                                sizes="45vw"
                                quality={75}
                                priority={idx < 2}
                                className="object-contain"
                              />
                            </div>
                          ))}
                        </motion.div>
                      </div>

                      {/* Column 2 - Scrolls DOWN on Mobile */}
                      <div className="relative overflow-hidden h-full">
                        <motion.div
                          className="flex flex-col gap-2"
                          animate={{ y: ["-50%", 0] }}
                          transition={{
                            duration: 35,
                            repeat: Infinity,
                            ease: "linear",
                            repeatType: "loop"
                          }}
                        >
                          {[
                            '/4l-helix-hx5-10w-30.jpeg',
                            '/4l-helix-hx3-15w-40-high.jpeg',
                            '/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg',
                            '/helix-hx2-10w-30.jpeg',
                            '/4l-helix-hx5-10w-30.jpeg',
                            '/4l-helix-hx3-15w-40-high.jpeg',
                            '/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg',
                            '/helix-hx2-10w-30.jpeg'
                          ].map((src, idx) => (
                            <div key={`mobile-oil-col2-${idx}`} className="relative aspect-square rounded-xl overflow-hidden flex-shrink-0 p-2">
                              <Image
                                src={src}
                                alt="Shell Helix Oil"
                                width={200}
                                height={200}
                                sizes="45vw"
                                quality={75}
                                priority={idx < 2}
                                className="object-contain"
                              />
                            </div>
                          ))}
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Center Content - Text and CTAs - Above Mobile Background */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 text-center space-y-3 sm:space-y-4 lg:space-y-6 w-full max-w-4xl px-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white lg:text-black leading-[1.1] font-helvetica">
                      Protegé tu Motor
                      <br />
                      <span className="inline-block bg-black lg:bg-black text-white px-2 sm:px-4 py-1 mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-7xl">Sin Perder Tiempo</span>
                    </h2>

                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white lg:text-[#333333] leading-relaxed max-w-2xl mx-auto font-montserrat font-normal">
                      Maximizá la vida útil de tu auto con la línea premium Shell Helix. Servicio profesional en minutos.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link
                        href="/turnos"
                        className="group px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-[#FEE004] text-black rounded-xl font-medium hover:bg-[#FDD000] transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 font-montserrat inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
                        <span>Reservar Turno Ahora</span>
                        <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        href="/aceites"
                        className="group px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-white border-2 border-white lg:border-black text-black rounded-xl font-medium hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-montserrat inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Droplet className="w-5 h-5" />
                        <span>Ver Aceites y Filtros</span>
                      </Link>
                    </div>
                  </div>

                  {/* Top Carousel - Desktop Only */}
                  <div className="hidden lg:block absolute top-[10%] sm:top-[12%] md:top-[12%] lg:top-[10%] left-0 right-0 h-24 sm:h-32 md:h-40 lg:h-48 w-full max-w-7xl mx-auto px-2 sm:px-4 z-10">
                    {/* Left fade gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-[#F7F7F7] to-transparent z-10 pointer-events-none" />

                    {/* Right fade gradient */}
                    <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-[#F7F7F7] to-transparent z-10 pointer-events-none" />

                    {/* Top Row - Scrolls RIGHT infinitely */}
                    <div className="relative overflow-hidden h-24 sm:h-32 md:h-40 lg:h-48">
                      <motion.div
                        className="flex gap-4"
                        initial={{ x: 0 }}
                        animate={{ x: "-50%" }}
                        transition={{
                          duration: 35,
                          repeat: Infinity,
                          ease: "linear",
                          repeatType: "loop"
                        }}
                      >
                        {/* Original set */}
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/helix-hx2-10w-30.jpeg"
                            alt="Shell Helix HX2 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg"
                            alt="Shell Helix Ultra Pro AML 5W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx3-15w-40-high.jpeg"
                            alt="Shell Helix HX3 15W-40"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx5-10w-30.jpeg"
                            alt="Shell Helix HX5 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>

                        {/* Duplicate set for seamless loop */}
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/helix-hx2-10w-30.jpeg"
                            alt="Shell Helix HX2 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg"
                            alt="Shell Helix Ultra Pro AML 5W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx3-15w-40-high.jpeg"
                            alt="Shell Helix HX3 15W-40"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx5-10w-30.jpeg"
                            alt="Shell Helix HX5 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Bottom Carousel - Desktop Only */}
                  <div className="hidden lg:block absolute bottom-[10%] sm:bottom-[12%] md:bottom-[12%] lg:bottom-[10%] left-0 right-0 h-24 sm:h-32 md:h-40 lg:h-48 w-full max-w-7xl mx-auto px-2 sm:px-4 z-10">
                    {/* Left fade gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-[#F7F7F7] to-transparent z-10 pointer-events-none" />

                    {/* Right fade gradient */}
                    <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-[#F7F7F7] to-transparent z-10 pointer-events-none" />

                    {/* Bottom Row - Scrolls LEFT infinitely */}
                    <div className="relative overflow-hidden h-24 sm:h-32 md:h-40 lg:h-48">
                      <motion.div
                        className="flex gap-4"
                        initial={{ x: "-50%" }}
                        animate={{ x: 0 }}
                        transition={{
                          duration: 45,
                          repeat: Infinity,
                          ease: "linear",
                          repeatType: "loop"
                        }}
                      >
                        {/* Original set */}
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx5-10w-30.jpeg"
                            alt="Shell Helix HX5 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg"
                            alt="Shell Helix Ultra Pro AML 5W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/helix-hx2-10w-30.jpeg"
                            alt="Shell Helix HX2 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx3-15w-40-high.jpeg"
                            alt="Shell Helix HX3 15W-40"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>

                        {/* Duplicate set for seamless loop */}
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx5-10w-30.jpeg"
                            alt="Shell Helix HX5 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg"
                            alt="Shell Helix Ultra Pro AML 5W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/helix-hx2-10w-30.jpeg"
                            alt="Shell Helix HX2 10W-30"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                        <div className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
                          <Image
                            src="/4l-helix-hx3-15w-40-high.jpeg"
                            alt="Shell Helix HX3 15W-40"
                            width={192}
                            height={192}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                            quality={75}
                            loading="lazy"
                            className="object-contain"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>

            {/* Slide 3 - Sucursales */}
            <CarouselItem key="sucursales">
              <div className="relative bg-[#F9F9F9] h-[calc(100vh-4rem)] min-h-[600px]">
                {/* Clean Background - No Distracting Images */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2">
                  {/* Column 1 - Scrolls UP - Mobile: Show */}
                  <div className="relative overflow-hidden flex-1 h-full">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: [0, "-50%"] }}
                      transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l1.jpg', '/l9.jpg', '/l17.jpg', '/l5.jpg', '/l13.jpg', '/l21.jpg',
                        '/l1.jpg', '/l9.jpg', '/l17.jpg', '/l5.jpg', '/l13.jpg', '/l21.jpg'
                      ].map((img, idx) => (
                        <div key={`col1-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Column 2 - Scrolls DOWN - Mobile: Show */}
                  <div className="relative overflow-hidden flex-1 h-full">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: ["-50%", 0] }}
                      transition={{
                        duration: 65,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l2.jpg', '/l10.jpg', '/l18.jpg', '/l6.jpg', '/l14.jpg', '/l1.jpg',
                        '/l2.jpg', '/l10.jpg', '/l18.jpg', '/l6.jpg', '/l14.jpg', '/l1.jpg'
                      ].map((img, idx) => (
                        <div key={`col2-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Column 3 - Scrolls UP - Mobile: Hide */}
                  <div className="relative overflow-hidden flex-1 h-full hidden sm:block">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: [0, "-50%"] }}
                      transition={{
                        duration: 55,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l3.jpg', '/l11.jpg', '/l19.jpg', '/l7.jpg', '/l15.jpg', '/l2.jpg',
                        '/l3.jpg', '/l11.jpg', '/l19.jpg', '/l7.jpg', '/l15.jpg', '/l2.jpg'
                      ].map((img, idx) => (
                        <div key={`col3-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Column 4 - Scrolls DOWN - Center - Mobile: Hide */}
                  <div className="relative overflow-hidden flex-1 h-full hidden sm:block">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: ["-50%", 0] }}
                      transition={{
                        duration: 70,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l4.jpg', '/l12.jpg', '/l20.jpg', '/l8.jpg', '/l16.jpg', '/l3.jpg',
                        '/l4.jpg', '/l12.jpg', '/l20.jpg', '/l8.jpg', '/l16.jpg', '/l3.jpg'
                      ].map((img, idx) => (
                        <div key={`col4-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Column 5 - Scrolls UP - Center - Mobile: Hide */}
                  <div className="relative overflow-hidden flex-1 h-full hidden md:block">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: [0, "-50%"] }}
                      transition={{
                        duration: 62,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l5.jpg', '/l13.jpg', '/l21.jpg', '/l9.jpg', '/l17.jpg', '/l4.jpg',
                        '/l5.jpg', '/l13.jpg', '/l21.jpg', '/l9.jpg', '/l17.jpg', '/l4.jpg'
                      ].map((img, idx) => (
                        <div key={`col5-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Column 6 - Scrolls DOWN - Mobile: Hide */}
                  <div className="relative overflow-hidden flex-1 h-full hidden md:block">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: ["-50%", 0] }}
                      transition={{
                        duration: 58,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l6.jpg', '/l14.jpg', '/l1.jpg', '/l10.jpg', '/l18.jpg', '/l5.jpg',
                        '/l6.jpg', '/l14.jpg', '/l1.jpg', '/l10.jpg', '/l18.jpg', '/l5.jpg'
                      ].map((img, idx) => (
                        <div key={`col6-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Column 7 - Scrolls UP - Mobile: Hide */}
                  <div className="relative overflow-hidden flex-1 h-full hidden lg:block">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: [0, "-50%"] }}
                      transition={{
                        duration: 66,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l7.jpg', '/l15.jpg', '/l2.jpg', '/l11.jpg', '/l19.jpg', '/l6.jpg',
                        '/l7.jpg', '/l15.jpg', '/l2.jpg', '/l11.jpg', '/l19.jpg', '/l6.jpg'
                      ].map((img, idx) => (
                        <div key={`col7-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Column 8 - Scrolls DOWN - Mobile: Hide */}
                  <div className="relative overflow-hidden flex-1 h-full hidden lg:block">
                    <motion.div
                      className="flex flex-col gap-2"
                      animate={{ y: ["-50%", 0] }}
                      transition={{
                        duration: 63,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      {[
                        '/l8.jpg', '/l16.jpg', '/l3.jpg', '/l12.jpg', '/l20.jpg', '/l7.jpg',
                        '/l8.jpg', '/l16.jpg', '/l3.jpg', '/l12.jpg', '/l20.jpg', '/l7.jpg'
                      ].map((img, idx) => (
                        <div key={`col8-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                          <Image
                            src={img}
                            alt={`Local Neumáticos del Valle`}
                            fill
                            sizes="12.5vw"
                            quality={70}
                            className="object-cover"
                            priority={idx < 4}
                          />
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>

                {/* Top gradient fade - BLACK */}
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />

                {/* Bottom gradient fade - BLACK */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

                {/* Dark overlay with transparency */}
                <div className="absolute inset-0 bg-black/70 z-20 pointer-events-none" />

                {/* Centered Content */}
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6 max-w-4xl mx-auto px-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] font-helvetica">
                      Servicio Experto
                      <br />
                      <span className="inline-block bg-black text-white px-2 sm:px-4 py-1 mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-7xl">A la Vuelta de tu Casa</span>
                    </h2>

                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white leading-relaxed max-w-2xl mx-auto font-montserrat font-normal">
                      Con 6 sucursales estratégicas en el NOA, siempre tenés un centro de servicio profesional a tu alcance.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2 sm:pt-4">
                      <Link
                        href="/sucursales"
                        className="group px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-[#FEE004] text-black rounded-xl font-medium hover:bg-[#FDD000] transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl font-montserrat inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <MapPin className="w-4 sm:w-5 h-4 sm:h-5" />
                        <span>Ver Mapa de Sucursales</span>
                        <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <Link
                        href="/turnos"
                        className="group px-6 sm:px-8 lg:px-10 py-4 sm:py-5 bg-white border-2 border-black text-black rounded-xl font-medium hover:bg-black hover:text-white transition-all duration-300 hover:scale-105 font-montserrat inline-flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Calendar className="w-4 sm:w-5 h-4 sm:h-5" />
                        <span>Reservar Turno</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>

          {/* Navigation Arrows */}
          <CarouselPrevious className="left-2 sm:left-4 bg-[#FEE004] border-[#FEE004] text-black hover:bg-[#FEE004]/90 scale-75 sm:scale-100" />
          <CarouselNext className="right-2 sm:right-4 bg-[#FEE004] border-[#FEE004] text-black hover:bg-[#FEE004]/90 scale-75 sm:scale-100" />
        </Carousel>

        {/* Play/Pause Button - Inside Hero Section */}
        <button
          onClick={toggleAutoplay}
          className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-10 sm:h-12 bg-[#FEE004] border-2 border-[#FEE004] text-black rounded-full hover:bg-[#FEE004]/90 transition-all flex items-center justify-center shadow-lg z-20"
          aria-label={isPlaying ? "Pausar carrusel" : "Reproducir carrusel"}
        >
          {isPlaying ? (
            <Pause className="w-4 sm:w-5 h-4 sm:h-5" />
          ) : (
            <Play className="w-4 sm:w-5 h-4 sm:h-5 ml-0.5" />
          )}
        </button>
      </section>

      {/* Stats Bar */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEE004]/10 backdrop-blur-sm rounded-full mb-6 border border-[#FEE004]/20"
            >
              <Award className="w-5 h-5 text-[#FEE004]" />
              <span className="text-sm font-semibold text-gray-900">
                Distribuidor Oficial Pirelli desde 1984
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Números que hablan
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Más de cuatro décadas priorizando tu seguridad en cada kilómetro
            </motion.p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { number: '40+', label: 'Años de trayectoria', icon: Award },
              { number: '100%', label: 'Productos originales', icon: Shield },
              { number: '100K+', label: 'Clientes satisfechos', icon: Users },
              { number: '6', label: 'Sucursales en NOA', icon: MapPin }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FEE004]/10 rounded-2xl mb-4 group-hover:bg-[#FEE004] transition-colors duration-300 shadow-lg">
                  <stat.icon className="w-8 h-8 text-black" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold text-black mb-2 group-hover:text-[#FEE004] transition-colors">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - NEW: Social Proof */}
      <TestimonialsSection />

      {/* Tire Models Section with Automatic Carousel */}
      <section id="modelos" className="py-20 bg-white overflow-hidden">
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

          {/* Automatic Carousel */}
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {tireModels.map((model) => (
                <CarouselItem key={model.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="h-full px-2"
                  >
                    <div className="group h-full select-none">
                      <div className="relative h-[480px] overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 mx-auto max-w-[400px] pointer-events-none">
                        {/* Image */}
                        <div className="relative h-[300px] bg-gradient-to-b from-gray-50 to-white p-4">
                          <Image
                            src={model.image}
                            alt={model.name}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>

                        {/* Content - Fixed Heights */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/95 to-black/80 p-6">
                          {/* Category - Fixed Height */}
                          <p className="text-xs font-semibold text-[#FEE004] mb-2 uppercase tracking-wide h-4">
                            {model.category}
                          </p>

                          {/* Title - Fixed Height */}
                          <h3 className="text-2xl font-bold text-white mb-2 h-8 line-clamp-1">
                            {model.name}
                          </h3>

                          {/* Description - Fixed Height */}
                          <p className="text-white/80 text-sm mb-4 h-10 line-clamp-2">
                            {model.description}
                          </p>

                          {/* Features - Fixed Height */}
                          <div className="flex flex-wrap gap-2 h-16">
                            {model.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-[#FEE004] hover:bg-[#FEE004]/90 border-[#FEE004] text-black" />
            <CarouselNext className="hidden md:flex -right-12 bg-[#FEE004] hover:bg-[#FEE004]/90 border-[#FEE004] text-black" />
          </Carousel>

          {/* CTA Button */}
          <div className="text-center mt-8">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Ver Catálogo Completo
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Process Section - NEW: Transparent Process */}
      <ProcessSection />

      {/* Guarantees Section - NEW: Trust Building */}
      <GuaranteesSection />

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

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <Carousel
              opts={{
                align: 'start',
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: true,
                  stopOnMouseEnter: true,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent>
                {[
                  {
                    name: 'Catamarca Centro',
                    address: 'Av. Belgrano 938, Catamarca',
                    phone: '(0383) 443-0000',
                    image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop'
                  },
                  {
                    name: 'La Banda',
                    address: 'República del Líbano Sur 866, Santiago del Estero',
                    phone: '(0385) 427-0000',
                    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop'
                  },
                  {
                    name: 'San Fernando del Valle',
                    address: 'Alem 1118, Catamarca',
                    phone: '(0383) 443-1111',
                    image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop'
                  },
                  {
                    name: 'Salta',
                    address: 'Jujuy 330, Salta',
                    phone: '(0387) 431-0000',
                    image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop&flip=h'
                  },
                  {
                    name: 'Santiago del Estero',
                    address: 'Av. Belgrano Sur 2834, Santiago del Estero',
                    phone: '(0385) 422-0000',
                    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop&flip=h'
                  },
                  {
                    name: 'Tucumán',
                    address: 'Av. Gobernador del Campo 436, San Miguel de Tucumán',
                    phone: '(0381) 424-0000',
                    image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop&flip=h'
                  }
                ].map((branch, index) => (
                  <CarouselItem key={index}>
                    <div className="px-2">
                      <div className="relative h-[300px] overflow-hidden rounded-2xl shadow-2xl border-2 border-[#FEE004]/20 select-none">
                        <Image
                          src={branch.image}
                          alt={branch.name}
                          fill
                          className="object-cover pointer-events-none"
                        />

                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-5 h-5 text-[#FEE004] flex-shrink-0 mt-1" />
                            <div>
                              <h3 className="text-2xl font-bold mb-1">{branch.name}</h3>
                              <p className="text-white/90 text-sm">{branch.address}</p>
                            </div>
                          </div>
                        </div>

                        {/* Glow effect around border */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FEE004]/20 via-transparent to-[#FEE004]/20 rounded-2xl -z-10 blur-xl" />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-[#FEE004] border-[#FEE004] text-black hover:bg-[#FEE004]/90" />
              <CarouselNext className="right-2 bg-[#FEE004] border-[#FEE004] text-black hover:bg-[#FEE004]/90" />
            </Carousel>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Catamarca Centro',
                address: 'Av. Belgrano 938, Catamarca',
                phone: '(0383) 443-0000',
                image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop'
              },
              {
                name: 'La Banda',
                address: 'República del Líbano Sur 866, Santiago del Estero',
                phone: '(0385) 427-0000',
                image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop'
              },
              {
                name: 'San Fernando del Valle',
                address: 'Alem 1118, Catamarca',
                phone: '(0383) 443-1111',
                image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop'
              },
              {
                name: 'Salta',
                address: 'Jujuy 330, Salta',
                phone: '(0387) 431-0000',
                image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop&flip=h'
              },
              {
                name: 'Santiago del Estero',
                address: 'Av. Belgrano Sur 2834, Santiago del Estero',
                phone: '(0385) 422-0000',
                image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop&flip=h'
              },
              {
                name: 'Tucumán',
                address: 'Av. Gobernador del Campo 436, San Miguel de Tucumán',
                phone: '(0381) 424-0000',
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
                <div className="relative h-[300px] overflow-hidden rounded-2xl shadow-2xl border-2 border-[#FEE004]/20 hover:border-[#FEE004]/40 transition-all duration-500">
                  <Image
                    src={branch.image}
                    alt={branch.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />

                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-[#FEE004] flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{branch.name}</h3>
                        <p className="text-white/90 text-sm">{branch.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Glow effect around border */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FEE004]/20 via-transparent to-[#FEE004]/20 rounded-2xl -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - NEW: Answer Objections */}
      <FAQSection />

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
                href="https://wa.me/5493855946462"
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
      <footer className="bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Main Content */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-base md:text-lg font-bold text-white mb-2">
                Neumáticos del Valle
              </h3>
              <p className="text-xs md:text-sm text-gray-400 mb-2">
                Distribuidor Oficial Pirelli
              </p>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#FEE004] fill-[#FEE004]" />
                ))}
              </div>
            </div>

            {/* Links - Compacto en móvil */}
            <div>
              <h4 className="text-xs md:text-sm font-semibold text-white mb-3 md:mb-4">Enlaces</h4>
              <ul className="space-y-2 md:space-y-2.5">
                {[
                  { name: 'Productos', href: '/productos' },
                  { name: 'Servicios', href: '/servicios' },
                  { name: 'Turnos', href: '/turnos' },
                  { name: 'Equivalencias', href: '/equivalencias' },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-xs md:text-sm text-gray-400 hover:text-[#FEE004] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact - Compacto en móvil */}
            <div>
              <h4 className="text-xs md:text-sm font-semibold text-white mb-3 md:mb-4">Contacto</h4>
              <div className="space-y-2 md:space-y-2.5">
                <a
                  href="tel:+5493855946462"
                  className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                  <span className="truncate">(299) 504-4430</span>
                </a>
                <a
                  href="https://wa.me/5493855946462"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 hover:text-green-400 transition-colors"
                >
                  <MessageCircle className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="#sucursales"
                  className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                  <span>6 Sucursales</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom - Más compacto en móvil */}
          <div className="pt-4 md:pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              © 2024 Neumáticos del Valle
            </p>
            <div className="flex gap-4 md:gap-6 text-xs">
              <Link href="/admin" className="text-gray-500 hover:text-[#FEE004] transition-colors">
                Admin
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
