'use client'

import { motion } from 'framer-motion'
import { Droplet, CheckCircle2, MessageCircle, Check } from 'lucide-react'
import type { OilProduct } from '@/data/shellHelixOils'

interface OilProductCardProps {
  oil: OilProduct
  isSelected?: boolean
  onToggleCompare?: (oilId: string) => void
  onConsult?: (oil: OilProduct) => void
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

export function OilProductCard({
  oil,
  isSelected = false,
  onToggleCompare,
  onConsult
}: OilProductCardProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493855854741'

  const handleConsult = () => {
    if (onConsult) {
      onConsult(oil)
    } else {
      // Default: abrir WhatsApp con mensaje pre-armado
      const message = `Hola! Quiero consultar por ${oil.name} ${oil.viscosity}`
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleCompare) {
      onToggleCompare(oil.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${
        isSelected ? 'border-[#FEE004]' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      {/* Compare checkbox */}
      {onToggleCompare && (
        <button
          onClick={handleToggleCompare}
          className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#FEE004] text-black'
              : 'bg-white/90 border border-gray-200 text-gray-400 hover:border-[#FEE004] hover:text-[#FEE004]'
          }`}
          aria-label={isSelected ? 'Quitar de comparación' : 'Agregar a comparación'}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </button>
      )}

      {/* Image placeholder with gradient */}
      <div className={`h-32 bg-gradient-to-br ${categoryGradients[oil.category] || 'from-gray-500 to-gray-700'} flex items-center justify-center relative`}>
        <div className="absolute inset-0 bg-black/10" />
        <Droplet className="w-16 h-16 text-white/80" />

        {/* Category badge */}
        <span className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold ${categoryColors[oil.category] || 'bg-gray-100 text-gray-700'}`}>
          {oil.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name & viscosity */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{oil.name}</h3>
          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 rounded text-sm font-semibold text-gray-600">
            {oil.viscosity}
          </span>
        </div>

        {/* Features (3 principales) */}
        <ul className="space-y-1.5 mb-4">
          {oil.features.slice(0, 3).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {oil.sizes.map((size, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold"
            >
              {size}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleConsult}
          className="w-full px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Consultar
        </button>
      </div>
    </motion.div>
  )
}
