/**
 * Matcher de sucursales/branches para el bot de turnos
 */

import { createClient } from '@supabase/supabase-js'
import type { Branch, BranchMatch } from './types'

// Cliente Supabase sin tipos estrictos
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

// ============================================================================
// CACHE DE SUCURSALES
// ============================================================================

let branchesCache: Branch[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos (cambia menos frecuente)

/**
 * Obtiene las sucursales disponibles (con cache)
 */
export async function getAvailableBranches(): Promise<Branch[]> {
  const now = Date.now()

  if (branchesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return branchesCache
  }

  const { data, error } = await db
    .from('stores')
    .select('id, name, address, phone, active')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('[BranchMatcher] Error fetching branches:', error)
    return branchesCache || []
  }

  branchesCache = (data || []).map((b: { id: string; name: string; address: string | null; phone: string | null; active: boolean }) => ({
    id: b.id,
    name: b.name,
    address: b.address || '',
    phone: b.phone || '',
    isActive: b.active
  }))
  cacheTimestamp = now

  return branchesCache
}

// ============================================================================
// ALIASES DE SUCURSALES
// ============================================================================

// Mapeo de nombres comunes/abreviaciones a nombres de sucursales
const BRANCH_ALIASES: Record<string, string[]> = {
  'tunuyán': ['tunuyan', 'tunuyán', 'tunu', '1', 'uno', 'primera'],
  'tupungato': ['tupungato', 'tupu', '2', 'dos', 'segunda'],
  'san carlos': ['san carlos', 'sancarlos', 'sc', '3', 'tres', 'tercera']
}

// ============================================================================
// FUNCIONES DE MATCHING
// ============================================================================

/**
 * Busca la sucursal que mejor coincide con el input del usuario
 */
export async function matchBranch(input: string): Promise<BranchMatch | null> {
  const branches = await getAvailableBranches()
  const normalized = normalizeText(input)

  // Si es un número, buscar por posición en lista
  const numMatch = input.match(/^(\d+)$/)
  if (numMatch) {
    const index = parseInt(numMatch[1], 10) - 1
    if (index >= 0 && index < branches.length) {
      return {
        branch: branches[index],
        confidence: 1.0,
        matchedOn: `option ${index + 1}`
      }
    }
  }

  let bestMatch: BranchMatch | null = null

  for (const branch of branches) {
    const confidence = calculateBranchConfidence(normalized, branch)

    if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
      bestMatch = {
        branch,
        confidence,
        matchedOn: normalized
      }
    }
  }

  return bestMatch
}

/**
 * Calcula la confianza del match entre input y sucursal
 */
function calculateBranchConfidence(input: string, branch: Branch): number {
  const branchName = normalizeText(branch.name)

  // 1. Match exacto del nombre
  if (input === branchName) {
    return 1.0
  }

  // 2. El nombre contiene el input (o viceversa)
  if (branchName.includes(input) || input.includes(branchName)) {
    return 0.9
  }

  // 3. Match por aliases
  for (const [canonical, aliases] of Object.entries(BRANCH_ALIASES)) {
    if (branchName.includes(normalizeText(canonical))) {
      for (const alias of aliases) {
        if (input === normalizeText(alias)) {
          return 0.95
        }
        if (input.includes(normalizeText(alias))) {
          return 0.8
        }
      }
    }
  }

  // 4. Match por similitud
  const similarity = calculateSimilarity(input, branchName)
  if (similarity > 0.6) {
    return similarity * 0.75
  }

  // 5. Match parcial por palabras
  const inputWords = input.split(/\s+/)
  const branchWords = branchName.split(/\s+/)

  for (const inputWord of inputWords) {
    if (inputWord.length < 3) continue
    for (const branchWord of branchWords) {
      if (branchWord.startsWith(inputWord) || inputWord.startsWith(branchWord)) {
        return 0.7
      }
    }
  }

  return 0
}

/**
 * Normaliza texto para comparación
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calcula similitud entre dos strings
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1

  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a

  if (longer.length === 0) return 1

  const matrix: number[][] = []

  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      if (shorter[i - 1] === longer[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  const distance = matrix[shorter.length][longer.length]
  return (longer.length - distance) / longer.length
}

/**
 * Obtiene la sucursal por ID
 */
export async function getBranchById(branchId: string): Promise<Branch | null> {
  const branches = await getAvailableBranches()
  return branches.find(b => b.id === branchId) || null
}
