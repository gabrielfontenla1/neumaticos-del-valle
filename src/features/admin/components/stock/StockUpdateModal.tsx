'use client'

// ===========================================
// Stock Update Modal
// Full-screen modal with terminal-style UI for stock/price updates
// Includes automatic post-update verification
// ===========================================

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Play,
  StopCircle,
  RefreshCw,
  Download,
  FileText,
} from 'lucide-react'
import {
  StockTerminal,
  TerminalProgress,
  TerminalButton,
  TerminalStat,
  terminalColors,
} from './StockTerminal'
import type { LogEntry, ProgressData } from './ProgressConsole'
import type {
  ExcelRowCache,
  UpdateResult,
  SourceType,
  VerificationResult,
  VerificationItem,
} from '../../types/stock-update'

// ===========================================
// Types
// ===========================================

type ModalStep = 'analyzing' | 'ready' | 'running' | 'verifying' | 'verified'

interface DetectionResult {
  hasPrices: boolean
  hasStock: boolean
  priceColumns: string[]
  stockColumns: string[]
  totalRows: number
  detectedFormat: SourceType
  formatIndicators: string[]
  hasCorvenColumns: boolean
}

interface AnalysisResponse {
  success: boolean
  detection: DetectionResult
  userSource: SourceType
  formatMismatch: boolean
  mismatchWarning?: string
  message: string
  excelData?: ExcelRowCache[]
}

type StreamEvent =
  | { type: 'start'; totalRows: number; timestamp: string }
  | { type: 'progress'; current: number; total: number; percent: number }
  | { type: 'processing'; codigo: string; descripcion: string }
  | { type: 'success'; codigo: string; precio: number; stock: number; descripcion: string }
  | { type: 'not_found'; codigo: string; descripcion: string }
  | { type: 'skipped'; codigo: string; reason: string }
  | { type: 'error'; codigo: string; message: string }
  | { type: 'complete'; result: UpdateResult }

// ===========================================
// Props
// ===========================================

interface StockUpdateModalProps {
  isOpen: boolean
  source: SourceType
  file: File | null
  onClose: () => void
  onComplete?: (result: UpdateResult, excelData: ExcelRowCache[]) => void
}

// ===========================================
// Log Entry Component
// ===========================================

function LogLine({ entry }: { entry: LogEntry }) {
  const iconMap = {
    info: <span style={{ color: terminalColors.info }}>ℹ</span>,
    success: <CheckCircle className="w-3 h-3" style={{ color: terminalColors.success }} />,
    warning: <AlertTriangle className="w-3 h-3" style={{ color: terminalColors.warning }} />,
    error: <XCircle className="w-3 h-3" style={{ color: terminalColors.error }} />,
    processing: <Loader2 className="w-3 h-3 animate-spin" style={{ color: terminalColors.fgMuted }} />,
  }

  const colorMap = {
    info: terminalColors.info,
    success: terminalColors.success,
    warning: terminalColors.warning,
    error: terminalColors.error,
    processing: terminalColors.fgMuted,
  }

  const time = entry.timestamp.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="flex items-start gap-2 py-0.5 text-[11px]">
      <span style={{ color: terminalColors.fgMuted }} className="shrink-0 opacity-50">
        [{time}]
      </span>
      <span className="shrink-0 mt-0.5">{iconMap[entry.type]}</span>
      {entry.codigo && (
        <span style={{ color: terminalColors.coral }} className="font-semibold shrink-0">
          [{entry.codigo}]
        </span>
      )}
      <span style={{ color: colorMap[entry.type] }} className="truncate">
        {entry.message}
      </span>
      {entry.details?.precio !== undefined && entry.details.precio > 0 && (
        <span style={{ color: terminalColors.success }} className="shrink-0 ml-auto">
          ${entry.details.precio.toLocaleString('es-AR')}
        </span>
      )}
    </div>
  )
}

// ===========================================
// Verification Item Row Component
// ===========================================

function VerificationRow({ item }: { item: VerificationItem }) {
  const statusColors = {
    match: terminalColors.success,
    mismatch: terminalColors.warning,
    not_found: terminalColors.error,
  }

  const statusIcons = {
    match: <CheckCircle className="w-3 h-3" />,
    mismatch: <AlertTriangle className="w-3 h-3" />,
    not_found: <XCircle className="w-3 h-3" />,
  }

  return (
    <div
      className="flex items-center gap-3 py-1 text-[11px]"
      style={{ borderBottom: `1px solid ${terminalColors.border}30` }}
    >
      <span style={{ color: statusColors[item.status] }} className="shrink-0">
        {statusIcons[item.status]}
      </span>
      <span style={{ color: terminalColors.coral }} className="w-24 font-mono shrink-0 truncate">
        {item.codigo_propio}
      </span>
      <span style={{ color: terminalColors.fg }} className="flex-1 truncate">
        {item.descripcion}
      </span>
      {item.status === 'mismatch' && item.differences.length > 0 && (
        <span style={{ color: terminalColors.warning }} className="text-[10px] shrink-0">
          {item.differences.length} diff
        </span>
      )}
    </div>
  )
}

// ===========================================
// Main Component
// ===========================================

export function StockUpdateModal({
  isOpen,
  source,
  file,
  onClose,
  onComplete,
}: StockUpdateModalProps) {
  // State
  const [step, setStep] = useState<ModalStep>('analyzing')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [excelData, setExcelData] = useState<ExcelRowCache[]>([])
  // Using _ prefix as we only set this state for potential future use
  const [_finalResult, setFinalResult] = useState<UpdateResult | null>(null)

  // Verification state
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  // Streaming state
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [progress, setProgress] = useState<ProgressData>({ current: 0, total: 0, percent: 0 })
  const [stats, setStats] = useState({ updated: 0, notFound: 0, errors: 0, skipped: 0 })
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState('0:00')

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const logIdRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  // Elapsed time counter
  useEffect(() => {
    if (!startTime || (step !== 'running' && step !== 'verifying')) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.getTime()
      const seconds = Math.floor(elapsed / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      setElapsedTime(`${minutes}:${remainingSeconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, step])

  // Analyze file on open
  useEffect(() => {
    if (isOpen && file) {
      analyzeFile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, file])

  // Add log entry
  const addLog = useCallback((
    type: LogEntry['type'],
    message: string,
    options?: { codigo?: string; precio?: number; stock?: number; descripcion?: string }
  ) => {
    const id = `log-${++logIdRef.current}`
    setLogs(prev => [...prev, {
      id,
      timestamp: new Date(),
      type,
      codigo: options?.codigo,
      message,
      details: options?.precio !== undefined || options?.stock !== undefined ? {
        precio: options?.precio,
        stock: options?.stock,
        descripcion: options?.descripcion
      } : undefined
    }])
  }, [])

  // Analyze file
  const analyzeFile = async () => {
    if (!file) return

    setStep('analyzing')
    setLogs([])
    setVerificationResult(null)
    setFinalResult(null)
    logIdRef.current = 0

    addLog('info', `Analizando archivo: ${file.name}`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('action', 'analyze')
      formData.append('source', source)

      const response = await fetch('/api/admin/stock/update', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.validation) {
          throw new Error(errorData.validation.message || 'Formato de Excel invalido')
        }
        throw new Error(errorData.error || 'Error al analizar archivo')
      }

      const data: AnalysisResponse = await response.json()
      setAnalysisResult(data)

      if (data.excelData) {
        setExcelData(data.excelData)
      }

      addLog('success', `Archivo analizado: ${data.detection.totalRows} filas detectadas`)

      if (data.detection.hasPrices) {
        addLog('info', `Columnas de precio: CONTADO, PUBLICO`)
      }
      if (data.detection.hasStock) {
        addLog('info', `Columnas de stock: ${data.detection.stockColumns.join(', ')}`)
      }
      if (data.formatMismatch) {
        addLog('warning', data.mismatchWarning || 'Formato no coincide con la seleccion')
      }

      setStep('ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      addLog('error', message)
    }
  }

  // Run verification
  const runVerification = async (resultData: UpdateResult, excel: ExcelRowCache[]) => {
    setStep('verifying')
    addLog('info', 'Iniciando verificacion Excel vs Base de Datos vs Ecommerce...')

    try {
      const response = await fetch('/api/admin/stock/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, excelData: excel }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al verificar')
      }

      const result = await response.json() as VerificationResult
      setVerificationResult(result)

      // Log verification results
      addLog('info', `Verificacion completada: ${result.total} productos analizados`)
      addLog('success', `${result.matches} coinciden exactamente`)
      if (result.mismatches > 0) {
        addLog('warning', `${result.mismatches} tienen diferencias`)
      }
      if (result.notFound > 0) {
        addLog('error', `${result.notFound} no encontrados en BD`)
      }

      // Calculate success rate
      const successRate = result.total > 0 ? Math.round((result.matches / result.total) * 100) : 0
      addLog('info', `Tasa de exito: ${successRate}%`)

      setStep('verified')
      onComplete?.(resultData, excel)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de verificacion'
      addLog('error', message)
      setStep('verified') // Still go to verified to show update results
      onComplete?.(resultData, excel)
    }
  }

  // Start update
  const startUpdate = async () => {
    if (!file) return

    setStep('running')
    setProgress({ current: 0, total: 0, percent: 0 })
    setStats({ updated: 0, notFound: 0, errors: 0, skipped: 0 })
    setStartTime(new Date())
    setVerificationResult(null)

    addLog('info', 'Iniciando actualizacion...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('source', source)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/admin/stock/update-stream', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error iniciando actualizacion')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamEvent

              switch (data.type) {
                case 'start':
                  setProgress({ current: 0, total: data.totalRows, percent: 0 })
                  addLog('info', `Procesando ${data.totalRows} productos...`)
                  break

                case 'progress':
                  setProgress({
                    current: data.current,
                    total: data.total,
                    percent: data.percent,
                  })
                  break

                case 'success':
                  setStats(prev => ({ ...prev, updated: prev.updated + 1 }))
                  addLog('success', data.descripcion || 'Actualizado', {
                    codigo: data.codigo,
                    precio: data.precio,
                    stock: data.stock,
                  })
                  break

                case 'not_found':
                  setStats(prev => ({ ...prev, notFound: prev.notFound + 1 }))
                  addLog('warning', `No encontrado`, { codigo: data.codigo })
                  break

                case 'skipped':
                  setStats(prev => ({ ...prev, skipped: prev.skipped + 1 }))
                  break

                case 'error':
                  setStats(prev => ({ ...prev, errors: prev.errors + 1 }))
                  addLog('error', data.message, { codigo: data.codigo })
                  break

                case 'complete': {
                  const result = {
                    ...data.result,
                    created: 0,
                    formatMismatch: false,
                  }
                  setFinalResult(result)
                  addLog('success', `Actualizacion completada: ${result.updated} actualizados, ${result.notFound} no encontrados`)
                  // Auto-start verification if we have excel data
                  if (excelData.length > 0) {
                    await runVerification(result, excelData)
                  } else {
                    setStep('verified')
                    onComplete?.(result, excelData)
                  }
                  break
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        addLog('warning', 'Actualizacion cancelada por el usuario')
        setStep('ready')
      } else {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        addLog('error', message)
        setStep('ready')
      }
    } finally {
      abortControllerRef.current = null
    }
  }

  // Cancel update
  const cancelUpdate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  // Close modal
  const handleClose = () => {
    if (step === 'running' || step === 'verifying') {
      cancelUpdate()
    }
    onClose()
  }

  // Export CSV
  const exportCSV = () => {
    if (!verificationResult) return

    const headers = [
      'Codigo',
      'Descripcion',
      'Estado',
      'Excel Contado',
      'Excel Publico',
      'Excel Stock',
      'DB Precio',
      'DB Lista',
      'DB Stock',
      'Diferencias',
    ]

    const rows = verificationResult.items.map(item => [
      item.codigo_propio,
      item.descripcion,
      item.status,
      item.excel.contado,
      item.excel.publico,
      item.excel.stock_total,
      item.database?.price || '',
      item.database?.price_list || '',
      item.database?.stock || '',
      item.differences.join('; '),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `verificacion_${source}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Get mode label
  const getModeLabel = () => {
    if (!analysisResult) return ''
    const { hasPrices, hasStock } = analysisResult.detection
    if (hasPrices && hasStock) return 'PRECIOS + STOCK'
    if (hasPrices) return 'SOLO PRECIOS'
    if (hasStock) return 'SOLO STOCK'
    return ''
  }

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case 'analyzing': return 'ANALIZANDO'
      case 'ready': return 'LISTO'
      case 'running': return 'ACTUALIZANDO'
      case 'verifying': return 'VERIFICANDO'
      case 'verified': return 'COMPLETADO'
    }
  }

  if (!isOpen || !file) return null

  // Filter items with issues for display
  const issueItems = verificationResult?.items.filter(i => i.status !== 'match') || []

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'rgba(26, 24, 22, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {/* Backdrop click to close (only when not running) */}
        <div
          className="absolute inset-0"
          onClick={step !== 'running' && step !== 'verifying' ? handleClose : undefined}
        />

        {/* Modal with dynamic scale animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 25,
              mass: 0.8,
            }
          }}
          exit={{
            scale: 0.85,
            opacity: 0,
            y: 10,
            transition: { duration: 0.2, ease: 'easeIn' }
          }}
          className="relative w-full max-w-4xl h-[85vh] max-h-[800px]"
        >
          <StockTerminal
            title={`${source.toUpperCase()} UPDATE - ${getStepTitle()}`}
            subtitle={file.name}
            isRunning={step === 'running' || step === 'verifying'}
            className="h-full"
          >
            <div className="flex flex-col h-full">
              {/* Top Section: Progress & Stats */}
              <div className="px-5 py-4 border-b" style={{ borderColor: terminalColors.border }}>
                {/* Progress Bar (when running or complete) */}
                {(step === 'running' || step === 'verifying' || step === 'verified') && (
                  <TerminalProgress
                    value={step === 'verifying' ? 100 : progress.percent}
                    label={step === 'verifying' ? 'Verificando...' : `${progress.current} / ${progress.total} productos`}
                    className="mb-4"
                  />
                )}

                {/* Update Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <TerminalStat
                    label="Actualizados"
                    value={stats.updated}
                    color={stats.updated > 0 ? 'success' : 'muted'}
                  />
                  <TerminalStat
                    label="No encontrados"
                    value={stats.notFound}
                    color={stats.notFound > 0 ? 'warning' : 'muted'}
                  />
                  <TerminalStat
                    label="Errores"
                    value={stats.errors}
                    color={stats.errors > 0 ? 'error' : 'muted'}
                  />
                  <TerminalStat
                    label="Tiempo"
                    value={elapsedTime}
                    color="coral"
                  />
                </div>

                {/* Verification Stats (when available) */}
                {verificationResult && (
                  <div
                    className="rounded-lg p-3 mt-3"
                    style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${terminalColors.border}` }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-2"
                      style={{ color: terminalColors.fgMuted }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      VERIFICACION: EXCEL vs BD vs ECOMMERCE
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: terminalColors.info }}>
                          {verificationResult.total}
                        </div>
                        <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: terminalColors.success }}>
                          {verificationResult.matches}
                        </div>
                        <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>Coinciden</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: terminalColors.warning }}>
                          {verificationResult.mismatches}
                        </div>
                        <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>Diferencias</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold" style={{ color: terminalColors.error }}>
                          {verificationResult.notFound}
                        </div>
                        <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>No en BD</div>
                      </div>
                    </div>
                    {/* Success rate bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color: terminalColors.fgMuted }}>Tasa de exito</span>
                        <span style={{ color: terminalColors.coral }}>
                          {verificationResult.total > 0
                            ? Math.round((verificationResult.matches / verificationResult.total) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(0,0,0,0.3)' }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${verificationResult.total > 0
                              ? (verificationResult.matches / verificationResult.total) * 100
                              : 0}%`,
                            background: `linear-gradient(90deg, ${terminalColors.coral}, ${terminalColors.success})`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Log Console */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-5 py-3 font-mono text-[11px]"
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                >
                  {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <span style={{ color: terminalColors.fgMuted }}>
                        {step === 'analyzing' ? 'Analizando archivo...' : 'Esperando inicio...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      {logs.map(log => (
                        <LogLine key={log.id} entry={log} />
                      ))}
                      {(step === 'running' || step === 'verifying') && (
                        <div className="flex items-center gap-2 mt-1" style={{ color: terminalColors.fgMuted }}>
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            _
                          </motion.span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Issues List (when verified and has issues) */}
                {step === 'verified' && issueItems.length > 0 && (
                  <div
                    className="border-t px-5 py-3 max-h-40 overflow-y-auto"
                    style={{ borderColor: terminalColors.border, background: 'rgba(0,0,0,0.15)' }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2"
                      style={{ color: terminalColors.warning }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      ITEMS CON DIFERENCIAS ({issueItems.length})
                    </div>
                    {issueItems.slice(0, 20).map(item => (
                      <VerificationRow key={item.codigo_propio} item={item} />
                    ))}
                    {issueItems.length > 20 && (
                      <div className="text-[10px] mt-2" style={{ color: terminalColors.fgMuted }}>
                        ... y {issueItems.length - 20} mas. Exporta CSV para ver todos.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div
                className="px-5 py-4 border-t flex items-center justify-between"
                style={{ borderColor: terminalColors.border }}
              >
                {/* Left: Mode badge */}
                <div className="flex items-center gap-3">
                  {analysisResult && (
                    <>
                      <span
                        className="px-2 py-1 rounded text-[10px] uppercase tracking-wider"
                        style={{
                          background: `${terminalColors.coral}20`,
                          color: terminalColors.coral,
                        }}
                      >
                        {getModeLabel()}
                      </span>
                      <span
                        className="text-[10px] uppercase"
                        style={{ color: terminalColors.fgMuted }}
                      >
                        {analysisResult.detection.totalRows} items
                      </span>
                    </>
                  )}
                </div>

                {/* Right: Buttons */}
                <div className="flex items-center gap-3">
                  {step === 'analyzing' && (
                    <div className="flex items-center gap-2" style={{ color: terminalColors.fgMuted }}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Analizando...</span>
                    </div>
                  )}

                  {step === 'ready' && (
                    <>
                      <TerminalButton variant="ghost" onClick={handleClose}>
                        Cancelar
                      </TerminalButton>
                      <TerminalButton variant="primary" onClick={startUpdate}>
                        <Play className="w-4 h-4 mr-2 inline" />
                        Iniciar
                      </TerminalButton>
                    </>
                  )}

                  {step === 'running' && (
                    <TerminalButton variant="danger" onClick={cancelUpdate}>
                      <StopCircle className="w-4 h-4 mr-2 inline" />
                      Detener
                    </TerminalButton>
                  )}

                  {step === 'verifying' && (
                    <div className="flex items-center gap-2" style={{ color: terminalColors.info }}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Verificando...</span>
                    </div>
                  )}

                  {step === 'verified' && (
                    <>
                      {verificationResult && (
                        <TerminalButton variant="ghost" onClick={exportCSV}>
                          <Download className="w-4 h-4 mr-2 inline" />
                          <FileText className="w-4 h-4 mr-1 inline" />
                          CSV
                        </TerminalButton>
                      )}
                      <TerminalButton variant="ghost" onClick={handleClose}>
                        Cerrar
                      </TerminalButton>
                      <TerminalButton
                        variant="secondary"
                        onClick={() => {
                          setStep('ready')
                          setLogs([])
                          setStats({ updated: 0, notFound: 0, errors: 0, skipped: 0 })
                          setProgress({ current: 0, total: 0, percent: 0 })
                          setElapsedTime('0:00')
                          setVerificationResult(null)
                          setFinalResult(null)
                          logIdRef.current = 0
                          analyzeFile()
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2 inline" />
                        Repetir
                      </TerminalButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </StockTerminal>

          {/* Close button */}
          {step !== 'running' && step !== 'verifying' && (
            <button
              onClick={handleClose}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: terminalColors.terminalHeader,
                border: `1px solid ${terminalColors.border}`,
                color: terminalColors.fg,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
