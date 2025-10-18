'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Package, FileText } from 'lucide-react';
import { useQuotation } from '../hooks/useQuotation';
import { Stepper, Step } from './Stepper';
import { TireCard } from './TireCard';
import { cn } from '@/lib/utils';
import { TireModel, Service } from '../types';

const steps: Step[] = [
  { id: 'vehicle', label: 'Vehículo', icon: Car },
  { id: 'tires', label: 'Neumáticos', icon: Package },
  { id: 'services', label: 'Servicios', icon: Package },
  { id: 'summary', label: 'Resumen', icon: FileText }
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.3
};

export function MobileWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedTireId, setSelectedTireId] = useState<string>('');
  const [tireQuantities, setTireQuantities] = useState<Record<string, number>>({});
  const [contactData, setContactData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  
  const {
    isLoading,
    quotationData,
    availableTires,
    setVehicle,
    selectTire,
    updateTireQuantity,
    toggleService,
    updateContact,
    submit,
    reset,
    total,
    servicesTotal
  } = useQuotation();

  // Mock data for demo - replace with actual API calls
  const vehicleBrands = [
    'Toyota', 'Ford', 'Chevrolet', 'Volkswagen', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi'
  ];

  const vehicleModels: Record<string, string[]> = {
    'Toyota': ['Corolla', 'Camry', 'Hilux', 'RAV4'],
    'Ford': ['Focus', 'Fiesta', 'Ranger', 'Explorer'],
    'Chevrolet': ['Cruze', 'Onix', 'S10', 'Tracker'],
    'Volkswagen': ['Golf', 'Polo', 'Tiguan', 'Amarok'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V'],
    'BMW': ['Serie 3', 'Serie 5', 'X1', 'X3'],
    'Mercedes-Benz': ['Clase C', 'Clase E', 'GLA', 'GLC'],
    'Audi': ['A3', 'A4', 'Q3', 'Q5']
  };

  const years = Array.from({ length: 15 }, (_, i) => 2024 - i);

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex !== currentStep && stepIndex <= currentStep) {
      setDirection(stepIndex > currentStep ? 1 : -1);
      setCurrentStep(stepIndex);
    }
  };

  const handleVehicleSubmit = () => {
    setVehicle({ 
      brand: selectedBrand, 
      model: selectedModel, 
      year: selectedYear 
    });
    handleNext();
  };

  const handleTireSelect = (tire: TireModel) => {
    setSelectedTireId(tire.id);
    const quantity = tireQuantities[tire.id] || 4;
    selectTire(tire, quantity);
  };

  const handleTireQuantityChange = (tireId: string, quantity: number) => {
    setTireQuantities(prev => ({ ...prev, [tireId]: quantity }));
    if (tireId === selectedTireId) {
      updateTireQuantity(quantity);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await submit();
      if (result && result.success) {
        // Handle success - show success modal or redirect
        console.log('Cotización enviada:', result.id);
      }
    } catch (error) {
      console.error('Error al enviar cotización:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header with Pirelli branding */}
      <header className="bg-black border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Pirelli Logo */}
            <div className="text-white font-bold text-2xl">PIRELLI</div>
            <div className="px-2 py-1 bg-pirelli-yellow text-black text-xs font-bold rounded">
              Distribuidor Oficial
            </div>
          </div>
          <div className="text-muted text-sm">Argentina</div>
        </div>
      </header>

      {/* Stepper Navigation */}
      <Stepper 
        steps={steps} 
        currentStep={currentStep} 
        onStepClick={handleStepClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="min-h-full"
          >
            <div className="max-w-7xl mx-auto px-4 py-8">
              {/* Step 0: Vehicle Selection */}
              {currentStep === 0 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="inline-block mb-4">
                      <div className="text-white font-bold text-4xl mb-2">PIRELLI</div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Selección de Vehículo
                    </h1>
                    <p className="text-muted">
                      Indicá tu vehículo para encontrar los neumáticos perfectos
                    </p>
                  </div>

                  <div className="grid gap-6 max-w-2xl mx-auto">
                    {/* Brand Selection */}
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Marca
                      </label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full px-4 py-3 bg-dark-gray border border-light-gray rounded-lg text-white focus:border-pirelli-yellow focus:outline-none transition-colors"
                      >
                        <option value="">Selecciona una marca</option>
                        {vehicleBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    {/* Model Selection */}
                    {selectedBrand && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-sm font-medium text-muted mb-2">
                          Modelo
                        </label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full px-4 py-3 bg-dark-gray border border-light-gray rounded-lg text-white focus:border-pirelli-yellow focus:outline-none transition-colors"
                        >
                          <option value="">Selecciona un modelo</option>
                          {vehicleModels[selectedBrand]?.map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {/* Year Selection */}
                    {selectedModel && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block text-sm font-medium text-muted mb-2">
                          Año
                        </label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-dark-gray border border-light-gray rounded-lg text-white focus:border-pirelli-yellow focus:outline-none transition-colors"
                        >
                          <option value="0">Selecciona un año</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {/* Continue Button */}
                    {selectedBrand && selectedModel && selectedYear > 0 && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={handleVehicleSubmit}
                        className="w-full py-3 bg-pirelli-yellow text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                      >
                        Continuar
                      </motion.button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Tire Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="inline-block mb-4">
                      <div className="text-white font-bold text-4xl mb-2">PIRELLI</div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Neumáticos premium para tu {selectedBrand} {selectedModel}
                    </h1>
                    <p className="text-muted">
                      Medida recomendada: 225/45 R17
                    </p>
                  </div>

                  {/* Tire Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(availableTires.length > 0 ? availableTires : [
                      {
                        id: '1',
                        name: 'P Zero',
                        category: 'Sport' as const,
                        description: 'Máximo rendimiento en pista y calle',
                        size: '225/45 R17',
                        price: 85000,
                        stock: 12,
                        ratings: { fuel: 3, wetGrip: 4, noise: 3 }
                      },
                      {
                        id: '2',
                        name: 'Cinturato P7',
                        category: 'Premium' as const,
                        description: 'Confort y seguridad para tu día a día',
                        size: '225/45 R17',
                        price: 75000,
                        stock: 8,
                        ratings: { fuel: 4, wetGrip: 4, noise: 2 }
                      },
                      {
                        id: '3',
                        name: 'Scorpion Verde',
                        category: 'SUV' as const,
                        description: 'Diseñado para SUVs y crossovers',
                        size: '225/45 R17',
                        price: 95000,
                        stock: 6,
                        ratings: { fuel: 3, wetGrip: 3, noise: 3 }
                      }
                    ]).map((tire) => (
                      <TireCard
                        key={tire.id}
                        tire={tire}
                        quantity={tireQuantities[tire.id] || 4}
                        onQuantityChange={(qty) => handleTireQuantityChange(tire.id, qty)}
                        onSelect={() => handleTireSelect(tire)}
                        isSelected={selectedTireId === tire.id}
                      />
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 justify-between max-w-2xl mx-auto mt-8">
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 bg-dark-gray border border-light-gray text-white rounded-lg hover:border-pirelli-yellow transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!selectedTireId}
                      className={cn(
                        "px-6 py-3 rounded-lg font-bold transition-colors",
                        selectedTireId
                          ? "bg-pirelli-yellow text-black hover:bg-yellow-500"
                          : "bg-dark-gray text-muted cursor-not-allowed"
                      )}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Services Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Servicios Adicionales
                    </h1>
                    <p className="text-muted">
                      Completá tu compra con nuestros servicios profesionales
                    </p>
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {quotationData.services.map((service) => (
                      <motion.div
                        key={service.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-lg border-2 cursor-pointer transition-all",
                          service.selected
                            ? "bg-pirelli-yellow/10 border-pirelli-yellow"
                            : "bg-dark-gray border-light-gray hover:border-pirelli-yellow/50"
                        )}
                        onClick={() => toggleService(service.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">{service.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-white mb-1">{service.name}</h3>
                            <p className="text-sm text-muted mb-2">{service.description}</p>
                            <div className="text-pirelli-yellow font-bold">
                              ${service.price.toLocaleString('es-AR')}
                              {service.priceType === 'per-tire' && ' por neumático'}
                            </div>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            service.selected
                              ? "bg-pirelli-yellow border-pirelli-yellow"
                              : "border-light-gray"
                          )}>
                            {service.selected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-3 h-3 bg-black rounded-full"
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-4 justify-between max-w-2xl mx-auto mt-8">
                    <button
                      onClick={handleBack}
                      className="px-6 py-3 bg-dark-gray border border-light-gray text-white rounded-lg hover:border-pirelli-yellow transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-6 py-3 bg-pirelli-yellow text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Summary */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Resumen de tu Cotización
                    </h1>
                    <p className="text-muted">
                      Revisá los detalles antes de confirmar
                    </p>
                  </div>

                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Vehicle Summary */}
                    <div className="bg-dark-gray rounded-lg p-6 border border-light-gray">
                      <h2 className="text-lg font-bold text-white mb-4">Vehículo</h2>
                      <div className="text-muted">
                        {selectedBrand} {selectedModel} {selectedYear}
                      </div>
                    </div>

                    {/* Tire Summary */}
                    {quotationData.selectedTire && (
                      <div className="bg-dark-gray rounded-lg p-6 border border-light-gray">
                        <h2 className="text-lg font-bold text-white mb-4">Neumáticos</h2>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-white font-medium">
                              {quotationData.selectedTire.name}
                            </div>
                            <div className="text-sm text-muted">
                              {quotationData.selectedTire.size} - Cantidad: {quotationData.selectedTire.quantity}
                            </div>
                          </div>
                          <div className="text-pirelli-yellow font-bold text-xl">
                            ${(quotationData.selectedTire.price * quotationData.selectedTire.quantity).toLocaleString('es-AR')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Services Summary */}
                    {servicesTotal > 0 && (
                      <div className="bg-dark-gray rounded-lg p-6 border border-light-gray">
                        <h2 className="text-lg font-bold text-white mb-4">Servicios</h2>
                        {quotationData.services.filter(s => s.selected).map(service => (
                          <div key={service.id} className="flex justify-between items-center mb-2">
                            <span className="text-muted">{service.name}</span>
                            <span className="text-white">
                              ${(service.priceType === 'per-tire' 
                                ? service.price * (quotationData.selectedTire?.quantity || 4)
                                : service.price
                              ).toLocaleString('es-AR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contact Form */}
                    <div className="bg-dark-gray rounded-lg p-6 border border-light-gray">
                      <h2 className="text-lg font-bold text-white mb-4">Datos de Contacto</h2>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          value={contactData.fullName}
                          onChange={(e) => {
                            setContactData(prev => ({ ...prev, fullName: e.target.value }));
                            updateContact('fullName', e.target.value);
                          }}
                          className="w-full px-4 py-3 bg-black border border-light-gray rounded-lg text-white placeholder-muted focus:border-pirelli-yellow focus:outline-none transition-colors"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={contactData.email}
                          onChange={(e) => {
                            setContactData(prev => ({ ...prev, email: e.target.value }));
                            updateContact('email', e.target.value);
                          }}
                          className="w-full px-4 py-3 bg-black border border-light-gray rounded-lg text-white placeholder-muted focus:border-pirelli-yellow focus:outline-none transition-colors"
                        />
                        <input
                          type="tel"
                          placeholder="Teléfono"
                          value={contactData.phone}
                          onChange={(e) => {
                            setContactData(prev => ({ ...prev, phone: e.target.value }));
                            updateContact('phone', e.target.value);
                          }}
                          className="w-full px-4 py-3 bg-black border border-light-gray rounded-lg text-white placeholder-muted focus:border-pirelli-yellow focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-pirelli-yellow rounded-lg p-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-black">Total</span>
                        <span className="text-3xl font-bold text-black">
                          ${total.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-between">
                      <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-dark-gray border border-light-gray text-white rounded-lg hover:border-pirelli-yellow transition-colors"
                      >
                        Atrás
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading || !contactData.fullName || !contactData.email || !contactData.phone}
                        className={cn(
                          "px-6 py-3 rounded-lg font-bold transition-colors",
                          !isLoading && contactData.fullName && contactData.email && contactData.phone
                            ? "bg-pirelli-yellow text-black hover:bg-yellow-500"
                            : "bg-dark-gray text-muted cursor-not-allowed"
                        )}
                      >
                        {isLoading ? 'Enviando...' : 'Confirmar Cotización'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}