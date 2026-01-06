import { useState, useCallback, useEffect } from 'react';
import { QuotationData, Vehicle, SelectedTire, Service, TireModel } from '../types';
import { availableServices, getTiresByVehicle, submitQuotation, calculateTotal } from '../api';

export function useQuotation() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTires, setAvailableTires] = useState<TireModel[]>([]);
  const [quotationData, setQuotationData] = useState<QuotationData>({
    vehicle: null,
    selectedTire: null,
    services: availableServices,
    contact: {
      fullName: '',
      email: '',
      phone: ''
    }
  });

  // Load tires when vehicle is selected
  useEffect(() => {
    if (quotationData.vehicle) {
      loadTires(quotationData.vehicle);
    }
  }, [quotationData.vehicle]);

  const loadTires = async (vehicle: Vehicle) => {
    setIsLoading(true);
    try {
      const tires = await getTiresByVehicle(vehicle);
      setAvailableTires(tires);
    } catch (error) {
      console.error('Error loading tires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setVehicle = useCallback((vehicle: Vehicle) => {
    setQuotationData(prev => ({ ...prev, vehicle }));
  }, []);

  const selectTire = useCallback((tire: TireModel, quantity: number) => {
    setQuotationData(prev => ({
      ...prev,
      selectedTire: { ...tire, quantity }
    }));
  }, []);

  const updateTireQuantity = useCallback((quantity: number) => {
    setQuotationData(prev => ({
      ...prev,
      selectedTire: prev.selectedTire ? { ...prev.selectedTire, quantity } : null
    }));
  }, []);

  const toggleService = useCallback((serviceId: string) => {
    setQuotationData(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.id === serviceId
          ? { ...service, selected: !service.selected }
          : service
      )
    }));
  }, []);

  const setDeliveryAddress = useCallback((address: string) => {
    setQuotationData(prev => ({ ...prev, deliveryAddress: address }));
  }, []);

  const updateContact = useCallback((field: keyof QuotationData['contact'], value: string) => {
    setQuotationData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  }, []);

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return quotationData.vehicle !== null;
      case 2:
        return quotationData.selectedTire !== null;
      case 3:
        return true; // Services are optional
      case 4: {
        const { fullName, email, phone } = quotationData.contact;
        return fullName.trim() !== '' && email.trim() !== '' && phone.trim() !== '';
      }
      default:
        return false;
    }
  }, [currentStep, quotationData]);

  const nextStep = useCallback(() => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, canProceed]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const submit = async () => {
    if (!canProceed()) return;
    
    setIsLoading(true);
    try {
      const result = await submitQuotation({
        ...quotationData,
        total: getTotal()
      });
      
      if (result.success) {
        return result;
      }
      throw new Error('Failed to submit quotation');
    } catch (error) {
      console.error('Error submitting quotation:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = useCallback(() => {
    setCurrentStep(1);
    setQuotationData({
      vehicle: null,
      selectedTire: null,
      services: availableServices,
      contact: {
        fullName: '',
        email: '',
        phone: ''
      }
    });
    setAvailableTires([]);
  }, []);

  const getTotal = useCallback(() => {
    return calculateTotal(quotationData.selectedTire, quotationData.services);
  }, [quotationData]);

  const getServicesTotal = useCallback(() => {
    let total = 0;
    
    if (quotationData.selectedTire) {
      // Add per-tire services
      quotationData.services
        .filter(s => s.selected && s.priceType === 'per-tire')
        .forEach(s => {
          total += s.price * quotationData.selectedTire!.quantity;
        });
    }
    
    // Add flat services
    quotationData.services
      .filter(s => s.selected && s.priceType === 'flat')
      .forEach(s => {
        total += s.price;
      });
    
    return total;
  }, [quotationData]);

  return {
    currentStep,
    isLoading,
    quotationData,
    availableTires,
    
    // Actions
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
    
    // Computed
    canProceed: canProceed(),
    total: getTotal(),
    servicesTotal: getServicesTotal()
  };
}