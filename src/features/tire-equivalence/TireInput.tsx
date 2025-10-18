'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TireSize } from './types'
import { validateTireSize } from './api'
import { Search, AlertCircle } from 'lucide-react'

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
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 md:p-8">
      <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
        Ingresá la medida de tu cubierta
      </h2>

      <p className="text-gray-400 mb-8 leading-relaxed">
        Encontrá estos números en el costado de tu neumático. Aparecen en formato:
        <span className="text-[#FFC700] font-semibold"> 205/55 R16</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ancho */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <label htmlFor="width" className="block text-sm font-bold text-white mb-3">
              Ancho (mm)
            </label>
            <input
              type="number"
              id="width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="205"
              min="125"
              max="355"
              step="5"
              required
              className="w-full px-5 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FFC700] focus:border-[#FFC700] transition-all font-semibold text-lg"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">Rango: 125 - 355</p>
          </motion.div>

          {/* Perfil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <label htmlFor="profile" className="block text-sm font-bold text-white mb-3">
              Perfil (%)
            </label>
            <input
              type="number"
              id="profile"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="55"
              min="25"
              max="85"
              step="5"
              required
              className="w-full px-5 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FFC700] focus:border-[#FFC700] transition-all font-semibold text-lg"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">Rango: 25 - 85</p>
          </motion.div>

          {/* Rodado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <label htmlFor="diameter" className="block text-sm font-bold text-white mb-3">
              Rodado (pulgadas)
            </label>
            <input
              type="number"
              id="diameter"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              placeholder="16"
              min="12"
              max="24"
              step="1"
              required
              className="w-full px-5 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FFC700] focus:border-[#FFC700] transition-all font-semibold text-lg"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">Rango: 12 - 24</p>
          </motion.div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-400 mb-2">
                  Corregí los siguientes errores:
                </p>
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-400 flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="w-full flex items-center justify-center gap-3 py-5 bg-[#FFC700] hover:bg-[#FFD633] text-black font-black text-lg rounded-xl disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-6 w-6 border-3 border-black/20 border-t-black"></div>
              Buscando equivalencias...
            </>
          ) : (
            <>
              <Search className="w-6 h-6" strokeWidth={2.5} />
              Buscar Cubiertas Equivalentes
            </>
          )}
        </motion.button>
      </form>

      {/* Example */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-6 bg-gray-800 rounded-xl border border-gray-700"
      >
        <p className="text-sm font-bold text-gray-300 mb-3">
          Ejemplo de medida:
        </p>
        <div className="flex items-center gap-3 text-xl font-mono">
          <span className="font-black text-[#FFC700]">205</span>
          <span className="text-gray-500">/</span>
          <span className="font-black text-[#FFC700]">55</span>
          <span className="text-gray-500">R</span>
          <span className="font-black text-[#FFC700]">16</span>
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#FFC700] rounded-full"></div>
            <span>Ancho: 205mm</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#FFC700] rounded-full"></div>
            <span>Perfil: 55%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#FFC700] rounded-full"></div>
            <span>Rodado: 16"</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
