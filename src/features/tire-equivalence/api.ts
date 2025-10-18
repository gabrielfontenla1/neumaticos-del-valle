import { supabase } from '@/lib/supabase'
import { Product } from '@/features/products/types'
import {
  TireSize,
  TireDiameter,
  ToleranceRange,
  EquivalentTire,
  EquivalenceResult
} from './types'

/**
 * Calcula el diámetro exterior total de una cubierta usando la fórmula estándar
 * Fórmula: Diámetro (mm) = (Ancho × (Perfil / 100) × 2) + (Diámetro de llanta × 25.4)
 */
export function calculateTireDiameter(size: TireSize): number {
  const { width, profile, diameter } = size
  const sidewallHeight = width * (profile / 100)
  const totalDiameter = (sidewallHeight * 2) + (diameter * 25.4)
  return Math.round(totalDiameter * 100) / 100 // Redondear a 2 decimales
}

/**
 * Calcula el rango de tolerancia (±3% por defecto)
 */
export function calculateToleranceRange(
  referenceDiameter: number,
  tolerancePercent: number = 3
): ToleranceRange {
  const toleranceFactor = tolerancePercent / 100
  const min = referenceDiameter * (1 - toleranceFactor)
  const max = referenceDiameter * (1 + toleranceFactor)

  return {
    reference: referenceDiameter,
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    tolerance: tolerancePercent
  }
}

/**
 * Verifica si un diámetro está dentro del rango de tolerancia
 */
export function isWithinTolerance(
  diameter: number,
  range: ToleranceRange
): boolean {
  return diameter > range.min && diameter < range.max
}

/**
 * Busca cubiertas equivalentes en el catálogo
 */
export async function findEquivalentTires(
  originalSize: TireSize,
  tolerancePercent: number = 3
): Promise<EquivalenceResult> {
  try {
    // 1. Calcular el diámetro de referencia
    const referenceDiameter = calculateTireDiameter(originalSize)

    // 2. Calcular el rango de tolerancia
    const toleranceRange = calculateToleranceRange(referenceDiameter, tolerancePercent)

    // 3. Obtener todos los productos del catálogo con medidas válidas
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .not('width', 'is', null)
      .not('profile', 'is', null)
      .not('diameter', 'is', null)
      .gt('stock', 0) // Solo productos con stock

    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }

    // 4. Analizar cada producto y calcular equivalencias
    const productsData = products as any[]
    const equivalentTires: EquivalentTire[] = []

    for (const product of (productsData || [])) {
      const productSize: TireSize = {
        width: product.width,
        profile: product.profile,
        diameter: product.diameter
      }

      // Calcular el diámetro del producto
      const productDiameter = calculateTireDiameter(productSize)

      // Verificar si está dentro del rango de tolerancia
      if (isWithinTolerance(productDiameter, toleranceRange)) {
        const difference = productDiameter - referenceDiameter
        const differencePercent = (difference / referenceDiameter) * 100

        equivalentTires.push({
          id: product.id,
          name: product.name,
          brand: product.brand,
          width: product.width,
          profile: product.profile,
          diameter: product.diameter,
          price: product.price,
          stock: product.stock,
          image_url: product.image_url,
          calculatedDiameter: productDiameter,
          difference: Math.round(difference * 100) / 100,
          differencePercent: Math.round(differencePercent * 100) / 100
        })
      }
    }

    // 5. Ordenar por diferencia absoluta (los más cercanos primero)
    equivalentTires.sort((a, b) =>
      Math.abs(a.difference) - Math.abs(b.difference)
    )

    return {
      originalSize,
      referenceDiameter,
      toleranceRange,
      equivalentTires,
      totalFound: equivalentTires.length
    }
  } catch (error) {
    console.error('Error finding equivalent tires:', error)
    throw error
  }
}

/**
 * Formatea el tamaño de la cubierta como string (ej: "205/55 R16")
 */
export function formatTireSize(size: TireSize): string {
  return `${size.width}/${size.profile} R${size.diameter}`
}

/**
 * Valida que los valores de entrada sean válidos
 */
export function validateTireSize(size: TireSize): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validar ancho (típicamente entre 125 y 355 mm)
  if (!size.width || size.width < 125 || size.width > 355) {
    errors.push('El ancho debe estar entre 125 y 355 mm')
  }

  // Validar perfil (típicamente entre 25 y 85%)
  if (!size.profile || size.profile < 25 || size.profile > 85) {
    errors.push('El perfil debe estar entre 25 y 85%')
  }

  // Validar diámetro (típicamente entre 12 y 24 pulgadas)
  if (!size.diameter || size.diameter < 12 || size.diameter > 24) {
    errors.push('El diámetro debe estar entre 12 y 24 pulgadas')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
