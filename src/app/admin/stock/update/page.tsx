// Stock Update Page - Claude Code Terminal Theme
// Single expanding terminal - no overlay, grid always visible
'use client'

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
  Car,
  Truck,
} from 'lucide-react'
import {
  StockTerminal,
  TerminalProgress,
  TerminalButton,
  TerminalStat,
  TerminalCommand,
  terminalColors,
} from '@/features/admin/components/stock/StockTerminal'
import { RecoveryPrompt } from '@/features/admin/components/stock/RecoveryPrompt'
import { VerificationReport } from '@/features/admin/components/stock/VerificationReport'
import { useStockUpdatePersistence } from '@/features/admin/hooks/useStockUpdatePersistence'
import { useVerification } from '@/features/admin/hooks/useVerification'
import type {
  StockUpdateSession,
  ExcelRowCache,
  UpdateResult,
  SourceType,
  VerificationResult,
  VerificationItem,
} from '@/features/admin/types/stock-update'

// ===========================================
// Types
// ===========================================

type PageStep = 'select' | 'analyzing' | 'ready' | 'running' | 'verifying' | 'verified' | 'results'

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

interface LogEntry {
  id: string
  timestamp: Date
  type: 'info' | 'success' | 'warning' | 'error' | 'processing'
  codigo?: string
  message: string
  details?: { precio?: number; stock?: number; descripcion?: string }
}

interface ProgressData {
  current: number
  total: number
  percent: number
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
// Verification Row Component
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
// Main Page Component
// ===========================================

export default function StockUpdatePage() {
  // Core state
  const [step, setStep] = useState<PageStep>('select')
  const [source, setSource] = useState<SourceType>('pirelli')
  const [file, setFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [excelData, setExcelData] = useState<ExcelRowCache[]>([])
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  // Streaming state
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [progress, setProgress] = useState<ProgressData>({ current: 0, total: 0, percent: 0 })
  const [stats, setStats] = useState({ updated: 0, notFound: 0, errors: 0, skipped: 0 })
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState('0:00')

  // Recovery state
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false)
  const [recoveredSession, setRecoveredSession] = useState<StockUpdateSession | null>(null)
  const [showVerificationReport, setShowVerificationReport] = useState(false)

  // Refs
  const pirelliFileRef = useRef<HTMLInputElement>(null)
  const corvenFileRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const logIdRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Hooks
  const persistence = useStockUpdatePersistence({
    onSessionRecover: (session) => {
      setRecoveredSession(session)
      setShowRecoveryPrompt(true)
    },
    onError: (error) => console.error('Persistence error:', error),
  })

  const verification = useVerification()

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

  // Check if file is Excel
  const isExcelFile = (f: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validExtensions = ['.xlsx', '.xls']
    return validTypes.includes(f.type) || validExtensions.some(ext => f.name.endsWith(ext))
  }

  // Handle source selection
  const handleSourceClick = useCallback((selectedSource: SourceType) => {
    setSource(selectedSource)
    if (selectedSource === 'pirelli') {
      pirelliFileRef.current?.click()
    } else {
      corvenFileRef.current?.click()
    }
  }, [])

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, selectedSource: SourceType) => {
    const selectedFile = e.target.files?.[0]
    e.target.value = ''

    if (!selectedFile || !isExcelFile(selectedFile)) return

    setSource(selectedSource)
    setFile(selectedFile)
    setStep('analyzing')
    setLogs([])
    setVerificationResult(null)
    setUpdateResult(null)
    logIdRef.current = 0

    addLog('info', `Analizando archivo: ${selectedFile.name}`)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('action', 'analyze')
      formData.append('source', selectedSource)

      const response = await fetch('/api/admin/stock/update', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.validation?.message || errorData.error || 'Error al analizar archivo')
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
      setStep('select')
    }
  }

  // Run verification
  const runVerification = async (resultData: UpdateResult, excel: ExcelRowCache[]) => {
    setStep('verifying')
    addLog('info', 'Iniciando verificacion Excel vs Base de Datos...')

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

      addLog('info', `Verificacion completada: ${result.total} productos analizados`)
      addLog('success', `${result.matches} coinciden exactamente`)
      if (result.mismatches > 0) addLog('warning', `${result.mismatches} tienen diferencias`)
      if (result.notFound > 0) addLog('error', `${result.notFound} no encontrados en BD`)

      const successRate = result.total > 0 ? Math.round((result.matches / result.total) * 100) : 0
      addLog('info', `Tasa de exito: ${successRate}%`)

      setStep('verified')
      setUpdateResult(resultData)
      persistence.completeSession(resultData)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de verificacion'
      addLog('error', message)
      setStep('verified')
      setUpdateResult(resultData)
      persistence.completeSession(resultData)
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
                  setProgress({ current: data.current, total: data.total, percent: data.percent })
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
                  const result = { ...data.result, created: 0, formatMismatch: false }
                  addLog('success', `Actualizacion completada: ${result.updated} actualizados, ${result.notFound} no encontrados`)
                  if (excelData.length > 0) {
                    await runVerification(result, excelData)
                  } else {
                    setStep('verified')
                    setUpdateResult(result)
                    persistence.completeSession(result)
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
    abortControllerRef.current?.abort()
  }

  // Reset to initial state
  const resetAll = () => {
    setStep('select')
    setFile(null)
    setAnalysisResult(null)
    setExcelData([])
    setUpdateResult(null)
    setVerificationResult(null)
    setLogs([])
    setStats({ updated: 0, notFound: 0, errors: 0, skipped: 0 })
    setProgress({ current: 0, total: 0, percent: 0 })
    setElapsedTime('0:00')
    setStartTime(null)
    logIdRef.current = 0
    verification.clear()
    persistence.clearSession()
  }

  // Handle recovery
  const handleRecover = useCallback(() => {
    if (!recoveredSession) return
    const recovered = persistence.getRecoverableSession()
    if (recovered) {
      setSource(recovered.session.source)
      if (recovered.session.updateResult) {
        setUpdateResult(recovered.session.updateResult)
        setStep('results')
      }
      if (recovered.session.excelData) {
        setExcelData(recovered.session.excelData)
      }
    }
    setShowRecoveryPrompt(false)
    setRecoveredSession(null)
  }, [recoveredSession, persistence])

  const handleDiscardRecovery = useCallback(() => {
    persistence.clearSession()
    setShowRecoveryPrompt(false)
    setRecoveredSession(null)
  }, [persistence])

  // Export CSV
  const exportCSV = () => {
    if (!verificationResult) return

    const headers = ['Codigo', 'Descripcion', 'Estado', 'Excel Contado', 'Excel Publico', 'Excel Stock', 'DB Precio', 'DB Lista', 'DB Stock', 'Diferencias']
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

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
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
      case 'select': return 'STOCK UPDATE'
      case 'analyzing': return 'ANALIZANDO'
      case 'ready': return 'LISTO'
      case 'running': return 'ACTUALIZANDO'
      case 'verifying': return 'VERIFICANDO'
      case 'verified': return 'COMPLETADO'
      case 'results': return 'RESULTADOS'
    }
  }

  // Is expanded (processing state)
  const isExpanded = step !== 'select'
  const isRunning = step === 'running' || step === 'verifying' || step === 'analyzing'
  const issueItems = verificationResult?.items.filter(i => i.status !== 'match') || []

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={pirelliFileRef}
        type="file"
        className="hidden"
        accept=".xlsx,.xls"
        onChange={(e) => handleFileSelect(e, 'pirelli')}
      />
      <input
        ref={corvenFileRef}
        type="file"
        className="hidden"
        accept=".xlsx,.xls"
        onChange={(e) => handleFileSelect(e, 'corven')}
      />

      {/* Full height container - grid always visible behind */}
      <div className="h-full w-full flex items-center justify-center p-6 relative">
        {/* Recovery Prompt */}
        {showRecoveryPrompt && recoveredSession && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <RecoveryPrompt
              session={recoveredSession}
              onRecover={handleRecover}
              onDiscard={handleDiscardRecovery}
            />
          </div>
        )}

        {/* Verification Report Modal */}
        {showVerificationReport && verification.result && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <VerificationReport
              result={verification.result}
              onClose={() => setShowVerificationReport(false)}
            />
          </div>
        )}

        {/* Single Expanding Terminal */}
        <motion.div
          className="w-full"
          style={{ maxWidth: '56rem' }}
          initial={false}
          animate={{
            height: isExpanded ? '85vh' : 'auto',
            maxHeight: isExpanded ? '800px' : 'none',
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35,
            mass: 0.8,
          }}
        >
          <StockTerminal
            title={getStepTitle()}
            subtitle={file?.name}
            isRunning={isRunning}
            className={isExpanded ? 'h-full' : ''}
          >
            <AnimatePresence mode="wait">
              {/* SELECT STATE - Source Selector */}
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    duration: 0.3
                  }}
                  className="p-6 space-y-6"
                >
                  <TerminalCommand
                    command="stock-update --help"
                    output="Actualiza precios y stock desde Excel. Soporta Pirelli y Corven."
                  />

                  {/* Source Selector Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pirelli */}
                    <motion.button
                      onClick={() => handleSourceClick('pirelli')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left p-6 rounded-lg transition-colors"
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: `2px solid ${terminalColors.border}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = terminalColors.coral
                        e.currentTarget.style.background = 'rgba(217, 119, 87, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = terminalColors.border
                        e.currentTarget.style.background = 'rgba(0,0,0,0.2)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(217, 119, 87, 0.2)' }}
                        >
                          <Car className="w-5 h-5" style={{ color: terminalColors.coral }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: terminalColors.coral, color: 'white' }}>1</span>
                            <span className="font-bold text-lg" style={{ color: terminalColors.fgLight }}>PIRELLI</span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: terminalColors.fgMuted }}>Autos y camionetas</p>
                        </div>
                      </div>
                      <div className="mt-4 text-xs font-mono px-3 py-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: terminalColors.fgMuted }}>
                        <span style={{ color: terminalColors.coral }}>$</span> upload pirelli.xlsx
                      </div>
                    </motion.button>

                    {/* Corven */}
                    <motion.button
                      onClick={() => handleSourceClick('corven')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left p-6 rounded-lg transition-colors"
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: `2px solid ${terminalColors.border}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = terminalColors.info
                        e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = terminalColors.border
                        e.currentTarget.style.background = 'rgba(0,0,0,0.2)'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                          style={{ background: 'rgba(96, 165, 250, 0.2)' }}
                        >
                          <Truck className="w-5 h-5" style={{ color: terminalColors.info }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: terminalColors.info, color: 'white' }}>2</span>
                            <span className="font-bold text-lg" style={{ color: terminalColors.fgLight }}>CORVEN</span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: terminalColors.fgMuted }}>Agro, camiones e industrial</p>
                        </div>
                      </div>
                      <div className="mt-4 text-xs font-mono px-3 py-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: terminalColors.fgMuted }}>
                        <span style={{ color: terminalColors.info }}>$</span> upload corven.xlsx
                      </div>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* EXPANDED STATE - Processing/Results */}
              {isExpanded && (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    duration: 0.3
                  }}
                  className="flex flex-col h-full"
                >
                  {/* Top Section: Progress & Stats */}
                  <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: terminalColors.border }}>
                    {/* Progress Bar */}
                    {(step === 'running' || step === 'verifying' || step === 'verified') && (
                      <TerminalProgress
                        value={step === 'verifying' ? 100 : progress.percent}
                        label={step === 'verifying' ? 'Verificando...' : `${progress.current} / ${progress.total} productos`}
                        className="mb-4"
                      />
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <TerminalStat label="Actualizados" value={stats.updated} color={stats.updated > 0 ? 'success' : 'muted'} />
                      <TerminalStat label="No encontrados" value={stats.notFound} color={stats.notFound > 0 ? 'warning' : 'muted'} />
                      <TerminalStat label="Errores" value={stats.errors} color={stats.errors > 0 ? 'error' : 'muted'} />
                      <TerminalStat label="Tiempo" value={elapsedTime} color="coral" />
                    </div>

                    {/* Verification Stats */}
                    {verificationResult && (
                      <div className="rounded-lg p-3 mt-3" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${terminalColors.border}` }}>
                        <div className="text-[10px] uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: terminalColors.fgMuted }}>
                          <CheckCircle className="w-3 h-3" />
                          VERIFICACION: EXCEL vs BD
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: terminalColors.info }}>{verificationResult.total}</div>
                            <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: terminalColors.success }}>{verificationResult.matches}</div>
                            <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>Coinciden</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: terminalColors.warning }}>{verificationResult.mismatches}</div>
                            <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>Diferencias</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold" style={{ color: terminalColors.error }}>{verificationResult.notFound}</div>
                            <div className="text-[10px]" style={{ color: terminalColors.fgMuted }}>No en BD</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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
                        {logs.map(log => <LogLine key={log.id} entry={log} />)}
                        {(step === 'running' || step === 'verifying') && (
                          <div className="flex items-center gap-2 mt-1" style={{ color: terminalColors.fgMuted }}>
                            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>_</motion.span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Issues List */}
                  {step === 'verified' && issueItems.length > 0 && (
                    <div
                      className="border-t px-5 py-3 max-h-40 overflow-y-auto shrink-0"
                      style={{ borderColor: terminalColors.border, background: 'rgba(0,0,0,0.15)' }}
                    >
                      <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: terminalColors.warning }}>
                        <AlertTriangle className="w-3 h-3" />
                        ITEMS CON DIFERENCIAS ({issueItems.length})
                      </div>
                      {issueItems.slice(0, 20).map(item => <VerificationRow key={item.codigo_propio} item={item} />)}
                      {issueItems.length > 20 && (
                        <div className="text-[10px] mt-2" style={{ color: terminalColors.fgMuted }}>
                          ... y {issueItems.length - 20} mas. Exporta CSV para ver todos.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="px-5 py-4 border-t flex items-center justify-between shrink-0" style={{ borderColor: terminalColors.border }}>
                    {/* Left: Mode badge */}
                    <div className="flex items-center gap-3">
                      {analysisResult && (
                        <>
                          <span
                            className="px-2 py-1 rounded text-[10px] uppercase tracking-wider"
                            style={{ background: `${terminalColors.coral}20`, color: terminalColors.coral }}
                          >
                            {getModeLabel()}
                          </span>
                          <span className="text-[10px] uppercase" style={{ color: terminalColors.fgMuted }}>
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
                          <TerminalButton variant="ghost" onClick={resetAll}>Cancelar</TerminalButton>
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
                          <TerminalButton variant="secondary" onClick={resetAll}>
                            <RefreshCw className="w-4 h-4 mr-2 inline" />
                            Nuevo
                          </TerminalButton>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </StockTerminal>

          {/* Version tag - only when not expanded */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-center"
              >
                <span className="text-[10px] tracking-wider uppercase" style={{ color: terminalColors.fgMuted }}>
                  Stock Management System v2.0 • Terminal Edition
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}
