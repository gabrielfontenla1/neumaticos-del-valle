'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Calculator, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import TireInput from './TireInput'
import EquivalentResults from './EquivalentResults'
import { TireSize, EquivalenceResult } from './types'
import { findEquivalentTires } from './api'

export default function TireEquivalenceCalculator() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EquivalenceResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-b from-gray-900 to-black border-b border-gray-800 py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-6 bg-[#FFC700]/20 text-[#FFC700] px-6 py-2 rounded-full text-sm font-semibold tracking-wide border border-[#FFC700]/30"
          >
            CALCULADORA DE EQUIVALENCIAS
          </motion.span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Encontrá tu cubierta<br />equivalente perfecta
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Calculamos todas las medidas técnicamente equivalentes según estándares
            de la industria automotriz. Precisión garantizada.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <TireInput onSearch={handleSearch} loading={loading} />
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-12"
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

        {/* Info Section */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            {/* How it works */}
            <div className="bg-gray-900 rounded-2xl p-8 md:p-12 border border-gray-800">
              <div className="flex items-center gap-3 mb-8">
                <Calculator className="w-8 h-8 text-[#FFC700]" strokeWidth={2} />
                <h2 className="text-3xl font-black text-white">
                  ¿Cómo funciona?
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    step: '1',
                    title: 'Ingresá la medida',
                    description: 'Encontrá los tres números en el costado de tu neumático. Por ejemplo: 205/55 R16 representan ancho, perfil y rodado.'
                  },
                  {
                    step: '2',
                    title: 'Calculamos el diámetro',
                    description: 'Utilizamos la fórmula estándar de la industria para calcular el diámetro exterior total de tu cubierta actual.'
                  },
                  {
                    step: '3',
                    title: 'Buscamos equivalencias',
                    description: 'Analizamos nuestro catálogo completo y encontramos todas las cubiertas dentro del rango de tolerancia de ±3%.'
                  },
                  {
                    step: '4',
                    title: 'Resultados ordenados',
                    description: 'Te mostramos las opciones ordenadas por proximidad a tu medida original, con toda la información técnica.'
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#FFC700] rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-black font-black text-xl">{item.step}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[#FFC700] rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <h3 className="text-3xl md:text-4xl font-black text-black mb-4">
                  ¿No encontrás lo que buscás?
                </h3>
                <p className="text-lg text-black/80 mb-8 max-w-2xl">
                  Explorá nuestro catálogo completo de neumáticos Pirelli o contactanos
                  para recibir asesoramiento personalizado.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/productos"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black hover:bg-gray-900 text-[#FFC700] font-bold rounded-lg transition-all shadow-lg"
                  >
                    Ver catálogo completo
                    <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                  </Link>
                  <a
                    href="https://wa.me/5492995044430"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black/10 hover:bg-black/20 text-black font-bold rounded-lg transition-all border-2 border-black/20"
                  >
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
