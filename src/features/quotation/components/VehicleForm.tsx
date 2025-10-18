'use client';

import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from 'lucide-react';

interface VehicleFormProps {
  selectedBrand: string;
  selectedModel: string;
  selectedYear: string;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onSubmit: () => void;
  vehicleBrands: Array<{ id: string; name: string; logo: string }>;
  vehicleModels: Record<string, string[]>;
  years: string[];
}

export function VehicleForm({
  selectedBrand,
  selectedModel,
  selectedYear,
  onBrandChange,
  onModelChange,
  onYearChange,
  onSubmit,
  vehicleBrands,
  vehicleModels,
  years,
}: VehicleFormProps) {
  return (
    <div className="w-full max-w-xl grid gap-8">
      {/* Title Section - Perfectly Centered */}
      <div className="text-center grid gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Seleccioná tu Vehículo
        </h1>
        <p className="text-white/70 text-base sm:text-lg">
          Elige tu vehículo para encontrar los neumáticos Pirelli perfectos
        </p>
      </div>

      {/* Form Container with Grid */}
      <div className="bg-[#1a1a1a]/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10 grid gap-6">
        {/* Brand Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50">
            Marca
          </label>
          <Select value={selectedBrand} onValueChange={onBrandChange}>
            <SelectTrigger className="w-full h-14 bg-white/5 border border-white/10 text-white hover:bg-white/10 focus:border-pirelli-yellow focus:ring-1 focus:ring-pirelli-yellow/50 transition-all rounded-lg font-medium">
              <SelectValue placeholder="Seleccioná una marca" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20">
              <SelectGroup>
                {vehicleBrands.map((brand) => (
                  <SelectItem 
                    key={brand.id} 
                    value={brand.name}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{brand.logo}</span>
                      {brand.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Model Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`space-y-2 ${selectedBrand ? '' : 'opacity-40 pointer-events-none'}`}
        >
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50">
            Modelo
          </label>
          <Select 
            value={selectedModel} 
            onValueChange={onModelChange}
            disabled={!selectedBrand}
          >
            <SelectTrigger className="w-full h-14 bg-white/5 border border-white/10 text-white hover:bg-white/10 focus:border-pirelli-yellow focus:ring-1 focus:ring-pirelli-yellow/50 transition-all rounded-lg font-medium disabled:opacity-50">
              <SelectValue placeholder="Primero seleccioná una marca" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20">
              <SelectGroup>
                {selectedBrand && vehicleModels[selectedBrand]?.map((model) => (
                  <SelectItem 
                    key={model} 
                    value={model}
                  >
                    {model}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Year Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`space-y-2 ${selectedModel ? '' : 'opacity-40 pointer-events-none'}`}
        >
          <label className="block text-xs font-medium uppercase tracking-wider text-white/50">
            Año
          </label>
          <Select 
            value={selectedYear} 
            onValueChange={onYearChange}
            disabled={!selectedModel}
          >
            <SelectTrigger className="w-full h-14 bg-white/5 border border-white/10 text-white hover:bg-white/10 focus:border-pirelli-yellow focus:ring-1 focus:ring-pirelli-yellow/50 transition-all rounded-lg font-medium disabled:opacity-50">
              <SelectValue placeholder="Primero seleccioná un modelo" />
            </SelectTrigger>
            <SelectContent className="bg-black border-white/20 max-h-[200px]">
              <SelectGroup>
                {selectedModel && years.map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* Continue Button */}
      {selectedBrand && selectedModel && selectedYear && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="pt-6"
        >
          <button
            onClick={onSubmit}
            className="w-full px-6 py-4 bg-pirelli-yellow hover:bg-yellow-500 text-black font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-pirelli-yellow/20 hover:shadow-xl hover:shadow-pirelli-yellow/30"
          >
            <span className="text-base">Continuar</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}