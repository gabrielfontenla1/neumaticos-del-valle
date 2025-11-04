'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TireSize } from './types'
import { validateTireSize } from './api'
import { Search, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TireInputProps {
  onSearch: (size: TireSize) => void
  loading: boolean
}

export default function TireInput({ onSearch, loading }: TireInputProps) {
  const [width, setWidth] = useState('')
  const [profile, setProfile] = useState('')
  const [diameter, setDiameter] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    const size: TireSize = {
      width: parseInt(width),
      profile: parseInt(profile),
      diameter: parseInt(diameter)
    }

    const validation = validateTireSize(size)

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    onSearch(size)
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Ingresá los tres números de tu cubierta <span className="text-white font-mono">205/55 R16</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Ancho */}
          <div>
            <Label htmlFor="width" className="text-xs text-gray-400 mb-1.5 block">
              Ancho
            </Label>
            <Input
              type="number"
              id="width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="205"
              min="125"
              max="355"
              step="5"
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#FEE004] focus:border-[#FEE004] transition-colors text-sm"
            />
          </div>

          {/* Perfil */}
          <div>
            <Label htmlFor="profile" className="text-xs text-gray-400 mb-1.5 block">
              Perfil
            </Label>
            <Input
              type="number"
              id="profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="55"
              min="25"
              max="85"
              step="5"
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#FEE004] focus:border-[#FEE004] transition-colors text-sm"
            />
          </div>

          {/* Rodado */}
          <div>
            <Label htmlFor="diameter" className="text-xs text-gray-400 mb-1.5 block">
              Rodado
            </Label>
            <Input
              type="number"
              id="diameter"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              placeholder="16"
              min="12"
              max="24"
              step="1"
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:ring-1 focus:ring-[#FEE004] focus:border-[#FEE004] transition-colors text-sm"
            />
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-xs text-red-400 mb-1 font-semibold">Errores:</p>
            <ul className="space-y-0.5">
              {errors.map((error, index) => (
                <li key={index} className="text-xs text-red-400">• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FEE004] hover:bg-[#FEE004]/90 text-black font-semibold py-3 rounded-lg disabled:bg-gray-700 disabled:text-gray-500 transition-colors text-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black" />
              Buscando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </span>
          )}
        </Button>
      </form>
    </div>
  )
}