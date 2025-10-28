'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Package, Info, TrendingUp, CheckCircle, ChevronRight, ArrowRight } from 'lucide-react'
import { EquivalenceResult } from './types'
import { formatTireSize } from './api'

interface EquivalentResultsProps {
  result: EquivalenceResult
}

export default function EquivalentResults({ result }: EquivalentResultsProps) {
  const { originalSize, referenceDiameter, toleranceRange, equivalentTires, totalFound } = result

  return (
    <div className="space-y-8">
      {/* Safety Warning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-[#FEE004]/10 backdrop-blur-lg border-2 border-[#FEE004]/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FEE004]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-[#FEE004]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-2">
                Advertencia de Seguridad Importante
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Aunque estas medidas son técnicamente equivalentes según estándares de la industria,
                <strong className="font-bold text-white"> recomendamos consultar el manual de tu vehículo</strong> y/o
                a un profesional antes de realizar la compra. La seguridad de tu vehículo es nuestra prioridad.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white/5 backdrop-blur-lg border-2 border-white/10 rounded-2xl p-6 md:p-8 hover:border-[#FEE004]/30 transition-all duration-300"
      >
        <h3 className="font-bold text-white text-2xl mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FEE004]/10 rounded-xl flex items-center justify-center">
            <Info className="w-6 h-6 text-[#FEE004]" strokeWidth={2.5} />
          </div>
          Resumen de Búsqueda
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border-2 border-white/10">
            <p className="text-gray-400 font-medium text-sm mb-2">Medida Original:</p>
            <p className="text-white font-bold text-2xl font-mono">
              {formatTireSize(originalSize)}
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border-2 border-white/10">
            <p className="text-gray-400 font-medium text-sm mb-2">Diámetro de Referencia:</p>
            <p className="text-white font-bold text-2xl font-mono">
              {referenceDiameter.toFixed(2)} mm
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border-2 border-white/10">
            <p className="text-gray-400 font-medium text-sm mb-2">Rango de Tolerancia:</p>
            <p className="text-[#FEE004] font-bold text-2xl font-mono">
              ±{toleranceRange.tolerance}%
            </p>
            <p className="text-gray-500 text-xs mt-2 font-mono">
              {toleranceRange.min.toFixed(2)} - {toleranceRange.max.toFixed(2)} mm
            </p>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-lg rounded-2xl border-2 border-white/10 p-6 md:p-8 hover:border-[#FEE004]/30 transition-all duration-300"
      >
        <h3 className="text-3xl font-bold text-white mb-2">
          {totalFound === 0 ? (
            'No se encontraron cubiertas equivalentes'
          ) : (
            `${totalFound} ${totalFound === 1 ? 'cubierta equivalente encontrada' : 'cubiertas equivalentes encontradas'}`
          )}
        </h3>

        {totalFound === 0 && (
          <div className="mt-8 text-center py-16">
            <div className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-white/10">
              <Package className="w-10 h-10 text-gray-400" strokeWidth={2} />
            </div>
            <p className="text-gray-300 mb-3 text-lg">
              No hay productos en nuestro catálogo que sean equivalentes a la medida {formatTireSize(originalSize)}.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Te recomendamos buscar directamente por la medida original o contactarnos para más opciones.
            </p>
            <Link href="/productos">
              <button className="bg-[#FEE004] hover:bg-[#FEE004]/90 text-black font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-[#FEE004]/20 inline-flex items-center gap-2">
                Ver Catálogo Completo
                <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* Equivalent Tires List */}
      {totalFound > 0 && (
        <div className="space-y-6">
          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white/5 backdrop-blur-md border-2 border-white/10 rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-[#FEE004]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-[#FEE004]" strokeWidth={2.5} />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Las cubiertas están ordenadas por proximidad a tu medida original.
                Las diferencias mostradas están dentro del rango de tolerancia seguro.
              </p>
            </div>
          </motion.div>

          {/* Product Cards */}
          <div className="space-y-6">
            {equivalentTires.map((tire, index) => (
              <motion.div
                key={tire.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              >
                <Link href={`/productos/${tire.id}`} className="block group">
                  <div className="bg-white/5 backdrop-blur-lg border-2 border-white/10 overflow-hidden hover:border-[#FEE004] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FEE004]/10 rounded-2xl">
                    <div className="flex flex-col sm:flex-row gap-6 p-6 md:p-8">
                      {/* Image */}
                      <div className="w-full sm:w-64 h-64 bg-white/5 relative flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/10">
                        {/* Using mock tire image for all products (temporary) */}
                        <img
                          src="/tire.webp"
                          alt={tire.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Top Section */}
                        <div>
                          {/* Title */}
                          <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#FEE004] transition-colors">
                            {tire.name}
                          </h3>

                          {/* Brand */}
                          <p className="text-sm text-gray-400 mb-5 font-medium">
                            Marca: <span className="text-gray-300">{tire.brand}</span>
                          </p>

                          {/* Size Info */}
                          <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 mb-6 border-2 border-white/10">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Medida:</p>
                                <p className="font-mono font-bold text-white text-lg">
                                  {tire.width}/{tire.profile} R{tire.diameter}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Diámetro:</p>
                                <p className="font-mono font-bold text-white text-lg">
                                  {tire.calculatedDiameter.toFixed(2)} mm
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Diferencia:</p>
                                <p className={`font-mono font-bold text-lg ${
                                  Math.abs(tire.differencePercent) < 1
                                    ? 'text-green-400'
                                    : 'text-[#FEE004]'
                                }`}>
                                  {tire.difference > 0 ? '+' : ''}{tire.difference.toFixed(2)} mm
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Variación:</p>
                                <p className={`font-mono font-bold text-lg ${
                                  Math.abs(tire.differencePercent) < 1
                                    ? 'text-green-400'
                                    : 'text-[#FEE004]'
                                }`}>
                                  {tire.differencePercent > 0 ? '+' : ''}{tire.differencePercent.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section */}
                        <div>
                          {/* Price */}
                          <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-5xl font-bold text-white">
                              ${Number(tire.price).toLocaleString('es-AR')}
                            </span>
                          </div>

                          {/* Stock & Match */}
                          <div className="flex flex-wrap items-center gap-3">
                            {tire.stock > 0 ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-md border-2 border-green-500/30 text-green-400 rounded-lg">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm font-bold">
                                  En stock ({tire.stock} disponibles)
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 backdrop-blur-md border-2 border-red-500/30 text-red-400 rounded-lg">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <span className="text-sm font-bold">
                                  Sin stock
                                </span>
                              </div>
                            )}

                            {Math.abs(tire.differencePercent) < 1 && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-[#FEE004]/10 backdrop-blur-md border-2 border-[#FEE004]/30 text-[#FEE004] rounded-lg">
                                <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                                <span className="text-sm font-bold">
                                  Equivalencia Exacta
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
