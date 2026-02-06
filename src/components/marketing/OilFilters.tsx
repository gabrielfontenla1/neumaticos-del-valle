'use client'

import { ChevronDown } from 'lucide-react'

interface OilFiltersProps {
  selectedCategory: string
  selectedViscosity: string
  onCategoryChange: (category: string) => void
  onViscosityChange: (viscosity: string) => void
}

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'Premium', label: 'Premium' },
  { id: 'Sintético', label: 'Sintético' },
  { id: 'Semi-Sintético', label: 'Semi-Sintético' },
  { id: 'Mineral', label: 'Mineral' },
]

const viscosities = [
  { id: 'all', label: 'Todas las viscosidades' },
  { id: '5W-30', label: '5W-30' },
  { id: '5W-40', label: '5W-40' },
  { id: '10W-40', label: '10W-40' },
  { id: '15W-40', label: '15W-40' },
  { id: '20W-50', label: '20W-50' },
]

export function OilFilters({
  selectedCategory,
  selectedViscosity,
  onCategoryChange,
  onViscosityChange,
}: OilFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Category tabs */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  selectedCategory === category.id
                    ? 'bg-black text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Viscosity select */}
        <div className="md:w-56">
          <div className="relative">
            <select
              value={selectedViscosity}
              onChange={(e) => onViscosityChange(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-10 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FEE004] focus:border-transparent cursor-pointer"
            >
              {viscosities.map((viscosity) => (
                <option key={viscosity.id} value={viscosity.id}>
                  {viscosity.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
