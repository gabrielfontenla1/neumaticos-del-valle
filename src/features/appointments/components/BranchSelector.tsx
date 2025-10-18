// Branch Selector Component

'use client'

import { MapPin, Phone, Clock } from 'lucide-react'
import type { Branch } from '../types'

interface BranchSelectorProps {
  branches: Branch[]
  selectedBranchId?: string
  onSelect: (branchId: string) => void
}

export function BranchSelector({ branches, selectedBranchId, onSelect }: BranchSelectorProps) {
  if (branches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Cargando sucursales disponibles...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Selecciona una Sucursal</h3>

      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((branch) => {
          const isSelected = branch.id === selectedBranchId

          return (
            <button
              key={branch.id}
              onClick={() => onSelect(branch.id)}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all
                ${isSelected
                  ? 'border-red-600 bg-red-50 shadow-md'
                  : 'border-gray-200 hover:border-red-300 hover:shadow-sm'
                }
              `}
            >
              {branch.is_main && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
                  PRINCIPAL
                </span>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">
                  {branch.name}
                </h4>

                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{branch.address}, {branch.city}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{branch.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Lun-Vie: 9:00-18:00, Sáb: 9:00-13:00</span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <span className="text-sm font-medium text-red-600">
                    ✓ Sucursal seleccionada
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}