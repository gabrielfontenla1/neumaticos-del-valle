/**
 * Utilidades mejoradas para la importación de productos desde Excel
 * Incluye todas las normalizaciones y casos especiales
 */

import { getTireImage } from '@/config/tire-image-mapping'

// Columnas que representan stock por sucursal
const BRANCH_STOCK_COLUMNS = [
  'BELGRANO',
  'CATAMARCA',
  'LA_BANDA',
  'SALTA',
  'TUCUMAN',
  'VIRGEN'
]

/**
 * Extrae las dimensiones del neumático desde la descripción
 * Maneja múltiples formatos incluyendo casos especiales
 */
export function parseTireSize(description: string): {
  width: number | null
  profile: number | null
  diameter: number | null
} {
  if (!description) {
    return { width: null, profile: null, diameter: null }
  }

  // Limpiar la descripción antes de parsear
  const cleanDesc = description.toUpperCase().trim()

  // Patrones estándar de medidas de neumáticos (ej: 175/65R15)
  const standardPatterns = [
    /(\d{3})\/(\d{2})R(\d{2})/,      // 175/65R15
    /(\d{3})\/(\d{2})\s*R\s*(\d{2})/, // 175/65 R 15
    /(\d{3})\/(\d{2})[-\s]+R(\d{2})/, // 175/65-R15
    /(\d{3})\/(\d{2})[A-Z]R(\d{2})/,  // 175/65ZR15
  ]

  for (const pattern of standardPatterns) {
    const match = cleanDesc.match(pattern)
    if (match) {
      return {
        width: parseInt(match[1]),
        profile: parseInt(match[2]),
        diameter: parseInt(match[3])
      }
    }
  }

  // Patrón para formatos como "31X10.50R15LT" (usando X en lugar de /)
  const xFormatMatch = cleanDesc.match(/(\d{2,3})X(\d{1,2}\.?\d*)R(\d{2})/i)
  if (xFormatMatch) {
    // Estos formatos usan pulgadas, convertir a mm
    const inchWidth = parseInt(xFormatMatch[1])
    const inchHeight = parseFloat(xFormatMatch[2])
    return {
      width: Math.round(inchWidth * 25.4), // Convertir pulgadas a mm
      profile: Math.round((inchHeight / inchWidth) * 100), // Calcular aspect ratio
      diameter: parseInt(xFormatMatch[3])
    }
  }

  // Patrón para formatos como "6.00-16" o "6.50-16" (antiguos)
  const dashFormatMatch = cleanDesc.match(/(\d+)\.(\d+)-(\d{2})/)
  if (dashFormatMatch) {
    // Estos formatos son especiales, mantener el nombre original
    return {
      width: null,
      profile: null,
      diameter: parseInt(dashFormatMatch[3])
    }
  }

  // Patrón para formatos como "5.20S12" (con S)
  const sFormatMatch = cleanDesc.match(/(\d+)\.(\d+)S(\d+)/)
  if (sFormatMatch) {
    return {
      width: null,
      profile: null,
      diameter: parseInt(sFormatMatch[3])
    }
  }

  // Patrón para formatos como "7.50R16" (sin profile)
  const noProfileMatch = cleanDesc.match(/(\d+)\.(\d+)R(\d{2})/)
  if (noProfileMatch) {
    return {
      width: null,
      profile: null,
      diameter: parseInt(noProfileMatch[3])
    }
  }

  return { width: null, profile: null, diameter: null }
}

/**
 * Limpia la descripción del producto eliminando todos los códigos extraños
 */
export function cleanDescription(desc: string | undefined): string {
  if (!desc) return ''

  let cleaned = String(desc)

  // Eliminar códigos entre paréntesis como (NB)x, (K1), (* etc.
  cleaned = cleaned.replace(/\s*\([^)]*\)[x]?\s*/g, ' ')

  // Eliminar códigos extraños específicos
  cleaned = cleaned.replace(/-@\s*[A-Z]{2}\s*/gi, ' ')
  cleaned = cleaned.replace(/\bEUFO-@\s*[A-Z]{2}\s*/gi, 'EUFO')
  cleaned = cleaned.replace(/\(\*/g, ' ')
  cleaned = cleaned.replace(/\bas\+\d+\s*/gi, ' ')
  cleaned = cleaned.replace(/\bS-AS\+\d+\s*/gi, ' ')

  // Eliminar paréntesis sueltos y asteriscos
  cleaned = cleaned.replace(/\(\*+/g, ' ')
  cleaned = cleaned.replace(/\*+\)/g, ' ')

  // Eliminar códigos al final
  cleaned = cleaned.replace(/\s+wl\s*$/i, '')
  cleaned = cleaned.replace(/\s+as\s*$/i, '')
  cleaned = cleaned.replace(/\s+xl\s*$/i, '')

  // Eliminar múltiples espacios
  cleaned = cleaned.split(/\s+/).join(' ')

  return cleaned.trim()
}

/**
 * Normaliza el nombre del modelo expandiendo abreviaciones y eliminando indicadores
 */
export function normalizeModelName(model: string | undefined): string {
  if (!model) return ''

  let normalized = String(model)

  // Primero, limpiar la descripción
  normalized = cleanDescription(normalized)

  // Manejar casos especiales de Cinturato
  normalized = normalized.replace(/\bP1\s*cint\b/gi, 'CINTURATO P1')
  normalized = normalized.replace(/\bP7\s*cint\b/gi, 'CINTURATO P7')
  normalized = normalized.replace(/\bP7-CNT\b/gi, 'CINTURATO P7')
  normalized = normalized.replace(/\bcint\s*P1\b/gi, 'CINTURATO P1')
  normalized = normalized.replace(/\bcint\s*P7\b/gi, 'CINTURATO P7')

  // Mapeo completo de abreviaciones a nombres completos
  const abbreviations: Record<string, string> = {
    'PWRGY': 'POWERGY',
    'SCORPN': 'SCORPION',
    'S-A/T+': 'SCORPION ALL TERRAIN PLUS',
    'S-AT+': 'SCORPION ALL TERRAIN PLUS',
    'CINT ': 'CINTURATO ',
    'CINTUR ': 'CINTURATO ',
    'PZERO': 'P ZERO',
    'P-ZERO': 'P ZERO',
    'P0': 'P ZERO',
    'FORM ': 'FORMULA ',
    'SCORP ': 'SCORPION ',
    'P ZRRO': 'P ZERO',
    'P.ZERO': 'P ZERO',
  }

  // Expandir abreviaciones
  for (const [abbrev, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    normalized = normalized.replace(regex, full)
  }

  // Eliminar indicadores técnicos (no son parte del modelo)
  const technicalIndicators = [
    /\s*R-F\s*/gi,    // Run-flat
    /\s*s-i\s*/gi,    // Seal inside
    /\s*XL\s*/gi,     // Extra load
    /\s*wl\s*/gi,     // White lettering
    /\s*M\+S\s*/gi,   // Mud + Snow
    /\s*as\s*$/gi,    // All season (al final)
    /\s*\(.*?\)\s*/gi, // Cualquier cosa entre paréntesis
  ]

  for (const indicator of technicalIndicators) {
    normalized = normalized.replace(indicator, ' ')
  }

  // Limpiar espacios múltiples
  normalized = normalized.split(/\s+/).join(' ')

  return normalized.trim()
}

/**
 * Determina la categoría del producto basada en las dimensiones y descripción
 */
export function determineCategory(description: string, width: number | null): string {
  const desc = description.toUpperCase()

  // Neumáticos de moto
  if (desc.includes('M/C') || desc.includes('TT ') ||
      desc.includes('MT 60') || desc.includes('SUPER CITY')) {
    return 'moto'
  }

  // Neumáticos de camión
  if (desc.includes('C ') || desc.includes('LT') ||
      desc.endsWith('C') || desc.includes('CARRIER') ||
      desc.includes('CHRONO') || desc.includes('TT AR') ||
      desc.includes('TT SE') || desc.includes('TT MT')) {
    return 'camion'
  }

  // Neumáticos de camioneta/SUV
  if ((width && width >= 235) ||
      desc.includes('SCORPION') ||
      desc.includes('SUV') ||
      desc.includes('4X4') ||
      desc.includes('AT ') ||
      desc.includes('ATR') ||
      desc.includes('MTR')) {
    return 'camioneta'
  }

  // Por defecto, auto
  if (width && width < 195) {
    return 'auto'
  }

  return 'auto'
}

/**
 * Procesa el stock por sucursales desde las columnas del Excel
 */
export function processStockBySucursal(row: Record<string, any>): {
  totalStock: number
  stockPorSucursal: Record<string, number>
} {
  let totalStock = 0
  const stockPorSucursal: Record<string, number> = {}

  for (const column of BRANCH_STOCK_COLUMNS) {
    const branchName = column.toLowerCase()
    const stockValue = row[column]

    if (stockValue !== undefined && stockValue !== null) {
      try {
        const stock = parseInt(String(stockValue))
        stockPorSucursal[branchName] = isNaN(stock) ? 0 : stock
        totalStock += stockPorSucursal[branchName]
      } catch {
        stockPorSucursal[branchName] = 0
      }
    } else {
      stockPorSucursal[branchName] = 0
    }
  }

  return { totalStock, stockPorSucursal }
}

/**
 * Normaliza una fila del Excel para importación
 */
export function normalizeExcelRow(row: Record<string, any>) {
  const columnMapping: Record<string, string> = {
    'CODIGO_PROPIO': 'codigo_propio',
    'CODIGO_PROVEEDOR': 'codigo_proveedor',
    'DESCRIPCION': 'descripcion',
    'GRUPO': 'grupo',
    'PROVEEDOR': 'proveedor',
    'CATEGORIA': 'categoria_original',
    'RUBRO': 'rubro',
    'SUBRUBRO': 'subrubro',
    'MARCA': 'marca'
  }

  const mappedRow: Record<string, any> = {}

  // Mapear columnas conocidas
  for (const [excelColumn, mappedColumn] of Object.entries(columnMapping)) {
    if (row[excelColumn] !== undefined) {
      mappedRow[mappedColumn] = row[excelColumn]
    }
  }

  // Copiar columnas de stock de sucursales
  for (const column of BRANCH_STOCK_COLUMNS) {
    if (row[column] !== undefined) {
      mappedRow[column] = row[column]
    }
  }

  // Copiar otras columnas no mapeadas
  for (const [key, value] of Object.entries(row)) {
    if (!mappedRow[key] && !Object.keys(columnMapping).includes(key)) {
      mappedRow[key] = value
    }
  }

  return mappedRow
}

/**
 * Convierte una fila normalizada a un objeto producto para Supabase
 */
export function convertToProduct(row: Record<string, any>) {
  // Limpiar y normalizar la descripción
  const rawDescription = row.descripcion || row.DESCRIPCION || row.description || row.name || ''
  const description = cleanDescription(rawDescription)
  const modelNormalized = normalizeModelName(description)

  // Extraer dimensiones
  const tireSize = parseTireSize(modelNormalized)

  // Procesar stock por sucursales si aplica
  const { totalStock, stockPorSucursal } = processStockBySucursal(row)

  // Determinar categoría
  const categoriaExcel = String(row.CATEGORIA || row.categoria || '').toUpperCase()
  let category = ''

  if (categoriaExcel.includes('CON') || categoriaExcel.includes('CAR')) {
    category = determineCategory(modelNormalized, tireSize.width)
  } else if (categoriaExcel.includes('SUV') || categoriaExcel.includes('CAMIONETA')) {
    category = 'camioneta'
  } else if (categoriaExcel.includes('CAMION')) {
    category = 'camion'
  } else if (categoriaExcel.includes('MOTO')) {
    category = 'moto'
  } else {
    category = determineCategory(modelNormalized, tireSize.width)
  }

  // Validar categoría
  const validCategories = ['auto', 'camioneta', 'camion', 'moto']
  if (!validCategories.includes(category)) {
    category = 'auto'
  }

  // Crear nombre del producto
  let name = modelNormalized

  // Solo agregar dimensiones si son válidas y completas
  if (tireSize.width && tireSize.profile && tireSize.diameter &&
      tireSize.width > 0 && tireSize.profile > 0 && tireSize.diameter > 0) {
    name = `${tireSize.width}/${tireSize.profile}R${tireSize.diameter} ${modelNormalized}`
  }

  // Validar que el nombre sea válido
  if (!name || name.length < 3 || name === '/R' || name.startsWith('0/0')) {
    name = modelNormalized || description || 'PRODUCTO SIN NOMBRE'
  }

  // Limpiar códigos
  const codigoPropio = String(row.codigo_propio || row.CODIGO_PROPIO || '').replace(/[[\]]/g, '').trim()
  const codigoProveedor = String(row.codigo_proveedor || row.CODIGO_PROVEEDOR || '').replace(/[[\]]/g, '').trim()

  // Obtener marca - primero del Excel, luego detectar del nombre si es PIRELLI o vacío
  let brand = String(row.marca || row.MARCA || row.brand || '').toUpperCase().trim()

  // Si la marca está vacía o es PIRELLI, intentar detectarla del nombre del producto
  // Esto permite identificar marcas como FORMULA que vienen etiquetadas como PIRELLI
  if (!brand || brand === 'PIRELLI') {
    brand = detectBrandFromName(name, brand || 'PIRELLI')
  }

  // Manejo de precios
  const priceList = parseFloat(row.PUBLICO || row.price_list || row.precio_lista || 0)
  const priceSale = parseFloat(row.CONTADO || row.price || row.precio || 0)

  // Si no hay precio de venta pero sí precio de lista, aplicar descuento del 25%
  const finalPrice = priceSale || (priceList ? priceList * 0.75 : 100000)
  const finalPriceList = priceList || (priceSale ? priceSale / 0.75 : 0)

  // Determinar la imagen del producto basada en el modelo y marca
  // Usa el sistema centralizado de mapeo de imágenes
  const imageUrl = getTireImage(name, brand)

  return {
    name: name.substring(0, 200),
    brand,
    model: modelNormalized.substring(0, 100),
    category,
    width: tireSize.width,
    profile: tireSize.profile,
    diameter: tireSize.diameter,
    price: finalPrice,
    price_list: finalPriceList,
    stock: totalStock || parseInt(row.stock || 0),
    description: modelNormalized,
    features: {
      codigo_propio: codigoPropio,
      codigo_proveedor: codigoProveedor,
      proveedor: row.proveedor || row.PROVEEDOR || '',
      rubro: row.rubro || row.RUBRO || '',
      subrubro: row.subrubro || row.SUBRUBRO || '',
      stock_por_sucursal: stockPorSucursal,
      price_list: finalPriceList,
      discount_percentage: finalPriceList > finalPrice ?
        Math.round(((finalPriceList - finalPrice) / finalPriceList) * 100) : 0
    },
    image_url: imageUrl
  }
}

/**
 * @deprecated Usar getTireImage() de '@/config/tire-image-mapping' en su lugar.
 * Esta función se mantiene por compatibilidad pero será eliminada en futuras versiones.
 *
 * Mapea un modelo de producto Pirelli a su imagen correspondiente
 */
export function mapPirelliModelToImage(brand: string, model: string, description: string): string {
  // Redirigir al nuevo sistema centralizado
  return getTireImage(`${model} ${description}`, brand)
}


/**
 * Detecta la marca del producto a partir del nombre
 * Útil cuando el Excel tiene todo como "PIRELLI" pero hay otras marcas como FORMULA
 */
export function detectBrandFromName(name: string, defaultBrand: string = 'PIRELLI'): string {
  if (!name) return defaultBrand

  const nameUpper = name.toUpperCase()

  // FORMULA es una marca separada (aunque pertenece al grupo Pirelli)
  // Patrones: "FORMULA ENERGY", "FORMULA EVO", "FORMULA S/T", "FORMULA AT", etc.
  if (/\bFORMULA\s+(ENERGY|EVO|SPIDER|DRAGON|S\/T|AT|A\/T)\b/i.test(nameUpper) ||
      /\bFORMULA\b/.test(nameUpper)) {
    return 'FORMULA'
  }

  // Otras marcas que podrían estar en el nombre
  const brandPatterns: { pattern: RegExp; brand: string }[] = [
    { pattern: /\bCONTINENTAL\b/i, brand: 'CONTINENTAL' },
    { pattern: /\bMICHELIN\b/i, brand: 'MICHELIN' },
    { pattern: /\bBRIDGESTONE\b/i, brand: 'BRIDGESTONE' },
    { pattern: /\bGOODYEAR\b/i, brand: 'GOODYEAR' },
    { pattern: /\bDUNLOP\b/i, brand: 'DUNLOP' },
    { pattern: /\bFIRESTONE\b/i, brand: 'FIRESTONE' },
    { pattern: /\bFATE\b/i, brand: 'FATE' },
  ]

  for (const { pattern, brand } of brandPatterns) {
    if (pattern.test(nameUpper)) {
      return brand
    }
  }

  return defaultBrand
}

/**
 * Detecta si el Excel tiene formato de columnas por sucursal
 */
export function hasStockBySucursal(headers: string[]): boolean {
  return BRANCH_STOCK_COLUMNS.some(branch =>
    headers.some(header => header.toUpperCase().includes(branch))
  )
}

/**
 * Genera un precio realista basado en las dimensiones y categoría
 */
export function generateRealisticPrice(
  width: number | null,
  diameter: number | null,
  category: string,
  brand: string = 'PIRELLI'
): number {
  // Precio base por categoría
  const basePrices: Record<string, number> = {
    'moto': 35000,
    'auto': 65000,
    'camioneta': 95000,
    'camion': 150000
  }

  let price = basePrices[category] || 65000

  // Ajuste por ancho
  if (width) {
    if (width < 155) price *= 0.85
    else if (width >= 155 && width < 175) price *= 0.95
    else if (width >= 175 && width < 195) price *= 1.0
    else if (width >= 195 && width < 215) price *= 1.15
    else if (width >= 215 && width < 235) price *= 1.35
    else if (width >= 235 && width < 255) price *= 1.55
    else if (width >= 255) price *= 1.75
  }

  // Ajuste por diámetro
  if (diameter) {
    if (diameter < 14) price *= 0.9
    else if (diameter === 14) price *= 0.95
    else if (diameter === 15) price *= 1.0
    else if (diameter === 16) price *= 1.1
    else if (diameter === 17) price *= 1.2
    else if (diameter === 18) price *= 1.35
    else if (diameter === 19) price *= 1.5
    else if (diameter >= 20) price *= 1.7
  }

  // Ajuste por marca
  const brandMultipliers: Record<string, number> = {
    'MICHELIN': 1.3,
    'BRIDGESTONE': 1.25,
    'PIRELLI': 1.2,
    'GOODYEAR': 1.15,
    'CONTINENTAL': 1.15,
    'DUNLOP': 1.1,
    'YOKOHAMA': 1.05,
    'FIRESTONE': 1.0,
    'FATE': 0.85,
    'NEXEN': 0.9,
    'KUMHO': 0.9
  }

  const brandUpper = brand.toUpperCase()
  if (brandMultipliers[brandUpper]) {
    price *= brandMultipliers[brandUpper]
  }

  // Redondear a múltiplos de 1000
  return Math.round(price / 1000) * 1000
}