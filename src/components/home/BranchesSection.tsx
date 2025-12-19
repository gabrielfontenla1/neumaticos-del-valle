'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { branches } from './data'

export function BranchesSection() {
  return (
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
              {branches.map((branch, index) => (
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
          {branches.map((branch, index) => (
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
  )
}
