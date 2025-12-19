'use client'

import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { heroStats } from './data'

export function StatsBar() {
  return (
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
          {heroStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FEE004]/10 rounded-2xl mb-4 group-hover:bg-[#FEE004] transition-colors duration-300 shadow-lg">
                {stat.icon && <stat.icon className="w-8 h-8 text-black" />}
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
  )
}
