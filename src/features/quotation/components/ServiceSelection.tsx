'use client';

import { motion } from 'framer-motion';
import { Check, MapPin } from 'lucide-react';
import { Service } from '../types';
import { formatCurrency } from '../api';

interface ServiceSelectionProps {
  services: Service[];
  deliveryAddress?: string;
  tireQuantity: number;
  onServiceToggle: (serviceId: string) => void;
  onDeliveryAddressChange: (address: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ServiceSelection({
  services,
  deliveryAddress = '',
  tireQuantity,
  onServiceToggle,
  onDeliveryAddressChange,
  onNext,
  onBack
}: ServiceSelectionProps) {
  const deliveryService = services.find(s => s.id === 'delivery');
  const isDeliverySelected = deliveryService?.selected || false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Additional Services</h2>
        <p className="text-muted">Enhance your purchase with our professional services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {services.map((service) => {
          const isSelected = service.selected;
          const price = service.priceType === 'per-tire' 
            ? service.price * tireQuantity 
            : service.price;
          
          return (
            <motion.div
              key={service.id}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onServiceToggle(service.id)}
              className={`
                relative bg-card-bg border-2 rounded-xl p-6 cursor-pointer
                transition-all duration-300
                ${isSelected 
                  ? 'border-pirelli-yellow shadow-lg shadow-pirelli-yellow/20' 
                  : 'border-card-border hover:border-pirelli-yellow/50'
                }
              `}
            >
              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 bg-pirelli-yellow text-black p-1.5 rounded-full">
                  <Check className="w-4 h-4" />
                </div>
              )}

              {/* Icon */}
              <div className="text-4xl mb-4">{service.icon}</div>

              {/* Content */}
              <h3 className="text-lg font-bold mb-2">{service.name}</h3>
              <p className="text-sm text-muted mb-4">{service.description}</p>

              {/* Price */}
              <div className="pt-4 border-t border-card-border">
                <p className="text-xl font-bold text-pirelli-yellow">
                  +{formatCurrency(price)}
                </p>
                <p className="text-xs text-muted">
                  {service.priceType === 'per-tire' 
                    ? `${formatCurrency(service.price)} per tire × ${tireQuantity}`
                    : 'One-time fee'
                  }
                </p>
              </div>

              {/* Selection Status */}
              <div className="mt-4">
                <div className={`
                  w-full py-2 rounded-lg text-center text-sm font-medium transition-colors
                  ${isSelected 
                    ? 'bg-pirelli-yellow/20 text-pirelli-yellow' 
                    : 'bg-card-border text-muted'
                  }
                `}>
                  {isSelected ? 'Selected' : 'Click to add'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Delivery Address Input */}
      {isDeliverySelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8"
        >
          <div className="bg-card-bg border-2 border-pirelli-yellow/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-pirelli-yellow" />
              <h3 className="text-lg font-semibold">Delivery Address</h3>
            </div>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => onDeliveryAddressChange(e.target.value)}
              placeholder="Enter your delivery address"
              className="w-full px-4 py-3 bg-background border-2 border-card-border rounded-lg focus:border-pirelli-yellow focus:outline-none transition-colors"
            />
            <p className="text-sm text-muted mt-2">
              Please provide a complete address for delivery
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary of Selected Services */}
      {services.some(s => s.selected) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-pirelli-yellow/10 border border-pirelli-yellow/30 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold mb-3">Selected Services:</h3>
          <div className="space-y-2">
            {services.filter(s => s.selected).map(service => {
              const price = service.priceType === 'per-tire' 
                ? service.price * tireQuantity 
                : service.price;
              
              return (
                <div key={service.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>{service.icon}</span>
                    <span>{service.name}</span>
                  </span>
                  <span className="font-semibold text-pirelli-yellow">
                    +{formatCurrency(price)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-4 rounded-lg font-semibold text-lg bg-card-bg border-2 border-card-border hover:border-pirelli-yellow/50 transition-all"
        >
          Back
        </button>
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-4 rounded-lg font-semibold text-lg bg-pirelli-yellow text-black hover:bg-pirelli-yellow/90 shadow-lg shadow-pirelli-yellow/30 transition-all"
        >
          Continue to Summary
        </motion.button>
      </div>
    </motion.div>
  );
}