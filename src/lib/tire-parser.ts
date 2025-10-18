// Tire Description Parser
// Extracts structured data from tire descriptions

export interface TireData {
  // Core tire size
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  construction: string | null // 'R', 'Z', 'BIAS'

  // Load and speed
  load_index: number | null
  speed_rating: string | null

  // Tire characteristics
  extra_load: boolean
  run_flat: boolean
  seal_inside: boolean
  tube_type: boolean
  homologation: string | null

  // Descriptions
  original_description: string
  display_name: string

  // Parsing metadata
  parse_confidence: number // 0-100
  parse_warnings: string[]
}

// Internal codes to remove (not visible to customers)
const INTERNAL_CODES = [
  /\(NB\)[XxSs]+/g,           // (NB)x, (NB)XX, (NB)S
  /\bwl\b/gi,                 // wl
  /\(K1\)/g,                  // (K1)
  /\(KS\)/g,                  // (KS)
  /\(JP\)/g,                  // (JP)
  /\(RO1\)/g,                 // (RO1)
  /\(RO2\)/g,                 // (RO2)
  /\(VOL\)/g,                 // (VOL)
  /\(SEAL\)/gi,               // (SEAL) - unless it's seal inside indicator
]

// Important OEM homologations to KEEP
const HOMOLOGATION_PATTERNS = [
  { pattern: /\(\*\)/g, brand: 'BMW' },
  { pattern: /\(MO\)/gi, brand: 'Mercedes' },
  { pattern: /\(MO1\)/gi, brand: 'Mercedes' },
  { pattern: /\(AO\)/gi, brand: 'Audi' },
  { pattern: /\(N\d\)/g, brand: 'Porsche' }, // N0, N1, N2, etc.
  { pattern: /\(J\)/gi, brand: 'Jaguar' },
  { pattern: /\(F\)/gi, brand: 'Ferrari' },
  { pattern: /\(VOL\)/gi, brand: 'Volvo' },
  { pattern: /\(K1\)/gi, brand: 'Ferrari' }, // K1 is Ferrari homologation
]

/**
 * Clean description for customer display
 * Removes internal codes but keeps important homologations
 */
export function cleanDescriptionForDisplay(description: string): string {
  let cleaned = description.trim()

  // Remove internal codes
  INTERNAL_CODES.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '')
  })

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return cleaned
}

/**
 * Extract homologation from description
 */
function extractHomologation(description: string): string | null {
  for (const { pattern, brand } of HOMOLOGATION_PATTERNS) {
    const match = description.match(pattern)
    if (match) {
      return `${match[0]} ${brand}`
    }
  }
  return null
}

/**
 * Parse metric tire size (e.g., "205/75R15")
 */
function parseMetricSize(description: string): Partial<TireData> {
  // Pattern: width/aspect_ratio + construction + rim_diameter
  // Examples: 205/75R15, 235/60ZR17, 175R13
  const metricPattern = /(\d{2,3})\/(\d{2,3})([RZrz])(\d{2})/
  const metricNoAspectPattern = /(\d{2,3})([RZrz])(\d{2})/

  let match = description.match(metricPattern)
  if (match) {
    return {
      width: parseInt(match[1]),
      aspect_ratio: parseInt(match[2]),
      construction: match[3].toUpperCase(),
      rim_diameter: parseInt(match[4]),
    }
  }

  // Try pattern without aspect ratio (e.g., 175R13)
  match = description.match(metricNoAspectPattern)
  if (match) {
    return {
      width: parseInt(match[1]),
      aspect_ratio: null,
      construction: match[2].toUpperCase(),
      rim_diameter: parseInt(match[3]),
    }
  }

  return {}
}

/**
 * Parse load index and speed rating (e.g., "99T", "104H")
 */
function parseLoadSpeed(description: string): Partial<TireData> {
  // Pattern: load_index + speed_rating
  // Examples: 99T, 104H, 91V
  const pattern = /\b(\d{2,3})([A-Z])\b/g
  const matches = [...description.matchAll(pattern)]

  if (matches.length > 0) {
    // Usually the first match after the size is load/speed
    const match = matches[0]
    return {
      load_index: parseInt(match[1]),
      speed_rating: match[2],
    }
  }

  return {}
}

/**
 * Detect tire characteristics
 */
function detectCharacteristics(description: string): Partial<TireData> {
  const upper = description.toUpperCase()

  return {
    extra_load: /\bXL\b/i.test(description),
    run_flat: /\b(R-?F|RUN-?FLAT)\b/i.test(description),
    seal_inside: /\b(S-?I|SEAL-?INSIDE)\b/i.test(description),
    tube_type: /\bTT\b/i.test(description),
  }
}

/**
 * Calculate parsing confidence based on extracted data
 */
function calculateConfidence(data: Partial<TireData>): number {
  let score = 0
  const weights = {
    width: 20,
    aspect_ratio: 15,
    rim_diameter: 20,
    construction: 15,
    load_index: 15,
    speed_rating: 15,
  }

  if (data.width) score += weights.width
  if (data.aspect_ratio) score += weights.aspect_ratio
  if (data.rim_diameter) score += weights.rim_diameter
  if (data.construction) score += weights.construction
  if (data.load_index) score += weights.load_index
  if (data.speed_rating) score += weights.speed_rating

  return score
}

/**
 * Generate parsing warnings
 */
function generateWarnings(data: Partial<TireData>, description: string): string[] {
  const warnings: string[] = []

  if (!data.width) warnings.push('Width not detected')
  if (!data.rim_diameter) warnings.push('Rim diameter not detected')
  if (!data.construction) warnings.push('Construction type not detected')
  if (!data.load_index) warnings.push('Load index not detected')
  if (!data.speed_rating) warnings.push('Speed rating not detected')

  // Check if description looks complex
  if (description.includes('/') && description.includes('R') && warnings.length > 2) {
    warnings.push('Complex format - manual review recommended')
  }

  return warnings
}

/**
 * Main parsing function
 * Extracts all tire data from a description string
 */
export function parseTireDescription(description: string): TireData {
  const original = description.trim()

  // Extract size information
  const sizeData = parseMetricSize(original)

  // Extract load and speed
  const loadSpeedData = parseLoadSpeed(original)

  // Detect characteristics
  const characteristics = detectCharacteristics(original)

  // Extract homologation
  const homologation = extractHomologation(original)

  // Clean for display
  const display_name = cleanDescriptionForDisplay(original)

  // Combine all data
  const parsedData: Partial<TireData> = {
    ...sizeData,
    ...loadSpeedData,
    ...characteristics,
    homologation,
    original_description: original,
    display_name,
  }

  // Calculate confidence and warnings
  const parse_confidence = calculateConfidence(parsedData)
  const parse_warnings = generateWarnings(parsedData, original)

  return {
    width: parsedData.width || null,
    aspect_ratio: parsedData.aspect_ratio || null,
    rim_diameter: parsedData.rim_diameter || null,
    construction: parsedData.construction || null,
    load_index: parsedData.load_index || null,
    speed_rating: parsedData.speed_rating || null,
    extra_load: parsedData.extra_load || false,
    run_flat: parsedData.run_flat || false,
    seal_inside: parsedData.seal_inside || false,
    tube_type: parsedData.tube_type || false,
    homologation: parsedData.homologation || null,
    original_description: original,
    display_name,
    parse_confidence,
    parse_warnings,
  }
}

/**
 * Batch parse multiple tire descriptions
 */
export function parseTireDescriptionBatch(descriptions: string[]): TireData[] {
  return descriptions.map(parseTireDescription)
}
