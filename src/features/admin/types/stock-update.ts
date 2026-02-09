/**
 * Stock Update Types
 *
 * Shared types for stock update persistence and verification system.
 */

export type SourceType = 'pirelli' | 'corven'

/**
 * Serialized log entry for storage (Date as ISO string)
 */
export interface SerializedLogEntry {
  id: string
  timestamp: string // ISO string
  type: 'info' | 'success' | 'warning' | 'error' | 'processing'
  codigo?: string
  message: string
  details?: {
    precio?: number
    stock?: number
    descripcion?: string
  }
}

/**
 * Progress data during stock update
 */
export interface ProgressData {
  current: number
  total: number
  percent: number
}

/**
 * Stats accumulated during update
 */
export interface UpdateStats {
  updated: number
  notFound: number
  errors: number
  skipped: number
}

/**
 * Update result from API
 */
export interface UpdateResult {
  success: boolean
  mode: 'prices_and_stock' | 'prices_only' | 'stock_only'
  source: SourceType
  totalRows: number
  updated: number
  notFound: number
  skipped?: number
  created: number
  errors: Array<{ codigo: string; error: string }>
  priceUpdates: number
  stockUpdates: number
  formatMismatch: boolean
  mismatchWarning?: string
}

/**
 * Excel row data cached for verification
 */
export interface ExcelRowCache {
  codigo_propio: string
  descripcion: string
  contado: number
  publico: number
  stock_total: number
  stock_by_branch: Record<string, number>
}

/**
 * Session state to persist
 */
export interface StockUpdateSession {
  /** Session ID for tracking */
  sessionId: string
  /** When the session started */
  startTime: string // ISO string
  /** Last activity timestamp */
  lastActivity: string // ISO string
  /** Source type being processed */
  source: SourceType
  /** Original file metadata */
  file: {
    name: string
    size: number
    lastModified: number
  }
  /** Current progress */
  progress: ProgressData
  /** Accumulated stats */
  stats: UpdateStats
  /** Is the update currently running */
  isRunning: boolean
  /** Final result if completed */
  updateResult?: UpdateResult
  /** Cached Excel data for verification (limited to prevent quota issues) */
  excelData?: ExcelRowCache[]
}

/**
 * Storage keys for persistence
 */
export const STOCK_UPDATE_STORAGE_KEYS = {
  SESSION: 'stock_update_session',
  LOGS: 'stock_update_logs',
} as const

/**
 * Max logs to persist (to prevent storage quota issues)
 */
export const MAX_PERSISTED_LOGS = 1000

/**
 * Max Excel rows to cache for verification
 */
export const MAX_CACHED_EXCEL_ROWS = 2000

/**
 * Session expiry time (24 hours)
 */
export const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

// ==================
// Verification Types
// ==================

/**
 * Single item verification result
 */
export interface VerificationItem {
  codigo_propio: string
  descripcion: string
  status: 'match' | 'mismatch' | 'not_found'

  /** Data from Excel */
  excel: {
    contado: number
    publico: number
    stock_total: number
    stock_by_branch: Record<string, number>
  }

  /** Data from database (null if not found) */
  database: {
    price: number
    price_list: number
    stock: number
    stock_by_branch: Record<string, number>
  } | null

  /** Computed frontend values */
  frontend: {
    main_price: number
    list_price: number
    discount_percent: number
    stock_status: 'available' | 'out_of_stock'
  }

  /** List of fields that don't match */
  differences: string[]
}

/**
 * Full verification report
 */
export interface VerificationResult {
  timestamp: string // ISO string
  source: SourceType
  total: number
  matches: number
  mismatches: number
  notFound: number
  items: VerificationItem[]
}

/**
 * Verification request payload
 */
export interface VerificationRequest {
  source: SourceType
  excelData: ExcelRowCache[]
}
