'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, MessageCircle, ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
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
              href="https://wa.me/5493855854741"
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
  )
}
