'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Fuel, Droplets, Volume2 } from 'lucide-react';
import { TireModel, SelectedTire } from '../../types';
import { formatCurrency } from '../../api';

interface TireScreenProps {
  tires: TireModel[];
  selectedTire: SelectedTire | null;
  onSelect: (tire: TireModel) => void;
  isLoading: boolean;
}

export function TireScreen({ tires, selectedTire, onSelect, isLoading }: TireScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md mx-auto text-center"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg mb-4 mx-auto w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded-lg mx-auto w-1/2"></div>
        </div>
        <p className="mt-8 text-gray-600">Buscando los mejores neumáticos para tu vehículo...</p>
      </motion.div>
    );
  }

  const currentTire = tires[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tires.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + tires.length) % tires.length);
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Pregunta */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Elegí tus neumáticos Pirelli
        </h2>
        <p className="text-gray-600">
          {currentIndex + 1} de {tires.length} opciones disponibles
        </p>
      </motion.div>

      {/* Tarjeta de neumático */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTire.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-lg"
        >
          {/* Categoría badge */}
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-pirelli-yellow/20 text-pirelli-yellow text-sm font-medium rounded-full">
              {currentTire.category}
            </span>
            {currentTire.stock <= 5 && (
              <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
                ¡Últimas {currentTire.stock} unidades!
              </span>
            )}
          </div>

          {/* Nombre y precio */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentTire.name}</h3>
            <p className="text-3xl font-bold text-pirelli-yellow">
              {formatCurrency(currentTire.price)}
            </p>
            <p className="text-sm text-gray-500">por neumático</p>
          </div>

          {/* Descripción */}
          <p className="text-gray-600 mb-6">{currentTire.description}</p>

          {/* Medida */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Medida</p>
            <p className="text-lg font-semibold text-gray-900">{currentTire.size}</p>
          </div>

          {/* Ratings */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Eficiencia</span>
              </div>
              <span className="text-pirelli-yellow font-medium">
                {getRatingStars(currentTire.ratings.fuel)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Agarre mojado</span>
              </div>
              <span className="text-pirelli-yellow font-medium">
                {getRatingStars(currentTire.ratings.wetGrip)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Ruido</span>
              </div>
              <span className="text-pirelli-yellow font-medium">
                {getRatingStars(currentTire.ratings.noise)}
              </span>
            </div>
          </div>

          {/* Botón seleccionar */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(currentTire)}
            className="w-full py-4 bg-pirelli-yellow text-black font-bold text-lg rounded-2xl hover:bg-yellow-400 transition-colors"
          >
            Seleccionar este neumático
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Controles de navegación */}
      <div className="flex justify-between items-center mt-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrevious}
          className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </motion.button>

        {/* Indicadores */}
        <div className="flex gap-2">
          {tires.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-8 bg-pirelli-yellow' 
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNext}
          className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </motion.button>
      </div>

      {/* Tip de navegación */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-sm text-gray-500"
      >
        Deslizá o usá las flechas para ver más opciones
      </motion.div>
    </motion.div>
  );
}