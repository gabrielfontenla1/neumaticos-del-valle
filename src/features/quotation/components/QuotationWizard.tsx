'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuotation } from '../hooks/useQuotation';
import { ModernStepper } from './ModernStepper';
import { ModernTireCard } from './ModernTireCard';
import { VehicleForm } from './VehicleForm';
import { cn } from '@/lib/utils';
import { TireModel } from '../types';
import { ChevronLeft, ChevronRight, Check, Sparkles, ShoppingBag, User } from 'lucide-react';
import Image from 'next/image';

// Steps for the wizard - Welcome is step 0 but not shown in stepper
const allSteps = [
  { id: 'welcome', label: 'Inicio', number: 0 },
  { id: 'vehicle', label: 'Vehículo', number: 1 },
  { id: 'tires', label: 'Neumáticos', number: 2 },
  { id: 'services', label: 'Servicios', number: 3 },
  { id: 'summary', label: 'Resumen', number: 4 }
];

// Only these steps appear in the stepper (exclude welcome)
const stepperSteps = allSteps.slice(1).map((step, index) => ({
  ...step,
  number: index + 1
}));

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95
  })
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30
};

export function QuotationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
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


  // Mock data for demo
  const vehicleBrands = [
    { id: 'toyota', name: 'Toyota', logo: '🚗' },
    { id: 'ford', name: 'Ford', logo: '🚙' },
    { id: 'chevrolet', name: 'Chevrolet', logo: '🚐' },
    { id: 'volkswagen', name: 'Volkswagen', logo: '🚕' },
    { id: 'honda', name: 'Honda', logo: '🏎️' },
    { id: 'bmw', name: 'BMW', logo: '🚘' },
    { id: 'mercedes', name: 'Mercedes-Benz', logo: '🚖' },
    { id: 'audi', name: 'Audi', logo: '🚔' }
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

  const years = Array.from({ length: 15 }, (_, i) => (2024 - i).toString());

  const mockTires: TireModel[] = [
    {
      id: '1',
      name: 'P Zero',
      category: 'Sport',
      description: 'Máximo rendimiento en pista y calle',
      size: '225/45 R17',
      price: 85000,
      stock: 12,
      ratings: { fuel: 3, wetGrip: 4, noise: 3 }
    },
    {
      id: '2',
      name: 'Cinturato P7',
      category: 'Premium',
      description: 'Confort y seguridad para tu día a día',
      size: '225/45 R17',
      price: 75000,
      stock: 8,
      ratings: { fuel: 4, wetGrip: 4, noise: 2 }
    },
    {
      id: '3',
      name: 'Scorpion Verde',
      category: 'SUV',
      description: 'Diseñado para SUVs y crossovers',
      size: '225/45 R17',
      price: 95000,
      stock: 6,
      ratings: { fuel: 3, wetGrip: 3, noise: 3 }
    }
  ];

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < allSteps.length - 1) {
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
      year: Number(selectedYear)
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
      await submit();
    } catch (error) {
      console.error('Error al enviar cotización:', error);
    }
  };

  const WizardContent = () => (
    <div className="min-h-screen bg-black grid grid-rows-[auto_1fr] overflow-x-hidden">
      {/* Header */}
      <header className="w-full px-4 sm:px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Image 
              src="/logo.webp" 
              alt="Pirelli" 
              width={100} 
              height={40}
              className="h-8 sm:h-10 w-auto object-contain brightness-0 invert"
              priority
            />
            {currentStep > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 text-[10px] sm:text-xs text-white/60">
                Neumáticos Premium
              </div>
            )}
          </motion.div>
          {currentStep > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pirelli-yellow rounded-full">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-bold text-black uppercase tracking-wide">
                Distribuidor Oficial Pirelli
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Stepper - only show after welcome screen */}
      {currentStep > 0 && (
        <ModernStepper 
          steps={stepperSteps} 
          currentStep={currentStep - 1} 
          onStepClick={(index) => handleStepClick(index + 1)}
        />
      )}

      {/* Main Content - Grid Container */}
      <main className="w-full overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="min-h-full grid place-items-center px-4 sm:px-6 py-8"
          >
            <div className="w-full max-w-7xl">
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <div className="grid grid-rows-[1fr_auto] min-h-[calc(100vh-5rem)] gap-8">
                  {/* Main Content Area - Perfect Center */}
                  <div className="grid place-items-center px-4 sm:px-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="w-full max-w-2xl"
                    >
                      {/* Title */}
                      <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
                        Bienvenido a Pirelli
                      </h1>
                      
                      {/* Subtitle */}
                      <p className="text-white/70 text-center mb-12 text-lg">
                        Encontrá los neumáticos perfectos para tu vehículo
                      </p>
                      
                      {/* Central Content Box - Perfect Center */}
                      <div className="bg-[#1a1a1a]/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-white/10 grid gap-6">
                        <div className="text-center space-y-6">
                          {/* Pirelli Logo */}
                          <Image 
                            src="/logo.webp" 
                            alt="Pirelli" 
                            width={180} 
                            height={72}
                            className="h-14 sm:h-16 w-auto object-contain brightness-0 invert mx-auto mb-8"
                            priority
                          />
                          
                          {/* Description */}
                          <p className="text-white/80 max-w-md mx-auto">
                            Cotizá online y recibí tus neumáticos con instalación profesional incluida
                          </p>
                          
                          {/* Features */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-pirelli-yellow/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Check className="w-6 h-6 text-pirelli-yellow" />
                              </div>
                              <p className="text-xs text-white/60">Garantía Oficial</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-pirelli-yellow/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ShoppingBag className="w-6 h-6 text-pirelli-yellow" />
                              </div>
                              <p className="text-xs text-white/60">Mejores Precios</p>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-pirelli-yellow/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Sparkles className="w-6 h-6 text-pirelli-yellow" />
                              </div>
                              <p className="text-xs text-white/60">Servicio Premium</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button - Positioned like in reference */}
                      <div className="flex justify-center mt-8">
                        <motion.button
                          onClick={handleNext}
                          className="px-8 py-4 bg-pirelli-yellow text-black font-bold rounded-xl hover:shadow-lg hover:shadow-pirelli-yellow/30 transition-all duration-300"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Comenzar Cotización
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Footer - Aligned Bottom */}
                  <div className="grid place-items-center pb-8">
                    <Image 
                      src="/logo.webp" 
                      alt="Pirelli" 
                      width={100} 
                      height={40}
                      className="h-8 w-auto object-contain brightness-0 invert mx-auto mb-2"
                    />
                    <p className="text-xs text-white/40">
                      Neumáticos premium diseñados para rendimiento, seguridad y confiabilidad
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Vehicle Selection */}
              {currentStep === 1 && (
                <div className="grid place-items-center min-h-[calc(100vh-12rem)] px-4 sm:px-6">
                  <VehicleForm
                  selectedBrand={selectedBrand}
                  selectedModel={selectedModel}
                  selectedYear={selectedYear}
                  onBrandChange={(value) => {
                    setSelectedBrand(value);
                    setSelectedModel('');
                    setSelectedYear('');
                  }}
                  onModelChange={(value) => {
                    setSelectedModel(value);
                    setSelectedYear('');
                  }}
                  onYearChange={setSelectedYear}
                  onSubmit={handleVehicleSubmit}
                  vehicleBrands={vehicleBrands}
                  vehicleModels={vehicleModels}
                  years={years}
                  />
                </div>
              )}

              {/* Step 2: Tire Selection */}
              {currentStep === 2 && (
                <div className="grid gap-8 place-items-center min-h-[calc(100vh-12rem)]">
                  <div className="w-full max-w-6xl grid gap-8">
                    {/* Header Section - Centered */}
                    <div className="text-center grid gap-3">
                      <h1 className="text-3xl sm:text-4xl font-bold">
                        Neumáticos para tu {selectedBrand} {selectedModel}
                      </h1>
                      <p className="text-white/70 text-lg">
                        Neumáticos premium diseñados para rendimiento, seguridad y confiabilidad
                      </p>
                      <div className="inline-flex items-center justify-center">
                        <div className="px-4 py-2 bg-pirelli-yellow/10 border border-pirelli-yellow/30 rounded-full">
                          <span className="text-sm font-medium text-pirelli-yellow">Medida recomendada: 195/65R15</span>
                        </div>
                      </div>
                    </div>

                    {/* Tires Grid - Perfectly Centered */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
                    {(availableTires.length > 0 ? availableTires : mockTires).map((tire) => (
                      <ModernTireCard
                        key={tire.id}
                        tire={tire}
                        quantity={tireQuantities[tire.id] || 4}
                        onQuantityChange={(qty) => handleTireQuantityChange(tire.id, qty)}
                        onSelect={() => handleTireSelect(tire)}
                        isSelected={selectedTireId === tire.id}
                      />
                    ))}
                    </div>

                    {/* Navigation Buttons - Centered */}
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleBack}
                        className="px-8 py-3 bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all rounded-xl font-medium"
                      >
                        ← Anterior
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={!selectedTireId}
                        className={cn(
                          "px-8 py-3 rounded-xl font-bold transition-all",
                          selectedTireId
                            ? "bg-pirelli-yellow text-black hover:shadow-lg hover:shadow-pirelli-yellow/30"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                        )}
                      >
                        Continuar a Servicios →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Services */}
              {currentStep === 3 && (
                <div className="grid place-items-center min-h-[calc(100vh-12rem)]">
                  <div className="w-full max-w-4xl grid gap-8">
                    {/* Header Section */}
                    <div className="text-center grid gap-3">
                      <h1 className="text-3xl sm:text-4xl font-bold">
                        Servicios Adicionales
                      </h1>
                      <p className="text-white/70 text-lg">
                        Mejora tu experiencia con nuestros servicios profesionales
                      </p>
                    </div>

                    {/* Services Grid - Centered */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quotationData.services.map((service) => (
                      <motion.button
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          "glass-card p-6 text-left transition-all",
                          service.selected && "border-pirelli-yellow bg-pirelli-yellow/5"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">{service.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{service.name}</h3>
                            <p className="text-sm text-text-secondary mb-2">{service.description}</p>
                            <div className="text-pirelli-yellow font-bold">
                              ${service.price.toLocaleString('es-AR')}
                              {service.priceType === 'per-tire' && ' por neumático'}
                            </div>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            service.selected
                              ? "bg-pirelli-yellow border-pirelli-yellow"
                              : "border-glass-border"
                          )}>
                            {service.selected && (
                              <Check className="w-4 h-4 text-black" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleBack}
                        className="px-8 py-3 bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all rounded-xl font-medium"
                      >
                        ← Volver a Neumáticos
                      </button>
                      <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-pirelli-yellow text-black font-bold rounded-xl hover:shadow-lg hover:shadow-pirelli-yellow/30 transition-all"
                      >
                        Continuar al Resumen →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Summary with Contact */}
              {currentStep === 4 && (
                <div className="grid place-items-center min-h-[calc(100vh-12rem)]">
                  <div className="w-full max-w-5xl grid gap-8">
                    {/* Header Section */}
                    <div className="text-center grid gap-3">
                      <h1 className="text-3xl sm:text-4xl font-bold">
                        Resumen de tu Cotización
                      </h1>
                      <p className="text-white/70 text-lg">
                        Revisá tu selección y proporcioná tu información de contacto
                      </p>
                    </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Order Summary */}
                    <div className="space-y-4">
                    {/* Vehicle */}
                    <div className="glass-card p-6">
                      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pirelli-yellow/10 flex items-center justify-center">
                          <span className="text-sm">🚗</span>
                        </div>
                        Vehículo
                      </h2>
                      <div className="text-text-secondary">
                        {selectedBrand} {selectedModel} {selectedYear}
                      </div>
                    </div>

                    {/* Tires */}
                    {quotationData.selectedTire && (
                      <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-pirelli-yellow/10 flex items-center justify-center">
                            <span className="text-sm">🛞</span>
                          </div>
                          Neumáticos
                        </h2>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{quotationData.selectedTire.name}</div>
                            <div className="text-sm text-text-secondary">
                              {quotationData.selectedTire.size} - Cantidad: {quotationData.selectedTire.quantity}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-pirelli-yellow">
                            ${(quotationData.selectedTire.price * quotationData.selectedTire.quantity).toLocaleString('es-AR')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    {servicesTotal > 0 && (
                      <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-pirelli-yellow/10 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          Servicios
                        </h2>
                        {quotationData.services.filter(s => s.selected).map(service => (
                          <div key={service.id} className="flex justify-between items-center mb-2">
                            <span className="text-text-secondary">{service.name}</span>
                            <span className="font-medium">
                              ${(service.priceType === 'per-tire' 
                                ? service.price * (quotationData.selectedTire?.quantity || 4)
                                : service.price
                              ).toLocaleString('es-AR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}


                      {/* Total */}
                      <motion.div 
                        className="bg-gradient-to-r from-pirelli-yellow to-yellow-600 p-6 rounded-2xl"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-black">TOTAL</span>
                          <motion.span 
                            className="text-3xl font-bold text-black"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            ${total.toLocaleString('es-AR')}
                          </motion.span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Right Column - Contact Form */}
                    <div className="space-y-4">
                      <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Información de Contacto
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-white/60 mb-2">Nombre Completo *</label>
                            <input
                              type="text"
                              placeholder="Ingresá tu nombre completo"
                              value={contactData.fullName}
                              onChange={(e) => {
                                setContactData(prev => ({ ...prev, fullName: e.target.value }));
                                updateContact('fullName', e.target.value);
                              }}
                              className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-text-secondary focus:border-pirelli-yellow focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-2">Correo Electrónico *</label>
                            <input
                              type="email"
                              placeholder="Ingresá tu correo electrónico"
                              value={contactData.email}
                              onChange={(e) => {
                                setContactData(prev => ({ ...prev, email: e.target.value }));
                                updateContact('email', e.target.value);
                              }}
                              className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-text-secondary focus:border-pirelli-yellow focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-white/60 mb-2">Número de Teléfono *</label>
                            <input
                              type="tel"
                              placeholder="Ingresá tu número de teléfono"
                              value={contactData.phone}
                              onChange={(e) => {
                                setContactData(prev => ({ ...prev, phone: e.target.value }));
                                updateContact('phone', e.target.value);
                              }}
                              className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-text-secondary focus:border-pirelli-yellow focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="glass-card p-4 bg-pirelli-yellow/10 border-pirelli-yellow/30">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-pirelli-yellow mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <div className="text-sm">
                            <p className="font-semibold text-pirelli-yellow mb-1">Distribuidor Oficial Pirelli</p>
                            <p className="text-white/70">Instalación y servicio premium incluído</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Navigation Buttons - Centered */}
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleBack}
                        className="px-8 py-3 bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all rounded-xl font-medium"
                      >
                        ← Volver a Servicios
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading || !contactData.fullName || !contactData.email || !contactData.phone}
                        className={cn(
                          "px-8 py-3 font-bold rounded-xl transition-all",
                          (!isLoading && contactData.fullName && contactData.email && contactData.phone)
                            ? "bg-pirelli-yellow text-black hover:shadow-lg hover:shadow-pirelli-yellow/30"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
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

  // Return the same content for both mobile and desktop
  return <WizardContent />;
}