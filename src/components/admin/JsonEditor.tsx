/**
 * JSON Editor Component
 * Simple JSON editor with validation and formatting
 */

'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Code2 } from 'lucide-react'

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  onValidate?: (valid: boolean, error?: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function JsonEditor({
  value,
  onChange,
  onValidate,
  placeholder = 'Enter JSON...',
  className = '',
  minHeight = '200px',
}: JsonEditorProps) {
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Validate JSON on value change
  useEffect(() => {
    if (!value || value.trim() === '') {
      setIsValid(true)
      setError(null)
      onValidate?.(true)
      return
    }

    try {
      JSON.parse(value)
      setIsValid(true)
      setError(null)
      onValidate?.(true)
    } catch (err) {
      setIsValid(false)
      const errorMessage = err instanceof Error ? err.message : 'Invalid JSON'
      setError(errorMessage)
      onValidate?.(false, errorMessage)
    }
  }, [value, onValidate])

  const handleFormat = () => {
    if (!isValid || !value) return

    try {
      const parsed = JSON.parse(value)
      const formatted = JSON.stringify(parsed, null, 2)
      onChange(formatted)
    } catch (err) {
      // Already invalid, do nothing
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isValid ? (
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              JSON válido
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
              <XCircle className="h-3 w-3 mr-1" />
              JSON inválido
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFormat}
          disabled={!isValid}
          className="border-[#3a3a37] hover:bg-[#3a3a37]"
        >
          <Code2 className="h-4 w-4 mr-2" />
          Formatear
        </Button>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`font-mono text-sm bg-[#1a1a18] border-[#3a3a37] text-gray-100 ${
          !isValid ? 'border-red-500/50' : ''
        } ${className}`}
        style={{ minHeight }}
      />

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
    </div>
  )
}
