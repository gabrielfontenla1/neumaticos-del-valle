'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Car, Calendar, Tag } from 'lucide-react';
import { Vehicle } from '../types';
import { vehicleBrands, vehicleModels, vehicleYears } from '../api';

interface VehicleSelectionProps {
  onVehicleSelect: (vehicle: Vehicle) => void;
  onNext: () => void;
  initialVehicle?: Vehicle | null;
}

export function VehicleSelection({ onVehicleSelect, onNext, initialVehicle }: VehicleSelectionProps) {
  const [brand, setBrand] = useState(initialVehicle?.brand || '');
  const [model, setModel] = useState(initialVehicle?.model || '');
  const [year, setYear] = useState(initialVehicle?.year || 0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand);
    setModel(''); // Reset model when brand changes
    setYear(0); // Reset year
    setOpenDropdown(null);
  };

  const handleModelSelect = (selectedModel: string) => {
    setModel(selectedModel);
    setYear(0); // Reset year
    setOpenDropdown(null);
  };

  const handleYearSelect = (selectedYear: number) => {
    setYear(selectedYear);
    setOpenDropdown(null);
    
    // Auto-select vehicle when all fields are filled
    if (brand && model && selectedYear) {
      onVehicleSelect({ brand, model, year: selectedYear });
    }
  };

  const isComplete = brand && model && year;

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Select Your Vehicle</h2>
        <p className="text-muted">Choose your vehicle to find compatible Pirelli tires</p>
      </div>

      <div className="space-y-4">
        {/* Brand Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4 text-pirelli-yellow" />
            Brand
          </label>
          <button
            onClick={() => toggleDropdown('brand')}
            className={`
              w-full px-4 py-3 rounded-lg bg-card-bg border-2 text-left
              flex items-center justify-between transition-all
              ${brand 
                ? 'border-pirelli-yellow text-foreground' 
                : 'border-card-border text-muted hover:border-pirelli-yellow/50'
              }
            `}
          >
            <span>{brand || 'Select a brand'}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === 'brand' ? 'rotate-180' : ''}`} />
          </button>
          
          {openDropdown === 'brand' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 w-full mt-2 bg-card-bg border-2 border-card-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {vehicleBrands.map((b) => (
                <button
                  key={b}
                  onClick={() => handleBrandSelect(b)}
                  className="w-full px-4 py-3 text-left hover:bg-pirelli-yellow/10 hover:text-pirelli-yellow transition-colors"
                >
                  {b}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Model Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Car className="w-4 h-4 text-pirelli-yellow" />
            Model
          </label>
          <button
            onClick={() => brand && toggleDropdown('model')}
            disabled={!brand}
            className={`
              w-full px-4 py-3 rounded-lg bg-card-bg border-2 text-left
              flex items-center justify-between transition-all
              ${!brand 
                ? 'border-card-border text-muted cursor-not-allowed opacity-50'
                : model
                ? 'border-pirelli-yellow text-foreground' 
                : 'border-card-border text-muted hover:border-pirelli-yellow/50'
              }
            `}
          >
            <span>{model || 'Select a model'}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === 'model' ? 'rotate-180' : ''}`} />
          </button>
          
          {openDropdown === 'model' && brand && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 w-full mt-2 bg-card-bg border-2 border-card-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {vehicleModels[brand]?.map((m) => (
                <button
                  key={m}
                  onClick={() => handleModelSelect(m)}
                  className="w-full px-4 py-3 text-left hover:bg-pirelli-yellow/10 hover:text-pirelli-yellow transition-colors"
                >
                  {m}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Year Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pirelli-yellow" />
            Year
          </label>
          <button
            onClick={() => model && toggleDropdown('year')}
            disabled={!model}
            className={`
              w-full px-4 py-3 rounded-lg bg-card-bg border-2 text-left
              flex items-center justify-between transition-all
              ${!model 
                ? 'border-card-border text-muted cursor-not-allowed opacity-50'
                : year
                ? 'border-pirelli-yellow text-foreground' 
                : 'border-card-border text-muted hover:border-pirelli-yellow/50'
              }
            `}
          >
            <span>{year || 'Select a year'}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === 'year' ? 'rotate-180' : ''}`} />
          </button>
          
          {openDropdown === 'year' && model && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute z-20 w-full mt-2 bg-card-bg border-2 border-card-border rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {vehicleYears.map((y) => (
                <button
                  key={y}
                  onClick={() => handleYearSelect(y)}
                  className="w-full px-4 py-3 text-left hover:bg-pirelli-yellow/10 hover:text-pirelli-yellow transition-colors"
                >
                  {y}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Selected Vehicle Summary */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-pirelli-yellow/10 border border-pirelli-yellow/30 rounded-lg"
        >
          <p className="text-sm text-muted mb-1">Selected Vehicle:</p>
          <p className="text-lg font-semibold text-pirelli-yellow">
            {year} {brand} {model}
          </p>
        </motion.div>
      )}

      {/* Continue Button */}
      <motion.button
        onClick={onNext}
        disabled={!isComplete}
        whileHover={isComplete ? { scale: 1.02 } : {}}
        whileTap={isComplete ? { scale: 0.98 } : {}}
        className={`
          w-full mt-8 py-4 rounded-lg font-semibold text-lg transition-all
          ${isComplete
            ? 'bg-pirelli-yellow text-black hover:bg-pirelli-yellow/90 shadow-lg shadow-pirelli-yellow/30'
            : 'bg-card-border text-muted cursor-not-allowed'
          }
        `}
      >
        Continue to Tire Selection
      </motion.button>
    </motion.div>
  );
}