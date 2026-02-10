'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Info, Package, ChevronRight } from 'lucide-react'
import { EquivalentTire, TireSize } from '../types'
import { formatTireSize } from '../api'
import { Badge } from '@/components/ui/badge'
import { QuickAddButton } from '@/features/cart/components/AddToCartButton'

interface EquivalencesSectionProps {
  equivalentTires: EquivalentTire[]
  hasExactMatch: boolean
  hasExactMatchWithoutStock?: boolean
  loading: boolean
  originalSize: TireSize
  className?: string
}

export function EquivalencesSection({
  equivalentTires,
  hasExactMatch,
  hasExactMatchWithoutStock = false,
  loading,
  originalSize,
  className = ''
}: EquivalencesSectionProps) {
  // Si está cargando, mostrar skeleton
  if (loading) {
    return (
      <div className={`mt-8 ${className}`}>
        <div className="animate-pulse">
          <div className="h-24 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Si no hay equivalencias, no mostrar nada
  if (equivalentTires.length === 0) {
    return null
  }

  // Función helper para obtener el nombre limpio del producto
  const getCleanProductName = (tire: EquivalentTire) => {
    if (tire.width && tire.profile && tire.diameter) {
      const dimensionPattern = `${tire.width}/${tire.profile}R${tire.diameter}`
      const name = tire.name || ''
      if (name.startsWith(dimensionPattern)) {
        return name.substring(dimensionPattern.length).trim()
      }
    }
    return tire.name
  }

  // Función para mostrar el stock en rangos
  const getStockDisplay = (stock: number) => {
    if (stock === 1) return 'Última unidad'
    if (stock < 10) return `${stock} unidades`
    return '+10 unidades'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`mt-12 ${className}`}
    >
      {/* Alert Banner */}
      {hasExactMatchWithoutStock ? (
        // Caso 1: Hay productos pero SIN STOCK - Orange Warning
        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                Sin stock temporal en {formatTireSize(originalSize)}
              </h3>
              <p className="text-sm text-orange-800">
                Actualmente no tenemos stock de la medida exacta, pero encontramos{' '}
                <strong>{equivalentTires.length} cubiertas equivalentes compatibles</strong> con
                tolerancia ±3% según estándares de la industria. Estas opciones son técnicamente válidas
                para tu vehículo.
              </p>
            </div>
          </div>
        </div>
      ) : !hasExactMatch ? (
        // Caso 2: NO existe esa medida en el catálogo - Red Alert
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Medida {formatTireSize(originalSize)} no disponible en catálogo
              </h3>
              <p className="text-sm text-red-800">
                Esta medida no está en nuestro catálogo actual, pero encontramos{' '}
                <strong>{equivalentTires.length} cubiertas equivalentes compatibles</strong> con
                tolerancia ±3% que son perfectamente seguras para tu vehículo.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Caso 3: SÍ hay stock - Blue Info
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Equivalencias compatibles disponibles
              </h3>
              <p className="text-sm text-blue-800">
                Además de los productos en stock en {formatTireSize(originalSize)}, también podés considerar estas{' '}
                <strong>{equivalentTires.length} equivalencias compatibles</strong> con tolerancia ±3%.
                Mayor variedad de opciones para tu vehículo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Equivalencias - Mismo diseño que productos normales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {equivalentTires.map((tire, index) => {
          // Usar price_list real desde la base de datos
          const priceList = (tire as any).price_list || ((tire as any).features as any)?.price_list || 0
          const discountPercentage = priceList && priceList > tire.price
            ? Math.round(((priceList - tire.price) / priceList) * 100)
            : 0
          const previousPrice = priceList || tire.price

          return (
            <motion.div
              key={tire.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group"
            >
              <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 hover:border-gray-300 overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out h-full">
                <div className="flex flex-col h-full">
                  {/* Image */}
                  <div className="w-full aspect-square bg-[#FFFFFF] relative overflow-hidden">
                    <Link href={`/productos/${tire.id}`} className="block w-full h-full">
                      <img
                        src={tire.image_url || "/tire.webp"}
                        alt={tire.name}
                        className="w-full h-full object-contain p-3 lg:p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    </Link>

                    {/* Badge de Equivalencia - Positioned at top-left */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge
                        className={`text-[9px] font-semibold px-1.5 py-0.5 ${
                          tire.equivalenceLevel === 'perfecta'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : tire.equivalenceLevel === 'excelente'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : tire.equivalenceLevel === 'muy buena'
                            ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {tire.equivalenceLevel === 'perfecta' && '✓ '}
                        Equivalencia {tire.equivalenceLevel}
                      </Badge>
                    </div>

                    {/* Add to Cart Button - Positioned at bottom-right of image */}
                    <div className="absolute bottom-2 right-2 z-10">
                      <QuickAddButton
                        productId={tire.id}
                        disabled={tire.stock === 0}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-4">
                    {/* Fixed height content area to align divider */}
                    <div className="h-20 flex flex-col justify-between">
                      {/* Brand - Fixed height */}
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide truncate h-4">
                        {tire.brand}
                      </div>

                      {/* Size with Stock and Rating inline - Fixed height */}
                      <div className="flex items-center justify-between gap-2 h-7">
                        <Link href={`/productos/${tire.id}`} className="flex-shrink min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap">
                            {tire.width}/{tire.profile}R{tire.diameter}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {tire.stock > 0 && (
                            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded transition-colors duration-200 whitespace-nowrap ${
                              tire.stock === 1
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-green-50 text-green-700'
                            }`}>
                              Stock: {getStockDisplay(tire.stock)}
                            </span>
                          )}
                          <div className="flex text-yellow-400">
                            {"★★★★☆".split("").map((star, i) => (
                              <span key={i} className="text-[10px]">{star}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Model/Name - Fixed height */}
                      <div className="text-xs text-gray-600 h-5 truncate">
                        {getCleanProductName(tire)}
                      </div>
                    </div>

                    {/* Diferencia de Equivalencia - Info adicional */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-[9px] text-gray-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Diferencia:</span>
                          <span className="font-mono font-medium text-gray-700">
                            {tire.difference > 0 ? '+' : ''}{tire.difference.toFixed(2)} mm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Variación:</span>
                          <span className="font-mono font-medium text-gray-700">
                            {tire.differencePercent > 0 ? '+' : ''}{tire.differencePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="mt-auto pt-2 border-t border-gray-200">
                      {/* Price tachado y descuento con envío gratis */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-500 line-through">
                            ${previousPrice.toLocaleString('es-AR')}
                          </span>
                          {tire.stock > 15 && (
                            <span className="text-[10px] font-semibold text-green-600">
                              Envío gratis
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded transition-all duration-200 group-hover:bg-green-100 self-start">
                          {discountPercentage}% OFF
                        </span>
                      </div>

                      <div className="mb-1">
                        <span className="text-xl font-bold text-gray-900">
                          ${Number(tire.price).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-600">
                        6 cuotas de ${Math.floor(tire.price / 6).toLocaleString('es-AR')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Link a calculadora */}
      <div className="mt-8 text-center">
        <Link
          href="/equivalencias"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Ver calculadora de equivalencias detallada
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  )
}
