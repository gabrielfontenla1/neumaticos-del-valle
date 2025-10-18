// Types for tire equivalence feature

export interface TireSize {
  width: number     // Ancho en mm
  profile: number   // Perfil (relación de aspecto) en %
  diameter: number  // Diámetro de llanta en pulgadas
}

export interface TireDiameter {
  size: TireSize
  diameterMm: number  // Diámetro total en mm
}

export interface ToleranceRange {
  reference: number   // Diámetro de referencia
  min: number        // Diámetro mínimo permitido (-3%)
  max: number        // Diámetro máximo permitido (+3%)
  tolerance: number  // Porcentaje de tolerancia (default: 3)
}

export interface EquivalentTire {
  id: string
  name: string
  brand: string
  width: number
  profile: number
  diameter: number
  price: number
  stock: number
  image_url?: string
  calculatedDiameter: number  // Diámetro calculado del producto
  difference: number          // Diferencia con el diámetro de referencia
  differencePercent: number   // Diferencia en porcentaje
}

export interface EquivalenceResult {
  originalSize: TireSize
  referenceDiameter: number
  toleranceRange: ToleranceRange
  equivalentTires: EquivalentTire[]
  totalFound: number
}
