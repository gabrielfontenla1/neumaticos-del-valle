/**
 * Sistema de Mapeo de Imágenes de Neumáticos
 *
 * Este archivo centraliza toda la lógica de mapeo entre modelos de neumáticos
 * y sus imágenes correspondientes.
 *
 * IMPORTANTE:
 * - El orden de los mappings importa: más específicos primero
 * - Los patterns se buscan con .includes() en uppercase
 * - Mantener sincronizado con los archivos en /public/
 *
 * Para agregar un nuevo modelo:
 * 1. Agregar la imagen en /public/ con formato: {marca}-{modelo}.{ext}
 * 2. Agregar el mapping aquí en la posición correcta (más específico primero)
 * 3. Ejecutar script de migración si hay productos existentes
 *
 * @see /docs/TIRE-IMAGE-MAPPING.md para documentación completa
 */

export interface TireImageMapping {
  /** Patrón a buscar en el nombre del producto (string o RegExp) */
  pattern: string | RegExp;
  /** Ruta de la imagen relativa a /public */
  image: string;
  /** Marca del neumático */
  brand: string;
}

/**
 * Mapeo de modelos a imágenes
 * ORDENADO POR ESPECIFICIDAD (más específico primero)
 */
export const TIRE_IMAGE_MAPPINGS: TireImageMapping[] = [
  // ============================================
  // PIRELLI - Modelos específicos primero
  // ============================================

  // Scorpion - variantes específicas primero
  { pattern: 'SCORPION VERDE ALL SEASON', image: '/pirelli-scorpion-verde-all-season.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ZERO ALL SEASON', image: '/pirelli-scorpion-zero-all-season.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ZERO ASIMMETRICO', image: '/pirelli-scorpion-zero-asimmetrico.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ALL TERRAIN PLUS', image: '/pirelli-scorpion-at-plus.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ALL TERRAIN', image: '/pirelli-scorpion-at-plus.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION VERDE', image: '/pirelli-scorpion-verde.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ZERO', image: '/pirelli-scorpion-zero.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION ATR', image: '/pirelli-scorpion-atr.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION MTR', image: '/pirelli-scorpion-mtr.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPION HT', image: '/pirelli-scorpion-ht.webp', brand: 'PIRELLI' },
  { pattern: 'SCORPN', image: '/pirelli-scorpion.webp', brand: 'PIRELLI' }, // Abreviatura común
  { pattern: 'SCORPION', image: '/pirelli-scorpion.webp', brand: 'PIRELLI' },

  // Cinturato
  { pattern: 'CINTURATO P7', image: '/pirelli-cinturato-p7.webp', brand: 'PIRELLI' },
  { pattern: 'CINTURATO P1', image: '/pirelli-cinturato-p1.webp', brand: 'PIRELLI' },
  { pattern: 'CINTURATO', image: '/pirelli-cinturato-p7.webp', brand: 'PIRELLI' },

  // P Zero - variantes específicas primero
  { pattern: 'P ZERO CORSA SYSTEM', image: '/pirelli-pzero-corsa-system.webp', brand: 'PIRELLI' },
  { pattern: 'PZERO CORSA SYSTEM', image: '/pirelli-pzero-corsa-system.webp', brand: 'PIRELLI' },
  { pattern: 'P ZERO CORSA', image: '/pirelli-pzero-corsa.webp', brand: 'PIRELLI' },
  { pattern: 'PZERO CORSA', image: '/pirelli-pzero-corsa.webp', brand: 'PIRELLI' },
  { pattern: 'P-ZERO', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'P ZERO', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'PZERO', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },

  // Otros modelos Pirelli
  { pattern: 'P400 EVO', image: '/pirelli-p400-evo.webp', brand: 'PIRELLI' },
  { pattern: 'P400EVO', image: '/pirelli-p400-evo.webp', brand: 'PIRELLI' },
  { pattern: 'P400', image: '/pirelli-p400-evo.webp', brand: 'PIRELLI' },
  { pattern: 'CHRONO', image: '/pirelli-chrono.webp', brand: 'PIRELLI' },
  { pattern: 'NERO GT', image: '/nerogt.jpg', brand: 'PIRELLI' },
  { pattern: 'NEROGT', image: '/nerogt.jpg', brand: 'PIRELLI' },
  { pattern: 'P6000', image: '/p6000.jpg', brand: 'PIRELLI' },
  { pattern: 'POWERGY', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'PWRGY', image: '/pirelli-pzero.webp', brand: 'PIRELLI' },
  { pattern: 'CARRIER', image: '/pirelli-chrono.webp', brand: 'PIRELLI' },

  // ============================================
  // FORMULA - Modelos específicos primero
  // ============================================

  { pattern: 'FORMULA ENERGY', image: '/formula-energy.jpg', brand: 'FORMULA' },
  { pattern: 'F.ENERGY', image: '/formula-energy.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA EVO', image: '/formula-evo.jpg', brand: 'FORMULA' },
  { pattern: 'F.EVO', image: '/formula-evo.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA S/T', image: '/formula-st.jpg', brand: 'FORMULA' },
  { pattern: 'F.S/T', image: '/formula-st.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA SPIDER', image: '/spider.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA DRAGON', image: '/dragon.jpg', brand: 'FORMULA' },
  { pattern: 'FORMULA AT', image: '/formula-st.jpg', brand: 'FORMULA' },
];

/**
 * Imágenes de fallback por marca
 * Se usan cuando no hay coincidencia específica
 */
export const BRAND_FALLBACKS: Record<string, string> = {
  'PIRELLI': '/pirelli-scorpion.webp',
  'FORMULA': '/formula-energy.jpg',
  'DEFAULT': '/tire.webp'
};

/**
 * Obtiene la imagen correspondiente para un producto de neumático
 *
 * @param productName - Nombre completo del producto (ej: "205/55R16 91V SCORPION VERDE")
 * @param brand - Marca del producto (ej: "PIRELLI")
 * @returns Ruta de la imagen relativa a /public
 *
 * @example
 * getTireImage("205/55R16 91V SCORPION VERDE", "PIRELLI")
 * // returns "/pirelli-scorpion-verde.webp"
 *
 * getTireImage("185/65R15 88H FORMULA ENERGY", "FORMULA")
 * // returns "/formula-energy.jpg"
 */
export function getTireImage(productName: string, brand: string): string {
  if (!productName || !brand) {
    return BRAND_FALLBACKS['DEFAULT'];
  }

  const searchText = productName.toUpperCase();
  const brandUpper = brand.toUpperCase();

  // Buscar coincidencia específica (ordenado por especificidad)
  for (const mapping of TIRE_IMAGE_MAPPINGS) {
    // Solo buscar en mappings de la misma marca
    if (mapping.brand !== brandUpper) {
      continue;
    }

    if (typeof mapping.pattern === 'string') {
      if (searchText.includes(mapping.pattern)) {
        return mapping.image;
      }
    } else if (mapping.pattern.test(searchText)) {
      return mapping.image;
    }
  }

  // Fallback por marca
  return BRAND_FALLBACKS[brandUpper] || BRAND_FALLBACKS['DEFAULT'];
}

/**
 * Verifica si una imagen existe para un modelo dado
 * Útil para debugging y validación
 */
export function hasImageMapping(productName: string, brand: string): boolean {
  const image = getTireImage(productName, brand);
  const fallback = BRAND_FALLBACKS[brand.toUpperCase()] || BRAND_FALLBACKS['DEFAULT'];
  return image !== fallback;
}

/**
 * Obtiene todos los modelos mapeados para una marca
 * Útil para documentación y debugging
 */
export function getMappingsForBrand(brand: string): TireImageMapping[] {
  return TIRE_IMAGE_MAPPINGS.filter(m => m.brand === brand.toUpperCase());
}

/**
 * Lista todas las imágenes únicas usadas en el mapeo
 * Útil para verificar que todos los archivos existen
 */
export function getAllMappedImages(): string[] {
  const images = new Set<string>();
  TIRE_IMAGE_MAPPINGS.forEach(m => images.add(m.image));
  Object.values(BRAND_FALLBACKS).forEach(img => images.add(img));
  return Array.from(images).sort();
}
