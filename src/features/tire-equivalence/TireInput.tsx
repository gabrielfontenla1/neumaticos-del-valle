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
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4">
        Ingresá la medida de tu cubierta
      </h2>

      <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 leading-relaxed">
        Encontrá estos números en el costado de tu neumático. Aparecen en formato:
        <span className="text-[#FEE004] font-semibold"> 205/55 R16</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Ancho */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Label htmlFor="width" className="text-xs sm:text-sm font-bold text-white mb-2 sm:mb-3 block">
              Ancho (mm)
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
              className="w-full px-3 py-3 sm:px-5 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl text-white placeholder:text-gray-500 placeholder:text-sm placeholder:font-normal sm:placeholder:text-base focus:ring-2 focus:ring-[#FEE004] focus:border-[#FEE004] hover:border-white/30 transition-all font-semibold text-base sm:text-lg"
            />
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2 font-medium">Rango: 125 - 355</p>
          </motion.div>

          {/* Perfil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Label htmlFor="profile" className="text-xs sm:text-sm font-bold text-white mb-2 sm:mb-3 block">
              Perfil (%)
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
              className="w-full px-3 py-3 sm:px-5 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl text-white placeholder:text-gray-500 placeholder:text-sm placeholder:font-normal sm:placeholder:text-base focus:ring-2 focus:ring-[#FEE004] focus:border-[#FEE004] hover:border-white/30 transition-all font-semibold text-base sm:text-lg"
            />
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2 font-medium">Rango: 25 - 85</p>
          </motion.div>

          {/* Rodado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Label htmlFor="diameter" className="text-xs sm:text-sm font-bold text-white mb-2 sm:mb-3 block">
              Rodado (pulgadas)
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
              className="w-full px-3 py-3 sm:px-5 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-xl text-white placeholder:text-gray-500 placeholder:text-sm placeholder:font-normal sm:placeholder:text-base focus:ring-2 focus:ring-[#FEE004] focus:border-[#FEE004] hover:border-white/30 transition-all font-semibold text-base sm:text-lg"
            />
            <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2 font-medium">Rango: 12 - 24</p>
          </motion.div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Alert variant="destructive" className="bg-red-500/10 backdrop-blur-md border-2 border-red-500/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="text-xs sm:text-sm font-bold mb-2">
                  Corregí los siguientes errores:
                </p>
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-xs sm:text-sm flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.div
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
        >
          <Button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-6 bg-[#FEE004] hover:bg-[#FEE004]/90 text-black font-bold text-base sm:text-lg rounded-xl disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-2xl shadow-[#FEE004]/20 transform hover:scale-105"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-3 border-black/20 border-t-black"></div>
                <span className="text-sm sm:text-base">Buscando equivalencias...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                <span className="text-sm sm:text-base">Buscar Cubiertas Equivalentes</span>
              </>
            )}
          </Button>
        </motion.div>
      </form>

      {/* Example */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white/5 backdrop-blur-md rounded-xl border-2 border-white/10 hover:border-[#FEE004]/30 transition-all duration-300"
      >
        <p className="text-xs sm:text-sm font-bold text-gray-300 mb-2 sm:mb-3">
          Ejemplo de medida:
        </p>
        <div className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-mono">
          <span className="font-black text-[#FEE004]">205</span>
          <span className="text-gray-400">/</span>
          <span className="font-black text-[#FEE004]">55</span>
          <span className="text-gray-400">R</span>
          <span className="font-black text-[#FEE004]">16</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FEE004] rounded-full"></div>
            <span>Ancho: 205mm</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FEE004] rounded-full"></div>
            <span>Perfil: 55%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FEE004] rounded-full"></div>
            <span>Rodado: 16"</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}