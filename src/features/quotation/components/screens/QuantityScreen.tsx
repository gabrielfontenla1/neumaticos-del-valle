'use client';

import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

interface QuantityScreenProps {
  currentQuantity: number;
  onSelect: (quantity: number) => void;
}

export function QuantityScreen({ currentQuantity, onSelect }: QuantityScreenProps) {
  const handleQuickSelect = (quantity: number) => {
    onSelect(quantity);
  };

  const handleCustomQuantity = (quantity: number) => {
    if (quantity >= 1 && quantity <= 20) {
      onSelect(quantity);
    }
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
        className="text-center mb-10"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          ¿Cuántos neumáticos necesitás?
        </h2>
        <p className="text-gray-600">
          Lo más común es cambiar 2 o 4 neumáticos
        </p>
      </motion.div>

      {/* Opciones rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickSelect(2)}
          className="p-8 bg-white border-2 border-gray-200 rounded-3xl hover:border-pirelli-yellow hover:bg-pirelli-yellow/5 transition-all shadow-sm hover:shadow-md"
        >
          <div className="text-4xl font-bold text-gray-900 mb-2">2</div>
          <div className="text-sm text-gray-600">Eje delantero o trasero</div>
        </motion.button>

        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleQuickSelect(4)}
          className="p-8 bg-white border-2 border-gray-200 rounded-3xl hover:border-pirelli-yellow hover:bg-pirelli-yellow/5 transition-all shadow-sm hover:shadow-md relative"
        >
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Recomendado
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">4</div>
          <div className="text-sm text-gray-600">Juego completo</div>
        </motion.button>
      </div>

      {/* Selector personalizado */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 rounded-3xl p-6"
      >
        <p className="text-center text-sm text-gray-600 mb-4">O elegí una cantidad personalizada</p>
        
        <div className="flex items-center justify-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCustomQuantity(currentQuantity - 1)}
            disabled={currentQuantity <= 1}
            className="p-3 bg-white rounded-full border-2 border-gray-200 hover:border-pirelli-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Minus className="w-5 h-5 text-gray-600" />
          </motion.button>

          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-1">{currentQuantity}</div>
            <div className="text-xs text-gray-500">neumáticos</div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleCustomQuantity(currentQuantity + 1)}
            disabled={currentQuantity >= 20}
            className="p-3 bg-white rounded-full border-2 border-gray-200 hover:border-pirelli-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(currentQuantity)}
          className="w-full mt-6 py-4 bg-pirelli-yellow text-black font-bold text-lg rounded-2xl hover:bg-yellow-400 transition-colors"
        >
          Continuar con {currentQuantity} neumático{currentQuantity !== 1 ? 's' : ''}
        </motion.button>
      </motion.div>

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-4"
      >
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Cambiar los 4 neumáticos juntos mejora la estabilidad y el rendimiento del vehículo
        </p>
      </motion.div>
    </motion.div>
  );
}