'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuotation } from '../hooks/useQuotation';
import { ProgressBar } from './ProgressBar';
import { VehicleSelection } from './VehicleSelection';
import { TireSelection } from './TireSelection';
import { ServiceSelection } from './ServiceSelection';
import { QuotationSummary } from './QuotationSummary';
import { SuccessState } from './SuccessState';

const steps = [
  { number: 1, title: 'Vehicle' },
  { number: 2, title: 'Tires' },
  { number: 3, title: 'Services' },
  { number: 4, title: 'Summary' }
];

export function QuotationWizard() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [quotationId, setQuotationId] = useState('');
  
  const {
    currentStep,
    isLoading,
    quotationData,
    availableTires,
    setVehicle,
    selectTire,
    updateTireQuantity,
    toggleService,
    setDeliveryAddress,
    updateContact,
    nextStep,
    previousStep,
    submit,
    reset,
    canProceed,
    total,
    servicesTotal
  } = useQuotation();

  const handleSubmit = async () => {
    try {
      const result = await submit();
      if (result && result.success) {
        setQuotationId(result.id);
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error submitting quotation:', error);
      // In a real app, show error toast
    }
  };

  const handleNewQuote = () => {
    setIsSuccess(false);
    setQuotationId('');
    reset();
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-4 mb-4">
              <div className="text-5xl font-bold text-pirelli-yellow">PIRELLI</div>
              <div className="px-3 py-1 bg-pirelli-yellow/20 border border-pirelli-yellow/30 rounded-full text-sm font-medium text-pirelli-yellow">
                Official Dealer
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">Tire Quotation System</h1>
          </motion.div>

          <SuccessState quotationId={quotationId} onNewQuote={handleNewQuote} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="text-5xl font-bold text-pirelli-yellow">PIRELLI</div>
            <div className="px-3 py-1 bg-pirelli-yellow/20 border border-pirelli-yellow/30 rounded-full text-sm font-medium text-pirelli-yellow">
              Official Dealer
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Tire Quotation System</h1>
          <p className="text-lg text-muted">Get a personalized quote for your Pirelli tires</p>
        </motion.div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} steps={steps} />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <VehicleSelection
                onVehicleSelect={setVehicle}
                onNext={nextStep}
                initialVehicle={quotationData.vehicle}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TireSelection
                tires={availableTires}
                selectedTire={quotationData.selectedTire}
                onTireSelect={selectTire}
                onQuantityChange={updateTireQuantity}
                onNext={nextStep}
                onBack={previousStep}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ServiceSelection
                services={quotationData.services}
                deliveryAddress={quotationData.deliveryAddress}
                tireQuantity={quotationData.selectedTire?.quantity || 0}
                onServiceToggle={toggleService}
                onDeliveryAddressChange={setDeliveryAddress}
                onNext={nextStep}
                onBack={previousStep}
              />
            </motion.div>
          )}

          {currentStep === 4 && quotationData.vehicle && quotationData.selectedTire && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <QuotationSummary
                vehicle={quotationData.vehicle}
                tire={quotationData.selectedTire}
                services={quotationData.services}
                deliveryAddress={quotationData.deliveryAddress}
                contact={quotationData.contact}
                total={total}
                servicesTotal={servicesTotal}
                onContactChange={updateContact}
                onSubmit={handleSubmit}
                onBack={previousStep}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}