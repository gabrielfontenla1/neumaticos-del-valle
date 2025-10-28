import { useState, useEffect } from 'react'
import { findEquivalentTires } from '../api'
import { EquivalentTire, TireSize } from '../types'

interface UseEquivalentTiresOptions {
  width: number | string | null
  profile: number | string | null
  diameter: number | string | null
  enabled?: boolean // Solo buscar cuando esté habilitado
  tolerancePercent?: number
  allowDifferentRim?: boolean
}

interface UseEquivalentTiresReturn {
  equivalents: EquivalentTire[]
  loading: boolean
  error: string | null
  hasResults: boolean
  totalFound: number
}

/**
 * Hook personalizado para buscar cubiertas equivalentes
 * Solo ejecuta la búsqueda cuando enabled=true y todos los parámetros son válidos
 */
export function useEquivalentTires({
  width,
  profile,
  diameter,
  enabled = true,
  tolerancePercent = 3,
  allowDifferentRim = false
}: UseEquivalentTiresOptions): UseEquivalentTiresReturn {
  const [equivalents, setEquivalents] = useState<EquivalentTire[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset si no está habilitado
    if (!enabled) {
      setEquivalents([])
      setLoading(false)
      setError(null)
      return
    }

    // Validar que todos los parámetros sean válidos
    const numWidth = typeof width === 'string' ? parseInt(width) : width
    const numProfile = typeof profile === 'string' ? parseInt(profile) : profile
    const numDiameter = typeof diameter === 'string' ? parseInt(diameter) : diameter

    if (!numWidth || !numProfile || !numDiameter ||
        numWidth <= 0 || numProfile <= 0 || numDiameter <= 0) {
      setEquivalents([])
      setLoading(false)
      setError(null)
      return
    }

    // Debounce: Esperar 500ms antes de ejecutar búsqueda
    const timeoutId = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const tireSize: TireSize = {
          width: numWidth,
          profile: numProfile,
          diameter: numDiameter
        }

        const result = await findEquivalentTires(
          tireSize,
          tolerancePercent,
          allowDifferentRim
        )

        setEquivalents(result.equivalentTires)
      } catch (err) {
        console.error('Error fetching equivalent tires:', err)
        setError('Error al buscar equivalencias. Por favor intentá nuevamente.')
        setEquivalents([])
      } finally {
        setLoading(false)
      }
    }, 500) // Debounce de 500ms

    // Cleanup: Cancelar timeout si los parámetros cambian antes de 500ms
    return () => clearTimeout(timeoutId)
  }, [width, profile, diameter, enabled, tolerancePercent, allowDifferentRim])

  return {
    equivalents,
    loading,
    error,
    hasResults: equivalents.length > 0,
    totalFound: equivalents.length
  }
}
