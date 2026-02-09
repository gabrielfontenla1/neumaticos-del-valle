/**
 * useVerification Hook
 *
 * Handles verification of stock updates by comparing
 * Excel data against the database.
 */

'use client'

import { useState, useCallback } from 'react'
import type {
  VerificationResult,
  VerificationRequest,
  ExcelRowCache,
  SourceType,
} from '../types/stock-update'

export interface UseVerificationReturn {
  /** Run verification */
  verify: (source: SourceType, excelData: ExcelRowCache[]) => Promise<void>
  /** Verification result */
  result: VerificationResult | null
  /** Loading state */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Clear results */
  clear: () => void
}

export function useVerification(): UseVerificationReturn {
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (source: SourceType, excelData: ExcelRowCache[]) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const payload: VerificationRequest = {
        source,
        excelData,
      }

      const response = await fetch('/api/admin/stock/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al verificar')
      }

      const data = await response.json() as VerificationResult
      setResult(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    verify,
    result,
    isLoading,
    error,
    clear,
  }
}
