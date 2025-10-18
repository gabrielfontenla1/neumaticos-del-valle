'use client';

import { motion } from 'framer-motion';
import { Check, Download, MessageCircle } from 'lucide-react';

interface SuccessScreenProps {
  quotationId: string;
  onNewQuote: () => void;
}

export function SuccessScreen({ quotationId, onNewQuote }: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto text-center"
    >
      {/* Checkmark animado */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          delay: 0.2, 
          type: "spring", 
          stiffness: 200,
          damping: 15
        }}
        className="w-24 h-24 mx-auto mb-8 bg-green-100 rounded-full flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Mensaje de éxito */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Listo! Te contactaremos pronto
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          Tu cotización fue enviada exitosamente
        </p>
        <p className="text-sm text-gray-500">
          Un asesor se pondrá en contacto en las próximas 24 horas
        </p>
      </motion.div>

      {/* Número de referencia */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-50 rounded-2xl p-6 mb-8"
      >
        <p className="text-sm text-gray-500 mb-2">Número de cotización</p>
        <p className="text-2xl font-bold text-gray-900 font-mono">{quotationId}</p>
        <p className="text-xs text-gray-500 mt-2">Guardá este número para tu referencia</p>
      </motion.div>

      {/* Acciones */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <button className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold text-lg rounded-2xl hover:border-gray-300 transition-all flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          Descargar cotización PDF
        </button>

        <button className="w-full py-4 bg-green-50 border-2 border-green-200 text-green-700 font-bold text-lg rounded-2xl hover:bg-green-100 transition-all flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Contactar por WhatsApp
        </button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewQuote}
          className="w-full py-4 bg-pirelli-yellow text-black font-bold text-lg rounded-2xl hover:bg-yellow-400 transition-colors shadow-lg"
        >
          Nueva cotización
        </motion.button>
      </motion.div>

      {/* Info adicional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex justify-center gap-6 text-sm text-gray-500"
      >
        <div className="flex items-center gap-2">
          <span>📧</span>
          <span>Email enviado</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📱</span>
          <span>SMS enviado</span>
        </div>
      </motion.div>

      {/* Contacto directo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 p-4 bg-blue-50 rounded-2xl"
      >
        <p className="text-sm text-blue-800">
          ¿Necesitás ayuda inmediata? Llamanos al <strong>0800-555-7473</strong>
        </p>
      </motion.div>
    </motion.div>
  );
}