'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ArrowRight, Pause, Droplet, Play } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import type { CarouselApi } from '@/components/ui/carousel'
import { useRef, useState, useEffect } from 'react'
import { tireImages, oilImages, locationImages } from './data'

export function HeroCarousel() {
  const autoplayPlugin = useRef(Autoplay({ delay: 7000 }))
  const [isPlaying, setIsPlaying] = useState(true)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

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

  return (
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
            <SlideOfertas />
          </CarouselItem>

          {/* Slide 2 - Cambio de Aceite y Filtros */}
          <CarouselItem key="aceite">
            <SlideAceite />
          </CarouselItem>

          {/* Slide 3 - Sucursales */}
          <CarouselItem key="sucursales">
            <SlideSucursales />
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
  )
}

function SlideOfertas() {
  // Duplicate arrays for seamless loop
  const column1Images = [...tireImages.column1, ...tireImages.column1]
  const column2Images = [...tireImages.column2, ...tireImages.column2]

  return (
    <div className="relative bg-white h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden">
      <div className="relative lg:static lg:container lg:mx-auto lg:px-4 h-full">
        <div className="relative lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-center h-full py-8 lg:py-0">
          {/* Left Column - Sales Copy */}
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

          {/* Right Column - Infinite Scroll Image Grid */}
          <div className="absolute lg:relative inset-0 lg:inset-auto overflow-hidden h-full order-1 lg:order-2 flex">
            {/* Dark overlay for mobile */}
            <div className="absolute left-0 right-0 top-0 bottom-0 bg-black/50 lg:hidden z-20 pointer-events-none" />

            {/* Top fade gradient */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black lg:from-white to-transparent z-10 pointer-events-none" />

            {/* Bottom fade gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black lg:from-white to-transparent z-10 pointer-events-none" />

            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-6 w-full h-full">
              {/* First Column - Scrolls UP infinitely */}
              <div className="relative overflow-hidden">
                <motion.div
                  className="flex flex-col gap-2 lg:gap-4"
                  animate={{ y: [0, "-50%"] }}
                  transition={{
                    duration: 60,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop"
                  }}
                >
                  {column1Images.map((src, idx) => (
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
                  animate={{ y: ["-50%", 0] }}
                  transition={{
                    duration: 65,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop"
                  }}
                >
                  {column2Images.map((src, idx) => (
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
  )
}

function SlideAceite() {
  // Duplicate arrays for seamless loop
  const mobileColumn1 = [...oilImages, ...oilImages]
  const mobileColumn2 = [...oilImages.slice().reverse(), ...oilImages.slice().reverse()]

  return (
    <div className="relative bg-[#F7F7F7] h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden">
      <div className="relative lg:container lg:mx-auto lg:px-4 h-full">
        {/* Mobile Background Container */}
        <div className="absolute lg:relative inset-0 lg:inset-auto h-full">
          {/* Dark overlay for mobile */}
          <div className="absolute left-0 right-0 top-0 bottom-0 bg-black/50 lg:hidden z-20 pointer-events-none" />

          {/* Top gradient fade - Mobile Only */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none lg:hidden" />

          {/* Bottom gradient fade - Mobile Only */}
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
                {mobileColumn1.map((src, idx) => (
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
                {mobileColumn2.map((src, idx) => (
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

        {/* Center Content - Text and CTAs */}
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
        <DesktopOilCarousel position="top" />

        {/* Bottom Carousel - Desktop Only */}
        <DesktopOilCarousel position="bottom" />
      </div>
    </div>
  )
}

function DesktopOilCarousel({ position }: { position: 'top' | 'bottom' }) {
  const isTop = position === 'top'

  return (
    <div className={`hidden lg:block absolute ${isTop ? 'top-[10%]' : 'bottom-[10%]'} left-0 right-0 h-24 sm:h-32 md:h-40 lg:h-48 w-full max-w-7xl mx-auto px-2 sm:px-4 z-10`}>
      {/* Left fade gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-[#F7F7F7] to-transparent z-10 pointer-events-none" />

      {/* Right fade gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-[#F7F7F7] to-transparent z-10 pointer-events-none" />

      <div className="relative overflow-hidden h-24 sm:h-32 md:h-40 lg:h-48">
        <motion.div
          className="flex gap-4"
          initial={{ x: isTop ? 0 : "-50%" }}
          animate={{ x: isTop ? "-50%" : 0 }}
          transition={{
            duration: isTop ? 35 : 45,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop"
          }}
        >
          {/* Original set + Duplicate for seamless loop */}
          {[...oilImages, ...oilImages].map((src, idx) => (
            <div key={`desktop-oil-${position}-${idx}`} className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-24 sm:w-32 md:w-40 lg:w-48 rounded-2xl overflow-hidden flex-shrink-0 p-2 sm:p-3 md:p-4">
              <Image
                src={src}
                alt="Shell Helix Oil"
                width={192}
                height={192}
                sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, (max-width: 1024px) 160px, 192px"
                quality={75}
                loading="lazy"
                className="object-contain"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function SlideSucursales() {
  // Define image sets for each column
  const columnSets = [
    ['/l1.jpg', '/l9.jpg', '/l17.jpg', '/l5.jpg', '/l13.jpg', '/l21.jpg'],
    ['/l2.jpg', '/l10.jpg', '/l18.jpg', '/l6.jpg', '/l14.jpg', '/l1.jpg'],
    ['/l3.jpg', '/l11.jpg', '/l19.jpg', '/l7.jpg', '/l15.jpg', '/l2.jpg'],
    ['/l4.jpg', '/l12.jpg', '/l20.jpg', '/l8.jpg', '/l16.jpg', '/l3.jpg'],
    ['/l5.jpg', '/l13.jpg', '/l21.jpg', '/l9.jpg', '/l17.jpg', '/l4.jpg'],
    ['/l6.jpg', '/l14.jpg', '/l1.jpg', '/l10.jpg', '/l18.jpg', '/l5.jpg'],
    ['/l7.jpg', '/l15.jpg', '/l2.jpg', '/l11.jpg', '/l19.jpg', '/l6.jpg'],
    ['/l8.jpg', '/l16.jpg', '/l3.jpg', '/l12.jpg', '/l20.jpg', '/l7.jpg'],
  ]

  const columnConfigs = [
    { direction: 'up', duration: 60, visible: 'block' },      // Column 1
    { direction: 'down', duration: 65, visible: 'block' },    // Column 2
    { direction: 'up', duration: 55, visible: 'hidden sm:block' },   // Column 3
    { direction: 'down', duration: 70, visible: 'hidden sm:block' }, // Column 4
    { direction: 'up', duration: 62, visible: 'hidden md:block' },   // Column 5
    { direction: 'down', duration: 58, visible: 'hidden md:block' }, // Column 6
    { direction: 'up', duration: 66, visible: 'hidden lg:block' },   // Column 7
    { direction: 'down', duration: 63, visible: 'hidden lg:block' }, // Column 8
  ]

  return (
    <div className="relative bg-[#F9F9F9] h-[calc(100vh-4rem)] min-h-[600px]">
      {/* Background Image Columns */}
      <div className="absolute inset-0 flex items-center justify-center gap-1 sm:gap-2">
        {columnConfigs.map((config, colIndex) => (
          <div key={`col-${colIndex}`} className={`relative overflow-hidden flex-1 h-full ${config.visible}`}>
            <motion.div
              className="flex flex-col gap-2"
              animate={{ y: config.direction === 'up' ? [0, "-50%"] : ["-50%", 0] }}
              transition={{
                duration: config.duration,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop"
              }}
            >
              {[...columnSets[colIndex], ...columnSets[colIndex]].map((img, idx) => (
                <div key={`col${colIndex + 1}-${idx}`} className="flex-shrink-0 w-full aspect-[9/16] bg-gray-100 relative rounded-xl overflow-hidden">
                  <Image
                    src={img}
                    alt="Local Neumáticos del Valle"
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
        ))}
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
  )
}
