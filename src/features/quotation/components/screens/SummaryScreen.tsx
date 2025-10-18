'use client';

import { motion } from 'framer-motion';
import { Edit2 } from 'lucide-react';
import { Vehicle, SelectedTire, Service } from '../../types';
import { formatCurrency } from '../../api';

interface SummaryScreenProps {
  vehicle: Vehicle;
  tire: SelectedTire;
  services: Service[];
  contact: {
    fullName: string;
    email: string;
    phone: string;
  };
  total: number;
  servicesTotal: number;
  onConfirm: () => void;
  onEdit: (section: 'vehicle' | 'tire' | 'services' | 'contact') => void;
  isLoading: boolean;
}

export function SummaryScreen({
  vehicle,
  tire,
  services,
  contact,
  total,
  servicesTotal,
  onConfirm,
  onEdit,
  isLoading
}: SummaryScreenProps) {
  const selectedServices = services.filter(s => s.selected);
  const tireSubtotal = tire.price * tire.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      {/* Título */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Tu cotización
        </h2>
        <p className="text-gray-600">
          Revisá que todo esté correcto
        </p>
      </motion.div>

      {/* Resumen de cotización */}
      <div className="space-y-4">
        {/* Vehículo */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-2xl p-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Vehículo</p>
              <p className="font-semibold text-gray-900">
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </p>
            </div>
            <button
              onClick={() => onEdit('vehicle')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Neumáticos */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-2xl p-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Neumáticos</p>
              <p className="font-semibold text-gray-900">{tire.name}</p>
              <p className="text-sm text-gray-600">
                {tire.quantity} x {formatCurrency(tire.price)} = {formatCurrency(tireSubtotal)}
              </p>
            </div>
            <button
              onClick={() => onEdit('tire')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Servicios */}
        {selectedServices.length > 0 && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">Servicios adicionales</p>
                {selectedServices.map(service => (
                  <div key={service.id} className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{service.name}</span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(
                        service.priceType === 'per-tire' 
                          ? service.price * tire.quantity 
                          : service.price
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onEdit('services')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              >
                <Edit2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Contacto */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-gray-200 rounded-2xl p-4"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2">Datos de contacto</p>
              <p className="text-sm text-gray-700">{contact.fullName}</p>
              <p className="text-sm text-gray-700">{contact.email}</p>
              <p className="text-sm text-gray-700">{contact.phone}</p>
            </div>
            <button
              onClick={() => onEdit('contact')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Total */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-pirelli-yellow/10 border-2 border-pirelli-yellow/30 rounded-2xl p-4"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(total)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">IVA incluido</p>
              <p className="text-xs text-gray-500">Válido por 7 días</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Botón confirmar */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onConfirm}
        disabled={isLoading}
        className="w-full mt-6 py-5 bg-pirelli-yellow text-black font-bold text-lg rounded-2xl hover:bg-yellow-400 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⚙️</span>
            Procesando...
          </span>
        ) : (
          'Confirmar cotización'
        )}
      </motion.button>

      {/* Texto legal */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-xs text-center text-gray-500"
      >
        Al confirmar, aceptás recibir información sobre tu cotización
      </motion.p>
    </motion.div>
  );
}