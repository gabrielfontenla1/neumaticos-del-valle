'use client';

import { motion } from 'framer-motion';
import { Car, Package, Wrench, MapPin, Mail, Phone, User } from 'lucide-react';
import { Vehicle, SelectedTire, Service } from '../types';
import { formatCurrency } from '../api';

interface QuotationSummaryProps {
  vehicle: Vehicle;
  tire: SelectedTire;
  services: Service[];
  deliveryAddress?: string;
  contact: {
    fullName: string;
    email: string;
    phone: string;
  };
  total: number;
  servicesTotal: number;
  onContactChange: (field: 'fullName' | 'email' | 'phone', value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function QuotationSummary({
  vehicle,
  tire,
  services,
  deliveryAddress,
  contact,
  total,
  servicesTotal,
  onContactChange,
  onSubmit,
  onBack,
  isLoading
}: QuotationSummaryProps) {
  const selectedServices = services.filter(s => s.selected);
  const subtotal = tire.price * tire.quantity;
  const canSubmit = contact.fullName && contact.email && contact.phone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Order Summary</h2>
        <p className="text-muted">Review your selection and provide contact information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div>
          <div className="bg-card-bg border-2 border-card-border rounded-xl p-6 space-y-6">
            {/* Vehicle */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Car className="w-5 h-5 text-pirelli-yellow" />
                Vehicle
              </h3>
              <p className="text-muted">{vehicle.year} {vehicle.brand} {vehicle.model}</p>
            </div>

            {/* Tires */}
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                <Package className="w-5 h-5 text-pirelli-yellow" />
                Pirelli Tires
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{tire.name}</p>
                    <p className="text-sm text-muted">{tire.size} • {tire.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{tire.quantity} tires</p>
                    <p className="text-sm text-muted">{formatCurrency(tire.price)} each</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            {selectedServices.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <Wrench className="w-5 h-5 text-pirelli-yellow" />
                  Additional Services
                </h3>
                <div className="space-y-2">
                  {selectedServices.map(service => {
                    const price = service.priceType === 'per-tire' 
                      ? service.price * tire.quantity 
                      : service.price;
                    
                    return (
                      <div key={service.id} className="flex justify-between">
                        <span className="text-sm">{service.name}</span>
                        <span className="text-sm font-medium">{formatCurrency(price)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Address */}
            {deliveryAddress && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <MapPin className="w-5 h-5 text-pirelli-yellow" />
                  Delivery Address
                </h3>
                <p className="text-sm text-muted">{deliveryAddress}</p>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="pt-6 border-t-2 border-card-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Tires Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {servicesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Services</span>
                  <span>{formatCurrency(servicesTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold pt-2 border-t border-card-border">
                <span>Total</span>
                <span className="text-pirelli-yellow">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <div className="bg-card-bg border-2 border-card-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-6">Contact Information</h3>
            
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-pirelli-yellow" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={contact.fullName}
                  onChange={(e) => onContactChange('fullName', e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-background border-2 border-card-border rounded-lg focus:border-pirelli-yellow focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-pirelli-yellow" />
                  Email Address *
                </label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => onContactChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-background border-2 border-card-border rounded-lg focus:border-pirelli-yellow focus:outline-none transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-pirelli-yellow" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => onContactChange('phone', e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className="w-full px-4 py-3 bg-background border-2 border-card-border rounded-lg focus:border-pirelli-yellow focus:outline-none transition-colors"
                />
              </div>
            </div>

            <p className="text-xs text-muted mt-4">
              * Required fields. We'll contact you to confirm your order.
            </p>
          </div>

          {/* Terms Notice */}
          <div className="mt-6 p-4 bg-pirelli-yellow/10 border border-pirelli-yellow/30 rounded-xl">
            <p className="text-sm text-muted">
              By confirming this quotation, you agree to be contacted by our sales team. 
              This is a quotation request, not a final purchase order.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-4 rounded-lg font-semibold text-lg bg-card-bg border-2 border-card-border hover:border-pirelli-yellow/50 transition-all disabled:opacity-50"
        >
          Back
        </button>
        <motion.button
          onClick={onSubmit}
          disabled={!canSubmit || isLoading}
          whileHover={canSubmit && !isLoading ? { scale: 1.02 } : {}}
          whileTap={canSubmit && !isLoading ? { scale: 0.98 } : {}}
          className={`
            flex-1 py-4 rounded-lg font-semibold text-lg transition-all
            ${canSubmit && !isLoading
              ? 'bg-pirelli-yellow text-black hover:bg-pirelli-yellow/90 shadow-lg shadow-pirelli-yellow/30'
              : 'bg-card-border text-muted cursor-not-allowed'
            }
          `}
        >
          {isLoading ? 'Processing...' : 'Confirm Quotation'}
        </motion.button>
      </div>
    </motion.div>
  );
}