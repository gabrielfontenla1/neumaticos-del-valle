/**
 * useStockUpdatePersistence Hook
 *
 * Persists stock update progress to sessionStorage for recovery when
 * user changes tabs or browser crashes during update.
 *
 * Features:
 * - Session recovery on page reload
 * - Progress persistence during tab changes
 * - Log history with size limits
 * - Excel data caching for verification
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { LogEntry, ProgressData } from '../components/stock/ProgressConsole'
import type {
  StockUpdateSession,
  SerializedLogEntry,
  UpdateStats,
  UpdateResult,
  SourceType,
  ExcelRowCache,
} from '../types/stock-update'
import {
  STOCK_UPDATE_STORAGE_KEYS,
  MAX_PERSISTED_LOGS,
  MAX_CACHED_EXCEL_ROWS,
  SESSION_EXPIRY_MS,
} from '../types/stock-update'

/**
 * Configuration options
 */
export interface UseStockUpdatePersistenceOptions {
  /** Callback when session is recovered */
  onSessionRecover?: (session: StockUpdateSession, logs: LogEntry[]) => void
  /** Callback on storage errors */
  onError?: (error: Error) => void
}

/**
 * Return type for the hook
 */
export interface UseStockUpdatePersistenceReturn {
  /** Check if there's a recoverable session */
  hasRecoverableSession: () => boolean
  /** Get the recoverable session data */
  getRecoverableSession: () => { session: StockUpdateSession; logs: LogEntry[] } | null
  /** Start a new session */
  startSession: (source: SourceType, file: File) => string
  /** Save progress to session */
  saveProgress: (progress: ProgressData, stats: UpdateStats) => void
  /** Add logs to session */
  saveLogs: (logs: LogEntry[]) => void
  /** Save Excel data for verification */
  saveExcelData: (data: ExcelRowCache[]) => void
  /** Mark session as complete */
  completeSession: (result: UpdateResult) => void
  /** Mark session as running/stopped */
  setRunning: (isRunning: boolean) => void
  /** Clear the session */
  clearSession: () => void
  /** Get current session ID */
  sessionId: string | null
  /** Whether currently viewing a recovered session */
  isRecoveredSession: boolean
  /** Mark recovered session as acknowledged */
  acknowledgeRecovery: () => void
}

/**
 * Serialize a log entry for storage
 */
function serializeLog(log: LogEntry): SerializedLogEntry {
  return {
    ...log,
    timestamp: log.timestamp.toISOString(),
  }
}

/**
 * Deserialize a log entry from storage
 */
function deserializeLog(log: SerializedLogEntry): LogEntry {
  return {
    ...log,
    timestamp: new Date(log.timestamp),
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `stock_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Custom hook for stock update persistence
 */
export function useStockUpdatePersistence(
  options: UseStockUpdatePersistenceOptions = {}
): UseStockUpdatePersistenceReturn {
  const { onSessionRecover, onError } = options

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isRecoveredSession, setIsRecoveredSession] = useState(false)
  const isInitializedRef = useRef(false)

  const isBrowser = typeof window !== 'undefined'

  /**
   * Safe sessionStorage wrapper
   */
  const safeStorage = {
    getItem: (key: string): string | null => {
      if (!isBrowser) return null
      try {
        return sessionStorage.getItem(key)
      } catch (error) {
        console.error('sessionStorage.getItem failed:', error)
        if (onError && error instanceof Error) onError(error)
        return null
      }
    },
    setItem: (key: string, value: string): void => {
      if (!isBrowser) return
      try {
        sessionStorage.setItem(key, value)
      } catch (error) {
        console.error('sessionStorage.setItem failed:', error)
        if (onError && error instanceof Error) onError(error)
      }
    },
    removeItem: (key: string): void => {
      if (!isBrowser) return
      try {
        sessionStorage.removeItem(key)
      } catch (error) {
        console.error('sessionStorage.removeItem failed:', error)
        if (onError && error instanceof Error) onError(error)
      }
    },
  }

  /**
   * Check if a session is valid (not expired)
   */
  const isSessionValid = useCallback((session: StockUpdateSession): boolean => {
    const lastActivity = new Date(session.lastActivity).getTime()
    const now = Date.now()
    return now - lastActivity < SESSION_EXPIRY_MS
  }, [])

  /**
   * Check if there's a recoverable session
   */
  const hasRecoverableSession = useCallback((): boolean => {
    const stored = safeStorage.getItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
    if (!stored) return false

    try {
      const session = JSON.parse(stored) as StockUpdateSession
      // Only recoverable if it was running or has results, and is not expired
      return isSessionValid(session) && (session.isRunning || !!session.updateResult)
    } catch {
      return false
    }
  }, [isSessionValid])

  /**
   * Get the recoverable session
   */
  const getRecoverableSession = useCallback((): { session: StockUpdateSession; logs: LogEntry[] } | null => {
    const sessionStored = safeStorage.getItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
    const logsStored = safeStorage.getItem(STOCK_UPDATE_STORAGE_KEYS.LOGS)

    if (!sessionStored) return null

    try {
      const session = JSON.parse(sessionStored) as StockUpdateSession
      if (!isSessionValid(session)) {
        // Clean up expired session
        safeStorage.removeItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
        safeStorage.removeItem(STOCK_UPDATE_STORAGE_KEYS.LOGS)
        return null
      }

      let logs: LogEntry[] = []
      if (logsStored) {
        const serializedLogs = JSON.parse(logsStored) as SerializedLogEntry[]
        logs = serializedLogs.map(deserializeLog)
      }

      return { session, logs }
    } catch (error) {
      console.error('Failed to parse session:', error)
      return null
    }
  }, [isSessionValid])

  /**
   * Start a new session
   */
  const startSession = useCallback((source: SourceType, file: File): string => {
    const newSessionId = generateSessionId()
    const now = new Date().toISOString()

    const session: StockUpdateSession = {
      sessionId: newSessionId,
      startTime: now,
      lastActivity: now,
      source,
      file: {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      },
      progress: { current: 0, total: 0, percent: 0 },
      stats: { updated: 0, notFound: 0, errors: 0, skipped: 0 },
      isRunning: true,
    }

    safeStorage.setItem(STOCK_UPDATE_STORAGE_KEYS.SESSION, JSON.stringify(session))
    safeStorage.setItem(STOCK_UPDATE_STORAGE_KEYS.LOGS, JSON.stringify([]))
    setSessionId(newSessionId)
    setIsRecoveredSession(false)

    return newSessionId
  }, [])

  /**
   * Save progress to session
   */
  const saveProgress = useCallback((progress: ProgressData, stats: UpdateStats) => {
    const stored = safeStorage.getItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
    if (!stored) return

    try {
      const session = JSON.parse(stored) as StockUpdateSession
      session.progress = progress
      session.stats = stats
      session.lastActivity = new Date().toISOString()
      safeStorage.setItem(STOCK_UPDATE_STORAGE_KEYS.SESSION, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }, [])

  /**
   * Save logs to session
   */
  const saveLogs = useCallback((logs: LogEntry[]) => {
    // Limit logs to prevent quota issues
    const limitedLogs = logs.slice(-MAX_PERSISTED_LOGS)
    const serialized = limitedLogs.map(serializeLog)
    safeStorage.setItem(STOCK_UPDATE_STORAGE_KEYS.LOGS, JSON.stringify(serialized))
  }, [])

  /**
   * Save Excel data for verification
   */
  const saveExcelData = useCallback((data: ExcelRowCache[]) => {
    const stored = safeStorage.getItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
    if (!stored) return

    try {
      const session = JSON.parse(stored) as StockUpdateSession
      // Limit data to prevent quota issues
      session.excelData = data.slice(0, MAX_CACHED_EXCEL_ROWS)
      session.lastActivity = new Date().toISOString()
      safeStorage.setItem(STOCK_UPDATE_STORAGE_KEYS.SESSION, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save excel data:', error)
    }
  }, [])

  /**
   * Mark session as complete
   */
  const completeSession = useCallback((result: UpdateResult) => {
    const stored = safeStorage.getItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
    if (!stored) return

    try {
      const session = JSON.parse(stored) as StockUpdateSession
      session.updateResult = result
      session.isRunning = false
      session.lastActivity = new Date().toISOString()
      safeStorage.setItem(STOCK_UPDATE_STORAGE_KEYS.SESSION, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to complete session:', error)
    }
  }, [])

  /**
   * Set running state
   */
  const setRunning = useCallback((isRunning: boolean) => {
    const stored = safeStorage.getItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
    if (!stored) return

    try {
      const session = JSON.parse(stored) as StockUpdateSession
      session.isRunning = isRunning
      session.lastActivity = new Date().toISOString()
      safeStorage.setItem(STOCK_UPDATE_STORAGE_KEYS.SESSION, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to set running state:', error)
    }
  }, [])

  /**
   * Clear the session
   */
  const clearSession = useCallback(() => {
    safeStorage.removeItem(STOCK_UPDATE_STORAGE_KEYS.SESSION)
    safeStorage.removeItem(STOCK_UPDATE_STORAGE_KEYS.LOGS)
    setSessionId(null)
    setIsRecoveredSession(false)
  }, [])

  /**
   * Acknowledge recovery (mark as no longer "recovered")
   */
  const acknowledgeRecovery = useCallback(() => {
    setIsRecoveredSession(false)
  }, [])

  /**
   * Initialize and check for recoverable session on mount
   */
  useEffect(() => {
    if (!isBrowser || isInitializedRef.current) return

    isInitializedRef.current = true

    const recovered = getRecoverableSession()
    if (recovered && onSessionRecover) {
      setSessionId(recovered.session.sessionId)
      setIsRecoveredSession(true)
      onSessionRecover(recovered.session, recovered.logs)
    }
  }, [isBrowser, getRecoverableSession, onSessionRecover])

  /**
   * Handle visibility change to trigger recovery check
   */
  useEffect(() => {
    if (!isBrowser) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sessionId) {
        // Check for session when tab becomes visible
        const recovered = getRecoverableSession()
        if (recovered) {
          setSessionId(recovered.session.sessionId)
          setIsRecoveredSession(true)
          if (onSessionRecover) {
            onSessionRecover(recovered.session, recovered.logs)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isBrowser, sessionId, getRecoverableSession, onSessionRecover])

  return {
    hasRecoverableSession,
    getRecoverableSession,
    startSession,
    saveProgress,
    saveLogs,
    saveExcelData,
    completeSession,
    setRunning,
    clearSession,
    sessionId,
    isRecoveredSession,
    acknowledgeRecovery,
  }
}
