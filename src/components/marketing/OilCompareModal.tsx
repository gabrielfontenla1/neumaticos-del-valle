'use client'

import { Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Droplet, CheckCircle2, MessageCircle } from 'lucide-react'
import type { OilProduct } from '@/data/shellHelixOils'

interface OilCompareModalProps {
  oils: OilProduct[]
  isOpen: boolean
  onClose: () => void
}

const categoryColors: Record<string, string> = {
  'Premium': 'bg-blue-100 text-blue-700',
  'Sintético': 'bg-purple-100 text-purple-700',
  'Semi-Sintético': 'bg-green-100 text-green-700',
  'Mineral': 'bg-amber-100 text-amber-700',
}

const categoryGradients: Record<string, string> = {
  'Premium': 'from-blue-500 to-blue-700',
  'Sintético': 'from-purple-500 to-purple-700',
  'Semi-Sintético': 'from-green-500 to-green-700',
  'Mineral': 'from-amber-500 to-amber-700',
}

// Filas de la tabla comparativa
const compareRows = [
  { key: 'category', label: 'Categoría' },
  { key: 'viscosity', label: 'Viscosidad' },
  { key: 'specifications', label: 'Especificaciones' },
  { key: 'features', label: 'Características' },
  { key: 'sizes', label: 'Tamaños' },
  { key: 'applications', label: 'Aplicaciones' },
] as const

function getCellValue(oil: OilProduct, key: typeof compareRows[number]['key']): React.ReactNode {
  switch (key) {
    case 'category':
      return (
        <span className={`px-2 py-1 rounded text-xs font-bold ${categoryColors[oil.category]}`}>
          {oil.category}
        </span>
      )
    case 'viscosity':
      return (
        <span className="px-2 py-1 bg-gray-100 rounded text-sm font-semibold text-gray-700">
          {oil.viscosity}
        </span>
      )
    case 'specifications':
      return (
        <div className="flex flex-wrap gap-1">
          {oil.specifications.map((spec, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
              {spec}
            </span>
          ))}
        </div>
      )
    case 'features':
      return (
        <ul className="space-y-1">
          {oil.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-1 text-xs text-gray-600">
              <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
              {feature}
            </li>
          ))}
        </ul>
      )
    case 'sizes':
      return (
        <div className="flex flex-wrap gap-1">
          {oil.sizes.map((size, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">
              {size}
            </span>
          ))}
        </div>
      )
    case 'applications':
      return (
        <div className="flex flex-wrap gap-1">
          {oil.applications.map((app, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">
              {app}
            </span>
          ))}
        </div>
      )
    default:
      return null
  }
}

export function OilCompareModal({ oils, isOpen, onClose }: OilCompareModalProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493855854741'

  const handleConsult = (oil: OilProduct) => {
    const message = `Hola! Quiero consultar por ${oil.name} ${oil.viscosity}`
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (oils.length === 0) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Comparar aceites ({oils.length})
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="min-w-max">
                <table className="w-full">
                  {/* Product headers */}
                  <thead>
                    <tr>
                      <th className="w-40 p-3 text-left text-sm font-semibold text-gray-500 bg-gray-50 rounded-tl-lg">
                        &nbsp;
                      </th>
                      {oils.map((oil, idx) => (
                        <th
                          key={oil.id}
                          className={`p-3 text-center bg-gray-50 ${idx === oils.length - 1 ? 'rounded-tr-lg' : ''}`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 bg-gradient-to-br ${categoryGradients[oil.category]} rounded-lg flex items-center justify-center`}>
                              <Droplet className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-gray-900">{oil.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Comparison rows */}
                  <tbody>
                    {compareRows.map((row, rowIdx) => (
                      <tr key={row.key} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="p-3 text-sm font-semibold text-gray-700 border-r border-gray-100">
                          {row.label}
                        </td>
                        {oils.map((oil) => (
                          <td key={oil.id} className="p-3 text-center align-top border-r border-gray-100 last:border-r-0">
                            <div className="flex justify-center">
                              {getCellValue(oil, row.key)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* CTA row */}
                    <tr className="bg-gray-50">
                      <td className="p-3 rounded-bl-lg">&nbsp;</td>
                      {oils.map((oil, idx) => (
                        <td
                          key={oil.id}
                          className={`p-3 text-center ${idx === oils.length - 1 ? 'rounded-br-lg' : ''}`}
                        >
                          <button
                            onClick={() => handleConsult(oil)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors inline-flex items-center gap-2 text-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Consultar
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
