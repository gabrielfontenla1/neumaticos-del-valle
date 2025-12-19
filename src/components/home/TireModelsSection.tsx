'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { tireModels } from './data'

export function TireModelsSection() {
  return (
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
  )
}
