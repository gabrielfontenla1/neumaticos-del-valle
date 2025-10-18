'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ContactScreenProps {
  field: 'name' | 'email' | 'phone';
  value: string;
  onSubmit: (value: string) => void;
}

export function ContactScreen({ field, value, onSubmit }: ContactScreenProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState('');

  const getFieldConfig = () => {
    switch (field) {
      case 'name':
        return {
          title: '¿Cómo te llamás?',
          subtitle: 'Necesitamos tu nombre para la cotización',
          placeholder: 'Tu nombre completo',
          type: 'text',
          icon: '👤',
          validation: (val: string) => val.length >= 2 ? '' : 'Por favor, ingresá tu nombre'
        };
      case 'email':
        return {
          title: '¿Cuál es tu email?',
          subtitle: 'Te enviaremos la cotización por correo',
          placeholder: 'tu@email.com',
          type: 'email',
          icon: '✉️',
          validation: (val: string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(val) ? '' : 'Por favor, ingresá un email válido';
          }
        };
      case 'phone':
        return {
          title: '¿Cuál es tu teléfono?',
          subtitle: 'Para contactarte por la cotización',
          placeholder: '11 1234-5678',
          type: 'tel',
          icon: '📱',
          validation: (val: string) => val.length >= 8 ? '' : 'Por favor, ingresá un teléfono válido'
        };
      default:
        return {
          title: '',
          subtitle: '',
          placeholder: '',
          type: 'text',
          icon: '',
          validation: () => ''
        };
    }
  };

  const config = getFieldConfig();

  const handleSubmit = () => {
    const validationError = config.validation(inputValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
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
        <div className="text-5xl mb-4">{config.icon}</div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          {config.title}
        </h2>
        <p className="text-gray-600">
          {config.subtitle}
        </p>
      </motion.div>

      {/* Campo de entrada */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <input
          type={config.type}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          placeholder={config.placeholder}
          className={`w-full px-6 py-5 text-lg border-2 rounded-2xl focus:outline-none transition-all ${
            error 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-gray-200 focus:border-pirelli-yellow'
          }`}
          autoFocus
        />
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-red-500 text-sm"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Botón continuar */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className="w-full py-5 bg-pirelli-yellow text-black font-bold text-lg rounded-2xl hover:bg-yellow-400 transition-colors shadow-lg"
      >
        Continuar →
      </motion.button>

      {/* Indicador de teclado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center text-sm text-gray-500"
      >
        Presioná <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> para continuar
      </motion.div>

      {/* Privacidad */}
      {field === 'email' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-xs text-gray-400"
        >
          🔒 Tu información está segura y no será compartida
        </motion.div>
      )}
    </motion.div>
  );
}