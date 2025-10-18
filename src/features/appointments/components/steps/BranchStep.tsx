'use client'

import { motion } from 'framer-motion'
import { MapPin, Phone, Clock, Star, ChevronRight } from 'lucide-react'
import type { Branch } from '../../types'

interface BranchStepProps {
  branches: Branch[]
  selectedProvince?: string
  onSelect: (branchId: string) => void
  selectedBranchId?: string
}

export default function BranchStep({
  branches,
  selectedProvince,
  onSelect,
  selectedBranchId
}: BranchStepProps) {

  // Filter branches by selected province
  const filteredBranches = selectedProvince
    ? branches.filter(branch => branch.province === selectedProvince)
    : branches;

  if (filteredBranches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          No hay sucursales disponibles en {selectedProvince}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona la Sucursal
        </h3>
        <p className="text-sm text-gray-600">
          {selectedProvince ? `En ${selectedProvince}` : 'Elige tu sucursal'}
        </p>
      </div>

      <div className="grid gap-3">
        {filteredBranches.map((branch) => (
          <motion.div
            key={branch.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(branch.id)}
            className={`
              cursor-pointer rounded-lg border-2 p-4 transition-all
              ${selectedBranchId === branch.id
                ? 'border-[#FEE004] bg-yellow-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-[#FEE004] hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900 mb-1">
                  {branch.name}
                  {branch.is_main && (
                    <span className="ml-2 inline-flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                    </span>
                  )}
                </h4>

                {/* Address */}
                <div className="flex items-start space-x-2 text-xs text-gray-600">
                  <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{branch.address}, {branch.city}</span>
                </div>

                {selectedBranchId === branch.id && (
                  <span className="inline-flex items-center text-xs text-[#FEE004] font-medium mt-2">
                    ✓ Seleccionada
                  </span>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}