'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Package, Info, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react'
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
        className="bg-[#FFC700]/10 border-l-4 border-[#FFC700] rounded-xl p-6 md:p-8"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-7 h-7 text-[#FFC700] flex-shrink-0 mt-1" strokeWidth={2} />
          <div>
            <h3 className="font-black text-white text-lg mb-3">
              Advertencia de Seguridad Importante
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Aunque estas medidas son técnicamente equivalentes según estándares de la industria,
              <strong className="font-bold text-white"> recomendamos consultar el manual de tu vehículo</strong> y/o
              a un profesional antes de realizar la compra. La seguridad de tu vehículo es nuestra prioridad.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8"
      >
        <h3 className="font-black text-white text-xl mb-6 flex items-center gap-2">
          <Info className="w-6 h-6 text-[#FFC700]" strokeWidth={2} />
          Resumen de Búsqueda
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 font-medium text-sm mb-2">Medida Original:</p>
            <p className="text-white font-black text-2xl font-mono">
              {formatTireSize(originalSize)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 font-medium text-sm mb-2">Diámetro de Referencia:</p>
            <p className="text-white font-black text-2xl font-mono">
              {referenceDiameter.toFixed(2)} mm
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 font-medium text-sm mb-2">Rango de Tolerancia:</p>
            <p className="text-[#FFC700] font-black text-2xl font-mono">
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
        className="bg-gray-900 rounded-2xl border border-gray-800 p-6 md:p-8"
      >
        <h3 className="text-3xl font-black text-white mb-2">
          {totalFound === 0 ? (
            'No se encontraron cubiertas equivalentes'
          ) : (
            `${totalFound} ${totalFound === 1 ? 'cubierta equivalente encontrada' : 'cubiertas equivalentes encontradas'}`
          )}
        </h3>

        {totalFound === 0 && (
          <div className="mt-8 text-center py-16">
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-600" strokeWidth={2} />
            </div>
            <p className="text-gray-300 mb-3 text-lg">
              No hay productos en nuestro catálogo que sean equivalentes a la medida {formatTireSize(originalSize)}.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Te recomendamos buscar directamente por la medida original o contactarnos para más opciones.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FFC700] hover:bg-[#FFD633] text-black font-bold rounded-xl transition-all shadow-lg"
            >
              Ver Catálogo Completo
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
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
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-3"
          >
            <TrendingUp className="w-5 h-5 text-[#FFC700] flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-sm text-gray-300 leading-relaxed">
              Las cubiertas están ordenadas por proximidad a tu medida original.
              Las diferencias mostradas están dentro del rango de tolerancia seguro.
            </p>
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
                <Link
                  href={`/productos/${tire.id}`}
                  className="block group"
                >
                  <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 overflow-hidden hover:border-[#FFC700] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FFC700]/10">
                    <div className="flex flex-col sm:flex-row gap-6 p-6 md:p-8">
                      {/* Image */}
                      <div className="w-full sm:w-64 h-64 bg-gray-800 relative flex-shrink-0 rounded-xl overflow-hidden border border-gray-700">
                        {tire.image_url ? (
                          <img
                            src={tire.image_url}
                            alt={tire.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-20 w-20 text-gray-600" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Top Section */}
                        <div>
                          {/* Title */}
                          <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#FFC700] transition-colors">
                            {tire.name}
                          </h3>

                          {/* Brand */}
                          <p className="text-sm text-gray-400 mb-5 font-medium">
                            Marca: <span className="text-gray-300">{tire.brand}</span>
                          </p>

                          {/* Size Info */}
                          <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Medida:</p>
                                <p className="font-mono font-black text-white text-lg">
                                  {tire.width}/{tire.profile} R{tire.diameter}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Diámetro:</p>
                                <p className="font-mono font-black text-white text-lg">
                                  {tire.calculatedDiameter.toFixed(2)} mm
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Diferencia:</p>
                                <p className={`font-mono font-black text-lg ${
                                  Math.abs(tire.differencePercent) < 1
                                    ? 'text-green-400'
                                    : 'text-[#FFC700]'
                                }`}>
                                  {tire.difference > 0 ? '+' : ''}{tire.difference.toFixed(2)} mm
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-2 font-medium">Variación:</p>
                                <p className={`font-mono font-black text-lg ${
                                  Math.abs(tire.differencePercent) < 1
                                    ? 'text-green-400'
                                    : 'text-[#FFC700]'
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
                            <span className="text-5xl font-black text-white">
                              ${Number(tire.price).toLocaleString('es-AR')}
                            </span>
                          </div>

                          {/* Stock & Match */}
                          <div className="flex flex-wrap items-center gap-3">
                            {tire.stock > 0 ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-400 font-bold">
                                  En stock ({tire.stock} disponibles)
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                <span className="text-sm text-red-400 font-bold">
                                  Sin stock
                                </span>
                              </div>
                            )}

                            {Math.abs(tire.differencePercent) < 1 && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-[#FFC700]/10 rounded-lg border border-[#FFC700]/30">
                                <CheckCircle className="w-4 h-4 text-[#FFC700]" strokeWidth={2.5} />
                                <span className="text-sm font-bold text-[#FFC700]">
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
