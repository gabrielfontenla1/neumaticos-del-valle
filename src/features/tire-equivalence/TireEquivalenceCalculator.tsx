'use client'

import { useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Calculator,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Search,
  Package,
  Target,
  Cpu,
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { PixiBackground } from '@/components/PixiBackground'
import TireInput from './TireInput'
import EquivalentResults from './EquivalentResults'
import { TireSize, EquivalenceResult } from './types'
import { findEquivalentTires } from './api'

// Animation variants (same as services page)
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.0, 0.0, 0.2, 1.0] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] as const }
  }
};

// Process steps data
const processSteps = [
  {
    step: 1,
    title: 'Ingresá la medida',
    icon: Search,
    description: 'Encontrá los tres números en el costado de tu neumático'
  },
  {
    step: 2,
    title: 'Calculamos el diámetro',
    icon: Calculator,
    description: 'Utilizamos la fórmula estándar de la industria'
  },
  {
    step: 3,
    title: 'Buscamos equivalencias',
    icon: Target,
    description: 'Analizamos todo nuestro catálogo disponible'
  },
  {
    step: 4,
    title: 'Resultados ordenados',
    icon: TrendingUp,
    description: 'Te mostramos las mejores opciones disponibles'
  }
];

// Benefits data
const benefits = [
  {
    title: 'Precisión Técnica',
    description: 'Cálculo basado en estándares de la industria automotriz',
    icon: Cpu
  },
  {
    title: 'Tolerancia Óptima',
    description: 'Rango de ±3% para máxima compatibilidad y seguridad',
    icon: Target
  },
  {
    title: 'Stock Actualizado',
    description: 'Solo mostramos productos disponibles en sucursales',
    icon: Package
  },
  {
    title: 'Asesoramiento',
    description: 'Equipo técnico disponible para consultas específicas',
    icon: CheckCircle2
  }
];

export default function TireEquivalenceCalculator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EquivalenceResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleSearch = async (size: TireSize) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const equivalenceResult = await findEquivalentTires(size)
      setResult(equivalenceResult)
    } catch (err) {
      console.error('Error finding equivalences:', err)
      setError('Ocurrió un error al buscar equivalencias. Por favor intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section with Parallax */}
      <section ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* PixiJS Animated Background */}
        <motion.div style={{ y, opacity }} className="absolute inset-0">
          <PixiBackground />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#FEE004_0%,_transparent_70%)] opacity-5" />
        </motion.div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-[#FEE004]/10 backdrop-blur-md border border-[#FEE004]/30 rounded-full px-6 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#FEE004]" />
              <span className="text-[#FEE004] font-medium">Calculadora de equivalencias</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
            >
              Encontrá tu Cubierta<br />Equivalente
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12"
            >
              Precisión garantizada con tolerancia de ±3% según estándares de la industria automotriz
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              variants={fadeInUp}
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <ChevronDown className="w-8 h-8 text-[#FEE004]" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            {/* Input Form */}
            <motion.div
              variants={fadeInUp}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/10 hover:border-[#FEE004]/50 transition-all duration-300 mb-8"
            >
              <TireInput onSearch={handleSearch} loading={loading} />
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 backdrop-blur-lg border-2 border-red-500/30 rounded-2xl p-6 mb-8"
              >
                <p className="text-red-400 font-medium text-center">{error}</p>
              </motion.div>
            )}

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <EquivalentResults result={result} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Process Section - Only show when no results */}
      {!result && !loading && (
        <section className="py-20 relative bg-gradient-to-b from-black via-gray-900/20 to-black">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-center mb-4"
              >
                ¿Cómo funciona?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-gray-400 text-center mb-16 max-w-2xl mx-auto"
              >
                Proceso simple y preciso para encontrar tus cubiertas equivalentes
              </motion.p>

              <div className="relative max-w-4xl mx-auto">
                {/* Timeline line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#FEE004] to-transparent hidden md:block" />

                <div className="space-y-12">
                  {processSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.step}
                        variants={fadeInUp}
                        className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                      >
                        <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                          <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                          <p className="text-gray-400">{step.description}</p>
                        </div>

                        <div className="relative">
                          <div className="w-20 h-20 bg-[#FEE004]/10 backdrop-blur-lg rounded-full flex items-center justify-center border-4 border-[#FEE004] relative z-10">
                            <Icon className="w-8 h-8 text-[#FEE004]" />
                          </div>
                          <div className="absolute inset-0 bg-[#FEE004] rounded-full animate-ping opacity-20" />
                        </div>

                        <div className="flex-1 hidden md:block" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Benefits Section - Only show when no results */}
      {!result && !loading && (
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-4xl md:text-5xl font-bold text-center mb-4"
              >
                ¿Por qué usar nuestro calculador?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-gray-400 text-center mb-16 max-w-2xl mx-auto"
              >
                Precisión técnica y confiabilidad garantizada
              </motion.p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.div
                      key={benefit.title}
                      variants={scaleIn}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/10 hover:border-[#FEE004] transition-all duration-300 group"
                    >
                      <div className="w-14 h-14 bg-[#FEE004]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#FEE004]/20 transition-colors duration-300">
                        <Icon className="w-7 h-7 text-[#FEE004]" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                      <p className="text-gray-400">{benefit.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section - Only show when no results */}
      {!result && !loading && (
        <section className="py-20 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FEE004]/20 via-[#FEE004]/10 to-[#FEE004]/20 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

          <div className="relative z-10 container mx-auto px-4 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 bg-[#FEE004]/10 backdrop-blur-md border border-[#FEE004]/30 rounded-full px-6 py-2 mb-8"
              >
                <Package className="w-4 h-4 text-[#FEE004]" />
                <span className="text-[#FEE004] font-medium">Miles de productos disponibles</span>
              </motion.div>

              <motion.h2
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              >
                ¿No encontrás lo que buscás?
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
              >
                Explorá nuestro catálogo completo o contactanos para recibir asesoramiento personalizado
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/productos">
                  <button className="bg-[#FEE004] text-black font-bold py-4 px-8 rounded-xl hover:bg-[#FEE004]/90 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-2xl shadow-[#FEE004]/20">
                    Ver Catálogo Completo
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <a
                  href="https://wa.me/5492995044430"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-white/20 text-white font-bold py-4 px-8 rounded-xl hover:border-[#FEE004] hover:text-[#FEE004] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Contactar por WhatsApp
                  <ChevronRight className="w-5 h-5" />
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  )
}