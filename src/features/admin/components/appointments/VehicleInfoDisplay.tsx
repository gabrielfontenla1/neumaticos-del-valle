'use client'

import { Car } from 'lucide-react'

interface VehicleInfoDisplayProps {
  make: string | null
  model: string | null
  year: number | null
  compact?: boolean
}

export function VehicleInfoDisplay({ make, model, year, compact = false }: VehicleInfoDisplayProps) {
  if (!make && !model && !year) {
    return (
      <span className="text-xs text-[#666666] italic">Sin información del vehículo</span>
    )
  }

  const vehicleText = [make, model, year].filter(Boolean).join(' ')

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#888888]">
        <Car className="w-3 h-3" />
        <span>{vehicleText}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-lg bg-[#3a3a38]">
        <Car className="w-4 h-4 text-[#d97757]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#fafafa]">{vehicleText}</p>
        <p className="text-xs text-[#888888]">Vehículo del cliente</p>
      </div>
    </div>
  )
}
