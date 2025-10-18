import { TireModel, Service, Vehicle } from './types';

// Datos de vehículos
export const vehicleBrands = [
  'Volkswagen',
  'Ford',
  'Chevrolet',
  'Toyota',
  'Renault',
  'Peugeot',
  'Fiat'
];

export const vehicleModels: Record<string, string[]> = {
  'Volkswagen': ['Golf', 'Polo', 'Tiguan', 'Passat', 'T-Cross', 'Amarok'],
  'Ford': ['Focus', 'Fiesta', 'EcoSport', 'Ranger', 'Kuga', 'Mondeo'],
  'Chevrolet': ['Cruze', 'Onix', 'Tracker', 'S10', 'Equinox', 'Camaro'],
  'Toyota': ['Corolla', 'Hilux', 'RAV4', 'Camry', 'Yaris', 'SW4'],
  'Renault': ['Sandero', 'Logan', 'Duster', 'Captur', 'Kangoo', 'Alaskan'],
  'Peugeot': ['208', '308', '2008', '3008', '5008', 'Partner'],
  'Fiat': ['Cronos', 'Argo', 'Toro', 'Mobi', '500', 'Strada']
};

export const vehicleYears = Array.from({ length: 15 }, (_, i) => 2024 - i);

// Tire data
export const tireModels: TireModel[] = [
  {
    id: 'cinturato-p7',
    name: 'Cinturato P7',
    category: 'Premium',
    description: 'Confort premium con bajo ruido para vehículos de lujo',
    size: '205/55R16',
    price: 95000,
    stock: 12,
    ratings: {
      fuel: 4.5,
      wetGrip: 4.8,
      noise: 4.7
    }
  },
  {
    id: 'scorpion-verde',
    name: 'Scorpion Verde',
    category: 'SUV',
    description: 'Neumático SUV ecológico con excelente rendimiento',
    size: '235/65R17',
    price: 125000,
    stock: 8,
    ratings: {
      fuel: 4.6,
      wetGrip: 4.5,
      noise: 4.2
    }
  },
  {
    id: 'p-zero',
    name: 'P Zero',
    category: 'Sport',
    description: 'Ultra alto rendimiento para autos deportivos',
    size: '225/45R18',
    price: 180000,
    stock: 6,
    ratings: {
      fuel: 3.8,
      wetGrip: 5.0,
      noise: 3.5
    }
  },
  {
    id: 'p1',
    name: 'P1',
    category: 'Económico',
    description: 'Neumático económico para manejo urbano',
    size: '175/65R14',
    price: 65000,
    stock: 20,
    ratings: {
      fuel: 4.2,
      wetGrip: 3.8,
      noise: 3.9
    }
  },
  {
    id: 'scorpion-atr',
    name: 'Scorpion ATR',
    category: 'Todo Terreno',
    description: 'Neumático todo terreno para camionetas y SUVs',
    size: '265/70R16',
    price: 145000,
    stock: 10,
    ratings: {
      fuel: 3.5,
      wetGrip: 4.2,
      noise: 3.2
    }
  },
  {
    id: 'formula-energy',
    name: 'Formula Energy',
    category: 'Económico',
    description: 'Eficiente en combustible para uso diario',
    size: '185/60R15',
    price: 72000,
    stock: 15,
    ratings: {
      fuel: 4.8,
      wetGrip: 3.9,
      noise: 4.0
    }
  }
];

// Datos de servicios
export const availableServices: Service[] = [
  {
    id: 'installation',
    name: 'Instalación Profesional',
    description: 'Montaje y balanceo por técnicos certificados',
    icon: '🔧',
    price: 2500,
    priceType: 'per-tire',
    selected: false
  },
  {
    id: 'alignment',
    name: 'Alineación Computarizada',
    description: 'Alineación de precisión para un rendimiento óptimo',
    icon: '⚙️',
    price: 8000,
    priceType: 'flat',
    selected: false
  },
  {
    id: 'delivery',
    name: 'Envío a Domicilio',
    description: 'Entrega gratis en tu ubicación',
    icon: '🚚',
    price: 3500,
    priceType: 'flat',
    selected: false
  }
];

// API functions (simulated)
export async function getTiresByVehicle(vehicle: Vehicle): Promise<TireModel[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would filter tires based on vehicle compatibility
  // For now, return all tires with adjusted sizes based on vehicle type
  return tireModels.map(tire => {
    // Adjust tire size based on vehicle (simplified logic)
    let size = tire.size;
    if (vehicle.brand === 'Fiat' && (vehicle.model === 'Mobi' || vehicle.model === '500')) {
      size = '175/65R14'; // Smaller cars
    } else if (vehicle.model.includes('Hilux') || vehicle.model.includes('Ranger') || vehicle.model.includes('Amarok')) {
      size = '265/70R16'; // Pickup trucks
    } else if (vehicle.model.includes('SUV') || vehicle.model.includes('Tiguan') || vehicle.model.includes('RAV4')) {
      size = '235/65R17'; // SUVs
    }
    
    return { ...tire, size };
  });
}

export async function submitQuotation(data: any): Promise<{ success: boolean; id: string }> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, this would send data to backend
  console.log('Submitting quotation:', data);
  
  return {
    success: true,
    id: `QUO-${Date.now()}`
  };
}

// Funciones de utilidad
export function formatCurrency(amount: number): string {
  // Formato argentino con punto como separador de miles
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return `$${formatted}`;
}

export function calculateTotal(tire: { price: number; quantity: number } | null, services: Service[]): number {
  let total = 0;
  
  if (tire) {
    total += tire.price * tire.quantity;
    
    // Add per-tire services
    services
      .filter(s => s.selected && s.priceType === 'per-tire')
      .forEach(s => {
        total += s.price * tire.quantity;
      });
  }
  
  // Add flat services
  services
    .filter(s => s.selected && s.priceType === 'flat')
    .forEach(s => {
      total += s.price;
    });
  
  return total;
}