'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { EquivalenceResult } from './types'
import { formatTireSize } from './api'

interface EquivalentResultsProps {
  result: EquivalenceResult
}

export default function EquivalentResults({ result }: EquivalentResultsProps) {
  const { originalSize, equivalentTires, totalFound } = result

  return (
    <div className="space-y-6">
      {/* Simple Warning */}
      <div className="bg-[#FEE004]/10 border border-[#FEE004]/30 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#FEE004] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-300">
          Consultá el manual de tu vehículo antes de comprar.
        </p>
      </div>

      {/* Results Count - Simple */}
      <div className="border-b border-white/10 pb-4">
        <p className="text-sm text-gray-400">
          Buscando equivalentes para <span className="text-white font-bold font-mono">{formatTireSize(originalSize)}</span>
        </p>
        <h2 className="text-xl font-bold text-white mt-1">
          {totalFound === 0 ? 'Sin resultados' : `${totalFound} ${totalFound === 1 ? 'resultado' : 'resultados'}`}
        </h2>
      </div>

      {/* No Results */}
      {totalFound === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No hay equivalencias disponibles</p>
          <Link
            href="/productos"
            className="inline-block bg-[#FEE004] text-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#FEE004]/90 transition-colors"
          >
            Ver Catálogo
          </Link>
        </div>
      )}

      {/* Product List - Minimal */}
      {totalFound > 0 && (
        <div className="space-y-3">
          {equivalentTires.map((tire) => (
            <Link
              key={tire.id}
              href={`/productos/${tire.id}`}
              className="block bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#FEE004]/50 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="w-24 h-24 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                  <img
                    src="/tire.webp"
                    alt={tire.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Brand & Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 uppercase">{tire.brand}</span>
                    {tire.equivalenceLevel && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          tire.equivalenceLevel === 'exacta'
                            ? 'bg-green-500/20 text-green-400'
                            : tire.equivalenceLevel === 'muy buena'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-[#FEE004]/20 text-[#FEE004]'
                        }`}
                      >
                        {tire.equivalenceLevel}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-1">
                    {tire.name}
                  </h3>

                  {/* Size & Details */}
                  <div className="flex items-center gap-4 text-sm mb-2">
                    <span className="font-mono font-bold text-white">
                      {tire.width}/{tire.profile} R{tire.diameter}
                    </span>
                    <span className="text-gray-400">
                      {tire.differencePercent > 0 ? '+' : ''}{tire.differencePercent.toFixed(1)}%
                    </span>
                    {tire.stock > 0 ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Stock
                      </span>
                    ) : (
                      <span className="text-red-400 text-xs">Sin stock</span>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-lg font-bold text-white">
                    ${Number(tire.price).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
