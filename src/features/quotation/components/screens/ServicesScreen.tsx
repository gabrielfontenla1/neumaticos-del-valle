'use client';

import { motion } from 'framer-motion';
import { Service } from '../../types';
import { formatCurrency } from '../../api';

interface ServicesScreenProps {
  services: Service[];
  currentIndex: number;
  onToggle: (serviceId: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function ServicesScreen({ 
  services, 
  currentIndex, 
  onToggle, 
  onNext, 
  onSkip 
}: ServicesScreenProps) {
  const currentService = services[currentIndex];
  const isLastService = currentIndex === services.length - 1;

  const handleResponse = (accept: boolean) => {
    if (accept) {
      onToggle(currentService.id);
    }
    onNext();
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
          ¿Querés agregar servicios adicionales?
        </h2>
        <p className="text-gray-600">
          Servicio {currentIndex + 1} de {services.length}
        </p>
      </motion.div>

      {/* Tarjeta de servicio */}
      <motion.div
        key={currentService.id}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-lg mb-6"
      >
        {/* Icono y nombre */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{currentService.icon}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {currentService.name}
          </h3>
          <p className="text-gray-600">
            {currentService.description}
          </p>
        </div>

        {/* Precio */}
        <div className="bg-pirelli-yellow/10 rounded-2xl p-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentService.price)}
            </p>
            <p className="text-sm text-gray-600">
              {currentService.priceType === 'per-tire' ? 'por neumático' : 'precio único'}
            </p>
          </div>
        </div>

        {/* Estado actual */}
        {currentService.selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center gap-2 mb-4 text-green-600"
          >
            <span className="text-2xl">✓</span>
            <span className="font-medium">Servicio agregado</span>
          </motion.div>
        )}
      </motion.div>

      {/* Botones de acción */}
      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleResponse(true)}
          className={`w-full py-4 font-bold text-lg rounded-2xl transition-all ${
            currentService.selected
              ? 'bg-gray-200 text-gray-600'
              : 'bg-pirelli-yellow text-black hover:bg-yellow-400'
          }`}
        >
          {currentService.selected ? 'Ya agregado' : 'Sí, agregar servicio'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleResponse(false)}
          className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold text-lg rounded-2xl hover:border-gray-300 transition-all"
        >
          No, gracias
        </motion.button>
      </div>

      {/* Botón saltar todos */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onSkip}
        className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
      >
        Saltar todos los servicios →
      </motion.button>
    </motion.div>
  );
}