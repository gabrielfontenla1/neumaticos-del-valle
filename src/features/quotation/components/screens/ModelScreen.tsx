'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { vehicleModels } from '../../api';

interface ModelScreenProps {
  brand: string;
  onSelect: (model: string) => void;
}

export function ModelScreen({ brand, onSelect }: ModelScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const models = vehicleModels[brand] || [];
  
  const filteredModels = models.filter(model =>
    model.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          ¿Qué modelo de {brand} tenés?
        </h2>
        <p className="text-gray-600">
          Elegí tu modelo de la lista
        </p>
      </motion.div>

      {/* Buscador */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative mb-6"
      >
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-pirelli-yellow focus:outline-none transition-colors"
          autoFocus
        />
      </motion.div>

      {/* Lista de modelos */}
      <motion.div className="space-y-3 max-h-[400px] overflow-y-auto">
        {filteredModels.length > 0 ? (
          filteredModels.map((model, index) => (
            <motion.button
              key={model}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(model)}
              className="w-full p-5 text-left bg-white border-2 border-gray-200 rounded-2xl hover:border-pirelli-yellow hover:bg-pirelli-yellow/5 transition-all shadow-sm hover:shadow-md"
            >
              <span className="text-lg font-medium text-gray-900">{model}</span>
            </motion.button>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            No se encontraron modelos
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}