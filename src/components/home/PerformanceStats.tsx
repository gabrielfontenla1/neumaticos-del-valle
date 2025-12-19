'use client'

import { motion } from 'framer-motion'
import { performanceStats } from './data'

export function PerformanceStats() {
  return (
    <section className="py-20 bg-[#FEE004]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {performanceStats.map((stat, index) => (
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
  )
}
