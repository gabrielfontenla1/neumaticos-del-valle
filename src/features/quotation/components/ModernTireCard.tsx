'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Zap, Droplets, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TireModel } from '../types';

interface ModernTireCardProps {
  tire: TireModel;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onSelect: () => void;
  isSelected?: boolean;
}

const categoryGradients = {
  'Premium': 'from-amber-500 to-yellow-600',
  'Sport': 'from-red-500 to-orange-600',
  'SUV': 'from-blue-500 to-indigo-600',
  'Económico': 'from-green-500 to-emerald-600',
  'Todo Terreno': 'from-gray-500 to-slate-600'
};

const ratingIcons = {
  fuel: Zap,
  wetGrip: Droplets,
  noise: Volume2
};

export function ModernTireCard({ tire, quantity, onQuantityChange, onSelect, isSelected }: ModernTireCardProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isHovered, setIsHovered] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= tire.stock) {
      setLocalQuantity(newQuantity);
      onQuantityChange(newQuantity);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-success';
    if (rating >= 3) return 'text-pirelli-yellow';
    return 'text-orange-500';
  };

  return (
    <motion.div
      className={cn(
        "glass-card overflow-hidden transition-all duration-300 relative group",
        isSelected && "border-pirelli-yellow shadow-lg shadow-pirelli-yellow/20"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pirelli-yellow to-yellow-600"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Category badge */}
      <div className="absolute top-4 left-4 z-10">
        <motion.div
          className={cn(
            "px-3 py-1 rounded-full text-white text-xs font-semibold bg-gradient-to-r",
            categoryGradients[tire.category]
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
        >
          {tire.category}
        </motion.div>
      </div>

      {/* Tire image/placeholder */}
      <div className="relative h-48 bg-gradient-to-b from-transparent to-black/20 flex items-center justify-center">
        {tire.image ? (
          <img 
            src={tire.image} 
            alt={tire.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <motion.div 
            className="text-6xl opacity-10"
            animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1 }}
          >
            🛞
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Name & Description */}
        <div>
          <h3 className="text-xl font-bold mb-1">{tire.name}</h3>
          <p className="text-sm text-text-secondary line-clamp-2">{tire.description}</p>
        </div>

        {/* Size badge */}
        <div className="inline-flex items-center gap-2">
          <div className="px-3 py-1 bg-black/50 rounded-lg text-sm font-mono text-pirelli-yellow">
            {tire.size}
          </div>
          {tire.stock > 0 && (
            <div className="px-2 py-1 bg-success/10 rounded-lg text-xs text-success">
              En stock
            </div>
          )}
        </div>

        {/* Performance ratings - minimalist */}
        <div className="flex items-center gap-4">
          {Object.entries(ratingIcons).map(([key, Icon]) => {
            const rating = tire.ratings[key as keyof typeof tire.ratings];
            return (
              <div key={key} className="flex items-center gap-1">
                <Icon className={cn("w-4 h-4", getRatingColor(rating))} />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 h-3 rounded-full transition-all",
                        i <= rating ? getRatingColor(rating).replace('text-', 'bg-') : "bg-glass-border"
                      )}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quantity selector - minimalist */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => handleQuantityChange(localQuantity - 1)}
              disabled={localQuantity <= 1}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                "glass-card",
                localQuantity > 1 
                  ? "hover:bg-glass-white cursor-pointer" 
                  : "opacity-30 cursor-not-allowed"
              )}
              whileHover={localQuantity > 1 ? { scale: 1.1 } : {}}
              whileTap={localQuantity > 1 ? { scale: 0.9 } : {}}
            >
              <Minus className="w-4 h-4" />
            </motion.button>
            
            <motion.div 
              className="w-12 text-center"
              key={localQuantity}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <span className="text-2xl font-bold">{localQuantity}</span>
            </motion.div>
            
            <motion.button
              onClick={() => handleQuantityChange(localQuantity + 1)}
              disabled={localQuantity >= tire.stock}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                "glass-card",
                localQuantity < tire.stock 
                  ? "hover:bg-glass-white cursor-pointer" 
                  : "opacity-30 cursor-not-allowed"
              )}
              whileHover={localQuantity < tire.stock ? { scale: 1.1 } : {}}
              whileTap={localQuantity < tire.stock ? { scale: 0.9 } : {}}
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Price */}
          <div className="text-right">
            <motion.div 
              className="text-2xl font-bold"
              key={tire.price * localQuantity}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              ${(tire.price * localQuantity).toLocaleString('es-AR')}
            </motion.div>
            <div className="text-xs text-text-secondary">
              ${tire.price.toLocaleString('es-AR')} c/u
            </div>
          </div>
        </div>

        {/* Select button - minimalist */}
        <motion.button
          onClick={onSelect}
          className={cn(
            "w-full py-3 rounded-xl font-semibold transition-all",
            isSelected 
              ? "bg-gradient-to-r from-pirelli-yellow to-yellow-600 text-black shadow-lg shadow-pirelli-yellow/20" 
              : "glass-card hover:bg-glass-white"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSelected ? 'Seleccionado' : 'Seleccionar'}
        </motion.button>
      </div>
    </motion.div>
  );
}