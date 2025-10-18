'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Fuel, Droplets, Volume2, Plus, Minus, Package } from 'lucide-react';
import { TireModel, SelectedTire } from '../types';
import { formatCurrency } from '../api';

interface TireSelectionProps {
  tires: TireModel[];
  selectedTire: SelectedTire | null;
  onTireSelect: (tire: TireModel, quantity: number) => void;
  onQuantityChange: (quantity: number) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function TireSelection({ 
  tires, 
  selectedTire, 
  onTireSelect, 
  onQuantityChange, 
  onNext, 
  onBack,
  isLoading 
}: TireSelectionProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    tires.reduce((acc, tire) => ({ ...acc, [tire.id]: 4 }), {})
  );

  const handleQuantityChange = (tireId: string, delta: number) => {
    const newQuantity = Math.max(1, Math.min(quantities[tireId] + delta, 20));
    setQuantities(prev => ({ ...prev, [tireId]: newQuantity }));
    
    if (selectedTire?.id === tireId) {
      onQuantityChange(newQuantity);
    }
  };

  const handleTireSelect = (tire: TireModel) => {
    onTireSelect(tire, quantities[tire.id]);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Premium': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      case 'Sport': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'SUV': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'Economic': return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'All-Terrain': return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const renderRating = (value: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-2 h-2 rounded-full ${
              star <= value ? 'bg-pirelli-yellow' : 'bg-card-border'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pirelli-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading compatible tires...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="text-4xl font-bold text-pirelli-yellow">PIRELLI</div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Select Your Pirelli Tires</h2>
        <p className="text-muted">Choose from our premium selection of tires for your vehicle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tires.map((tire) => {
          const isSelected = selectedTire?.id === tire.id;
          const quantity = quantities[tire.id];
          
          return (
            <motion.div
              key={tire.id}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative bg-card-bg border-2 rounded-xl overflow-hidden cursor-pointer
                transition-all duration-300
                ${isSelected 
                  ? 'border-pirelli-yellow shadow-lg shadow-pirelli-yellow/20' 
                  : 'border-card-border hover:border-pirelli-yellow/50'
                }
              `}
              onClick={() => handleTireSelect(tire)}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-10 bg-pirelli-yellow text-black p-2 rounded-full">
                  <Check className="w-5 h-5" />
                </div>
              )}

              {/* Tire Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-card-border to-background flex items-center justify-center">
                <div className="text-6xl opacity-20">🛞</div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{tire.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(tire.category)}`}>
                      {tire.category}
                    </span>
                    <span className="text-sm text-muted">{tire.size}</span>
                  </div>
                  <p className="text-sm text-muted">{tire.description}</p>
                </div>

                {/* Ratings */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-muted" />
                      <span className="text-xs text-muted">Fuel</span>
                    </div>
                    {renderRating(tire.ratings.fuel)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-muted" />
                      <span className="text-xs text-muted">Wet Grip</span>
                    </div>
                    {renderRating(tire.ratings.wetGrip)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-muted" />
                      <span className="text-xs text-muted">Noise</span>
                    </div>
                    {renderRating(tire.ratings.noise)}
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(tire.id, -1);
                      }}
                      className="w-8 h-8 rounded-lg bg-card-border hover:bg-pirelli-yellow/20 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuantityChange(tire.id, 1);
                      }}
                      className="w-8 h-8 rounded-lg bg-card-border hover:bg-pirelli-yellow/20 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price and Stock */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-pirelli-yellow">
                      {formatCurrency(tire.price)}
                    </p>
                    <p className="text-xs text-muted">per tire</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Package className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">{tire.stock} available</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-lg font-semibold text-lg bg-card-bg border-2 border-card-border hover:border-pirelli-yellow/50 transition-all"
        >
          Back
        </button>
        <motion.button
          onClick={onNext}
          disabled={!selectedTire}
          whileHover={selectedTire ? { scale: 1.02 } : {}}
          whileTap={selectedTire ? { scale: 0.98 } : {}}
          className={`
            flex-1 py-4 rounded-lg font-semibold text-lg transition-all
            ${selectedTire
              ? 'bg-pirelli-yellow text-black hover:bg-pirelli-yellow/90 shadow-lg shadow-pirelli-yellow/30'
              : 'bg-card-border text-muted cursor-not-allowed'
            }
          `}
        >
          Continue to Services
        </motion.button>
      </div>
    </motion.div>
  );
}