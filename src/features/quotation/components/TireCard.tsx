'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Fuel, Droplets, Volume2, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TireModel } from '../types';

interface TireCardProps {
  tire: TireModel;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onSelect: () => void;
  isSelected?: boolean;
}

const categoryColors = {
  'Premium': 'bg-gradient-to-r from-yellow-600 to-yellow-500',
  'Sport': 'bg-gradient-to-r from-red-600 to-red-500',
  'SUV': 'bg-gradient-to-r from-blue-600 to-blue-500',
  'Económico': 'bg-gradient-to-r from-green-600 to-green-500',
  'Todo Terreno': 'bg-gradient-to-r from-gray-600 to-gray-500'
};

const ratingLabels = {
  fuel: { icon: Fuel, label: 'Combustible' },
  wetGrip: { icon: Droplets, label: 'Mojado' },
  noise: { icon: Volume2, label: 'Ruido' }
};

function getRatingLetter(rating: number): string {
  if (rating >= 4) return 'A';
  if (rating >= 3) return 'B';
  return 'C';
}

export function TireCard({ tire, quantity, onQuantityChange, onSelect, isSelected }: TireCardProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= tire.stock) {
      setLocalQuantity(newQuantity);
      onQuantityChange(newQuantity);
    }
  };

  return (
    <motion.div
      className={cn(
        "bg-dark-gray border rounded-lg overflow-hidden transition-all duration-300",
        isSelected ? "border-pirelli-yellow shadow-lg shadow-pirelli-yellow/20" : "border-light-gray",
        "hover:border-pirelli-yellow/50"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      {/* Category Badge */}
      <div className="relative">
        <div className={cn(
          "absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-white text-xs font-semibold",
          categoryColors[tire.category]
        )}>
          {tire.category}
        </div>
        
        {/* Tire Image */}
        {tire.image ? (
          <img 
            src={tire.image} 
            alt={tire.name}
            className="w-full h-48 object-contain bg-black/50"
          />
        ) : (
          <div className="w-full h-48 bg-black/50 flex items-center justify-center">
            <div className="text-6xl opacity-20">🛞</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Name & Description */}
        <div>
          <h3 className="text-lg font-bold text-white">{tire.name}</h3>
          <p className="text-sm text-muted mt-1">{tire.description}</p>
        </div>

        {/* Size */}
        <div className="inline-block px-3 py-1 bg-black rounded text-sm text-pirelli-yellow font-mono">
          {tire.size}
        </div>

        {/* Performance Ratings */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ratingLabels).map(([key, { icon: Icon, label }]) => {
            const rating = tire.ratings[key as keyof typeof tire.ratings];
            const letter = getRatingLetter(rating);
            
            return (
              <div key={key} className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <Icon className="w-4 h-4 text-muted" />
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    letter === 'A' && "bg-green-500/20 text-green-500",
                    letter === 'B' && "bg-yellow-500/20 text-yellow-500",
                    letter === 'C' && "bg-orange-500/20 text-orange-500"
                  )}>
                    {letter}
                  </div>
                  <span className="text-xs text-muted">{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={localQuantity <= 1}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                "bg-black border border-light-gray",
                localQuantity > 1 
                  ? "hover:border-pirelli-yellow hover:bg-pirelli-yellow/10 cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            
            <div className="w-12 text-center">
              <span className="text-lg font-bold text-white">{localQuantity}</span>
            </div>
            
            <button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={localQuantity >= tire.stock}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                "bg-black border border-light-gray",
                localQuantity < tire.stock 
                  ? "hover:border-pirelli-yellow hover:bg-pirelli-yellow/10 cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
          
          {/* Stock indicator */}
          <div className="flex items-center gap-1 text-xs">
            {tire.stock > 0 ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-green-500">En stock</span>
              </>
            ) : (
              <span className="text-red-500">Sin stock</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="border-t border-light-gray pt-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                ${(tire.price * localQuantity).toLocaleString('es-AR')}
              </div>
              <div className="text-xs text-muted">
                ${tire.price.toLocaleString('es-AR')} por unidad
              </div>
            </div>
            
            {/* Select button */}
            <motion.button
              onClick={onSelect}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all",
                isSelected 
                  ? "bg-pirelli-yellow text-black" 
                  : "bg-black border border-pirelli-yellow text-pirelli-yellow hover:bg-pirelli-yellow hover:text-black"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSelected ? 'Seleccionado' : 'Seleccionar'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}