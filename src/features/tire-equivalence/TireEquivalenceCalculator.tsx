'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator } from 'lucide-react'
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
    <div className="min-h-screen bg-black text-white">
      {/* Header Simple */}
      <section className="pt-16 pb-8 border-b border-white/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Calculator className="w-6 h-6 text-[#FEE004]" />
              <span className="text-sm text-gray-400">Calculadora de Equivalencias</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Encontrá Cubiertas Equivalentes
            </h1>
            <p className="text-gray-400 text-sm">
              Tolerancia ±3% según estándares de la industria
            </p>
          </motion.div>
        </div>
      </section>

      {/* Explicación */}
      <section className="py-8 border-b border-white/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-3">¿Qué hace esta herramienta?</h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              Esta calculadora te ayuda a encontrar cubiertas alternativas que sean técnicamente compatibles con tu vehículo.
              Ingresás la medida de tu cubierta actual y te mostramos todas las opciones disponibles en nuestro stock que
              tienen un diámetro total equivalente (con una tolerancia de ±3%).
            </p>
            <p className="text-xs text-gray-400">
              <strong className="text-[#FEE004]">Importante:</strong> Las equivalencias son calculadas matemáticamente,
              pero siempre recomendamos consultar el manual de tu vehículo antes de comprar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6"
          >
            <TireInput onSearch={handleSearch} loading={loading} />
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
            >
              <p className="text-red-400 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <EquivalentResults result={result} />
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}