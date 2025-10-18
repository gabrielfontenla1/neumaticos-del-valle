'use client';

import { motion } from 'framer-motion';
import { vehicleBrands } from '../../api';

interface BrandScreenProps {
  onSelect: (brand: string) => void;
}

export function BrandScreen({ onSelect }: BrandScreenProps) {
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
          ¿Cuál es la marca de tu vehículo?
        </h2>
        <p className="text-gray-600">
          Seleccioná la marca para continuar
        </p>
      </motion.div>

      {/* Lista de marcas */}
      <motion.div className="space-y-3">
        {vehicleBrands.map((brand, index) => (
          <motion.button
            key={brand}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(brand)}
            className="w-full p-5 text-left bg-white border-2 border-gray-200 rounded-2xl hover:border-pirelli-yellow hover:bg-pirelli-yellow/5 transition-all shadow-sm hover:shadow-md"
          >
            <span className="text-lg font-medium text-gray-900">{brand}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Indicador de teclado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        Presioná <kbd className="px-2 py-1 bg-gray-100 rounded">↑</kbd> <kbd className="px-2 py-1 bg-gray-100 rounded">↓</kbd> para navegar
      </motion.div>
    </motion.div>
  );
}