'use client'

import { motion } from 'framer-motion'
import { MapPin, ChevronRight } from 'lucide-react'

interface ProvinceStepProps {
  onSelect: (province: string) => void
  selectedProvince?: string
}

// Provincias donde Neumáticos del Valle tiene sucursales
const PROVINCES = [
  {
    id: 'catamarca',
    name: 'Catamarca',
    branches: 2
  },
  {
    id: 'santiago-del-estero',
    name: 'Santiago del Estero',
    branches: 2
  },
  {
    id: 'salta',
    name: 'Salta',
    branches: 1
  },
  {
    id: 'tucuman',
    name: 'Tucumán',
    branches: 1
  }
]

export default function ProvinceStep({ onSelect, selectedProvince }: ProvinceStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona tu Provincia
        </h3>
        <p className="text-sm text-gray-600">
          Elige dónde agendar tu turno
        </p>
      </div>

      <div className="space-y-3">
        {PROVINCES.map((province) => (
          <motion.div
            key={province.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(province.name)}
            className={`
              cursor-pointer rounded-lg border-2 p-4 transition-all
              ${selectedProvince === province.name
                ? 'border-[#FEE004] bg-yellow-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-[#FEE004] hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">
                  {province.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  <MapPin className="inline-block w-3 h-3 mr-1" />
                  {province.branches} {province.branches === 1 ? 'sucursal' : 'sucursales'}
                </p>
                {selectedProvince === province.name && (
                  <div className="mt-2">
                    <span className="inline-flex items-center text-xs text-[#FEE004] font-medium">
                      ✓ Seleccionada
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          <strong>Distribuidor Oficial Pirelli</strong>
        </p>
      </div>
    </div>
  )
}