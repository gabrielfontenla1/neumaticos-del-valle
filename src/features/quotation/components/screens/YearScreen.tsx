'use client';

import { motion } from 'framer-motion';
import { vehicleYears } from '../../api';

interface YearScreenProps {
  brand: string;
  model: string;
  onSelect: (year: number) => void;
}

export function YearScreen({ brand, model, onSelect }: YearScreenProps) {
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
          ¿De qué año es tu {brand} {model}?
        </h2>
        <p className="text-gray-600">
          Seleccioná el año de fabricación
        </p>
      </motion.div>

      {/* Grid de años */}
      <motion.div className="grid grid-cols-3 gap-3">
        {vehicleYears.map((year, index) => (
          <motion.button
            key={year}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(year)}
            className="p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-pirelli-yellow hover:bg-pirelli-yellow/5 transition-all shadow-sm hover:shadow-md"
          >
            <span className="text-lg font-medium text-gray-900">{year}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        💡 El año nos ayuda a recomendarte los neumáticos más adecuados
      </motion.div>
    </motion.div>
  );
}