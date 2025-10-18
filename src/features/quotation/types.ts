// Vehicle types
export interface Vehicle {
  brand: string;
  model: string;
  year: number;
}

export interface VehicleOption {
  value: string;
  label: string;
}

// Tire types
export interface TireModel {
  id: string;
  name: string;
  category: 'Premium' | 'Sport' | 'SUV' | 'Económico' | 'Todo Terreno';
  description: string;
  size: string;
  price: number;
  stock: number;
  ratings: {
    fuel: number;
    wetGrip: number;
    noise: number;
  };
  image?: string;
}

export interface SelectedTire extends TireModel {
  quantity: number;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  priceType: 'per-tire' | 'flat';
  selected: boolean;
}

// Quotation types
export interface QuotationData {
  vehicle: Vehicle | null;
  selectedTire: SelectedTire | null;
  services: Service[];
  deliveryAddress?: string;
  contact: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface QuotationSummary {
  vehicle: Vehicle;
  tire: SelectedTire;
  services: Service[];
  subtotal: number;
  servicesTotal: number;
  total: number;
  deliveryAddress?: string;
}