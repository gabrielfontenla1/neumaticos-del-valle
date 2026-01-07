/**
 * Location Service for WhatsApp Bot
 * Detects user city from messages and maps to nearest branch
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

export interface BranchInfo {
  id: string
  code: string
  name: string
  city: string | null
}

// Map of cities/provinces to branch codes
// Includes common variations and typos
const CITY_BRANCH_MAP: Record<string, string> = {
  // Santiago del Estero
  'santiago': 'SANTIAGO',
  'santiago del estero': 'SANTIAGO',
  'sgo del estero': 'SANTIAGO',
  'sgo': 'SANTIAGO',
  'stgo': 'SANTIAGO',

  // La Banda
  'la banda': 'LA_BANDA',
  'labanda': 'LA_BANDA',
  'banda': 'LA_BANDA',

  // Tucumán
  'tucuman': 'TUCUMAN',
  'tucumán': 'TUCUMAN',
  'san miguel de tucuman': 'TUCUMAN',
  'san miguel de tucumán': 'TUCUMAN',
  'smt': 'TUCUMAN',
  's.m. de tucuman': 'TUCUMAN',

  // Salta
  'salta': 'SALTA',
  'salta capital': 'SALTA',

  // Catamarca
  'catamarca': 'CATAMARCA',
  'san fernando del valle de catamarca': 'CATAMARCA',
  's.f.v. catamarca': 'CATAMARCA',

  // Belgrano (assuming Buenos Aires)
  'belgrano': 'BELGRANO',
  'buenos aires': 'BELGRANO',
  'caba': 'BELGRANO',
  'capital federal': 'BELGRANO',

  // Virgen
  'virgen': 'VIRGEN',
  'la virgen': 'VIRGEN',
}

// Province to default branch mapping
const PROVINCE_BRANCH_MAP: Record<string, string> = {
  'santiago del estero': 'SANTIAGO',
  'tucuman': 'TUCUMAN',
  'tucumán': 'TUCUMAN',
  'salta': 'SALTA',
  'catamarca': 'CATAMARCA',
  'buenos aires': 'BELGRANO',
  'caba': 'BELGRANO',
}

/**
 * Detect city from user message
 * Returns normalized city name or null if not detected
 */
export function detectCityFromMessage(message: string): string | null {
  const normalized = message.toLowerCase().trim()

  // Check for exact matches first
  for (const [city] of Object.entries(CITY_BRANCH_MAP)) {
    if (normalized === city || normalized.includes(city)) {
      return city
    }
  }

  // Check for province mentions
  for (const [province] of Object.entries(PROVINCE_BRANCH_MAP)) {
    if (normalized.includes(province)) {
      return province
    }
  }

  return null
}

/**
 * Get branch code from city name
 */
export function getBranchCodeFromCity(city: string): string | null {
  const normalized = city.toLowerCase().trim()

  // Check city map
  if (CITY_BRANCH_MAP[normalized]) {
    return CITY_BRANCH_MAP[normalized]
  }

  // Check province map
  if (PROVINCE_BRANCH_MAP[normalized]) {
    return PROVINCE_BRANCH_MAP[normalized]
  }

  // Fuzzy match for partial matches
  for (const [key, branchCode] of Object.entries(CITY_BRANCH_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return branchCode
    }
  }

  return null
}

/**
 * Get branch info from branch code
 */
export async function getBranchByCode(branchCode: string): Promise<BranchInfo | null> {
  const { data, error } = await db
    .from('branches')
    .select('id, code, name, city')
    .eq('code', branchCode)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[LocationService] Error getting branch:', error)
    throw error
  }

  return data
}

/**
 * Get nearest branch from user city
 * Returns branch info or null if city not recognized
 */
export async function getNearestBranch(city: string): Promise<BranchInfo | null> {
  const branchCode = getBranchCodeFromCity(city)

  if (!branchCode) {
    return null
  }

  return getBranchByCode(branchCode)
}

/**
 * Get all active branches
 */
export async function getAllBranches(): Promise<BranchInfo[]> {
  const { data, error } = await db
    .from('branches')
    .select('id, code, name, city')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('[LocationService] Error getting branches:', error)
    throw error
  }

  return data || []
}

/**
 * Get branch name for display (user-friendly)
 */
export function getBranchDisplayName(branchCode: string): string {
  const names: Record<string, string> = {
    'SANTIAGO': 'Santiago del Estero',
    'LA_BANDA': 'La Banda',
    'TUCUMAN': 'Tucumán',
    'SALTA': 'Salta',
    'CATAMARCA': 'Catamarca',
    'BELGRANO': 'Belgrano',
    'VIRGEN': 'Virgen',
  }
  return names[branchCode] || branchCode
}
