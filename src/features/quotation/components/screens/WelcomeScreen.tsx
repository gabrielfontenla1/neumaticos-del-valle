'use client';

import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto text-center"
    >
      {/* Logo Pirelli */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <div className="text-6xl md:text-7xl font-bold text-pirelli-yellow mb-4">
          PIRELLI
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-pirelli-yellow/10 border border-pirelli-yellow/30 rounded-full">
          <span className="text-sm font-medium text-gray-700">Distribuidor Oficial</span>
        </div>
      </motion.div>

      {/* Título */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Cotizá tus neumáticos Pirelli
        </h1>
        <p className="text-lg text-gray-600">
          En solo 2 minutos, obtené tu cotización personalizada
        </p>
      </motion.div>

      {/* Botón de inicio */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="w-full max-w-xs mx-auto py-5 px-8 bg-pirelli-yellow text-black font-bold text-lg rounded-full hover:bg-yellow-400 transition-colors shadow-lg"
      >
        Empezar →
      </motion.button>

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 flex justify-center gap-8 text-sm text-gray-500"
      >
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Sin compromiso</span>
        </div>
        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Respuesta inmediata</span>
        </div>
      </motion.div>
    </motion.div>
  );
}