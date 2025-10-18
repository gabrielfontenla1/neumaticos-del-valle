// Stock Import Page - Exact Rapicompras Style
'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, TrendingUp, Sparkles, Zap, XCircle, Settings, BarChart3, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AI_MODELS, type AIModel } from '@/lib/ai/types'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  input: '#262626',
  secondary: '#262626',
}

interface ImportResult {
  success: boolean
  totalRows: number
  processed: number
  created: number
  updated: number
  errors: Array<{
    row: number
    sku: string
    error: string
  }>
  warnings: Array<{
    row: number
    sku: string
    warning: string
  }>
  samples: Array<{
    sku: string
    original: string
    cleaned: string
    parsed: {
      width: number | null
      aspect_ratio: number | null
      rim_diameter: number | null
      construction: string | null
      load_index: number | null
      speed_rating: string | null
    }
    confidence: number
    method: 'regex' | 'ai'
    ai_model?: string
  }>
  stats: {
    regex_used: number
    ai_used: number
    ai_model?: AIModel
    estimated_cost: number
  }
}

export default function StockImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o-mini')

  // Real-time progress state
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('')
  const [processedRows, setProcessedRows] = useState(0)
  const [totalRows, setTotalRows] = useState(0)
  const [currentSku, setCurrentSku] = useState('')
  const [liveErrors, setLiveErrors] = useState<Array<{row: number, sku: string, error: string}>>([])
  const [liveWarnings, setLiveWarnings] = useState<Array<{row: number, sku: string, warning: string}>>([])

  // Detailed logs and stats
  const [logs, setLogs] = useState<Array<{type: 'info' | 'success' | 'warning' | 'error', message: string, timestamp: Date}>>([])
  const [liveStats, setLiveStats] = useState({
    regexUsed: 0,
    aiUsed: 0,
    created: 0,
    estimatedCost: 0
  })

  // Abort controller for cancelling import
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isExcelFile(droppedFile)) {
      setFile(droppedFile)
      setError(null)
      setImportResult(null)
    } else {
      setError('Por favor selecciona un archivo Excel válido (.xlsx, .xls)')
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isExcelFile(selectedFile)) {
      setFile(selectedFile)
      setError(null)
      setImportResult(null)
    } else {
      setError('Por favor selecciona un archivo Excel válido (.xlsx, .xls)')
    }
  }

  const isExcelFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validExtensions = ['.xlsx', '.xls']
    return validTypes.includes(file.type) || validExtensions.some(ext => file.name.endsWith(ext))
  }

  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }])
  }

  const handleImport = async () => {
    if (!file) return

    // Create new AbortController for this import
    abortControllerRef.current = new AbortController()

    setIsImporting(true)
    setError(null)
    setImportResult(null)
    setProgress(0)
    setCurrentMessage('')
    setProcessedRows(0)
    setTotalRows(0)
    setCurrentSku('')
    setLiveErrors([])
    setLiveWarnings([])
    setLogs([])
    setLiveStats({
      regexUsed: 0,
      aiUsed: 0,
      created: 0,
      estimatedCost: 0
    })

    try {
      // First, upload file to get streaming URL
      const formData = new FormData()
      formData.append('file', file)
      formData.append('aiModel', selectedModel)
      formData.append('stream', 'true') // Enable SSE streaming

      // Create URL with query params for EventSource
      const uploadResponse = await fetch('/api/admin/stock/import', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal, // Pass abort signal
      })

      // Handle streaming response
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Error al iniciar importación')
      }

      // Read stream using response body reader
      const reader = uploadResponse.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No se pudo leer la respuesta del servidor')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        // Decode and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep incomplete message in buffer

        for (const line of lines) {
          if (!line.trim()) continue

          // Parse SSE format: event: type\ndata: json
          const eventMatch = line.match(/event: (\w+)\ndata: (.+)/)
          if (!eventMatch) continue

          const [, eventType, dataStr] = eventMatch
          const data = JSON.parse(dataStr)

          switch (eventType) {
            case 'start':
              setTotalRows(data.totalRows)
              setCurrentMessage(`Iniciando importación de ${data.totalRows} productos...`)
              addLog('info', `🚀 Iniciando importación de ${data.totalRows} productos con modelo ${data.aiModel}`)
              break

            case 'progress':
              if (data.progress !== undefined) {
                setProgress(data.progress)
              }
              if (data.message) {
                setCurrentMessage(data.message)

                // Detailed logging based on message content
                if (data.message.includes('Limpiando')) {
                  addLog('info', `🗑️ ${data.message}`)
                } else if (data.message.includes('Analizando con IA')) {
                  addLog('info', `🤖 ${data.message}`)
                  setLiveStats(prev => ({ ...prev, aiUsed: prev.aiUsed + 1 }))
                } else if (data.sku) {
                  // Regular product processing
                  const method = data.method === 'ai' ? '🤖 AI' : '⚡ RegEx'
                  const confidence = data.confidence ? `(${data.confidence}%)` : ''
                  addLog('success', `${method} ${confidence}: ${data.sku} - ${data.description?.substring(0, 40)}...`)

                  if (data.method === 'regex') {
                    setLiveStats(prev => ({ ...prev, regexUsed: prev.regexUsed + 1 }))
                  }
                  setLiveStats(prev => ({ ...prev, created: prev.created + 1 }))
                }
              }
              if (data.sku) {
                setCurrentSku(data.sku)
              }
              if (data.row) {
                setProcessedRows(data.row - 2) // Adjust for header rows
              }
              break

            case 'error':
              if (!data.fatal) {
                const errorMsg = `❌ Error Fila ${data.row} - ${data.sku}: ${data.error}`
                addLog('error', errorMsg)
                setLiveErrors(prev => [...prev, {
                  row: data.row,
                  sku: data.sku,
                  error: data.error
                }])
              } else {
                throw new Error(data.error)
              }
              break

            case 'warning':
              const warningMsg = `⚠️ Advertencia Fila ${data.row} - ${data.sku}: ${data.warning}`
              addLog('warning', warningMsg)
              setLiveWarnings(prev => [...prev, {
                row: data.row,
                sku: data.sku,
                warning: data.warning
              }])
              break

            case 'complete':
              setProgress(100)
              setCurrentMessage('Importación completada!')
              addLog('success', `✅ Importación completada: ${data.processed} productos procesados, ${data.created} creados`)
              addLog('info', `📊 Estadísticas: ${data.stats.regex_used} con RegEx, ${data.stats.ai_used} con AI`)
              addLog('info', `💰 Costo estimado: $${data.stats.estimated_cost.toFixed(4)}`)

              setLiveStats({
                regexUsed: data.stats.regex_used,
                aiUsed: data.stats.ai_used,
                created: data.created,
                estimatedCost: data.stats.estimated_cost
              })

              setImportResult({
                success: data.success,
                totalRows: totalRows,
                processed: data.processed,
                created: data.created,
                updated: 0,
                errors: liveErrors,
                warnings: liveWarnings,
                samples: data.samples,
                stats: data.stats
              })
              break
          }
        }
      }

    } catch (err) {
      // Handle abort error specially
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Importación cancelada por el usuario')
        addLog('warning', '⚠️ Importación cancelada por el usuario')
        setCurrentMessage('Importación cancelada')
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido al importar')
      }
    } finally {
      setIsImporting(false)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    // Abort the ongoing import
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      addLog('warning', '🚫 Cancelando importación...')
    }
  }

  const handleReset = () => {
    setFile(null)
    setImportResult(null)
    setError(null)
  }

  return (
      <main className="p-6 space-y-6">
        {/* Header Card */}
        <motion.div
          className="rounded-lg shadow-xl p-6"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
            Importar Stock desde Excel
          </h1>
          <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
            Importa stock de productos desde un archivo Excel. El sistema normalizará automáticamente las descripciones de neumáticos.
          </p>
        </motion.div>

        {/* Upload Area */}
        {!file && (
          <div className="rounded-xl p-6" style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
                Seleccionar Archivo
              </h2>
              <p className="text-sm" style={{ color: colors.mutedForeground }}>
                Arrastra y suelta tu archivo Excel aquí, o haz clic para seleccionar
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
              className="border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer"
              style={{
                borderColor: isDragging ? colors.primary : colors.border,
                backgroundColor: isDragging ? colors.primary + '10' : 'transparent'
              }}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />
              <div className="pointer-events-none">
                <FileSpreadsheet className="h-16 w-16 mx-auto mb-4" style={{ color: colors.mutedForeground }} />
                <p className="text-lg font-medium mb-2" style={{ color: colors.foreground }}>
                  {isDragging ? 'Suelta el archivo aquí' : 'Selecciona un archivo Excel'}
                </p>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  Formatos soportados: .xlsx, .xls
                </p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* File Preview & Import */}
        {file && !importResult && (
          <div className="rounded-xl" style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}>
            <Card>
          <CardHeader>
            <CardTitle>Archivo Seleccionado</CardTitle>
            <CardDescription>
              Revisa la configuración y haz clic en Importar para procesar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Proceso de Importación</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li><strong>Se eliminarán todos los productos existentes</strong></li>
                  <li>Se crearán todos los productos desde el Excel (fuente de verdad)</li>
                  <li>Se normalizarán las descripciones de neumáticos</li>
                  <li>Se limpiarán los códigos internos para visualización del cliente</li>
                  <li>Se actualizará el stock por sucursal</li>
                  <li>Se generarán advertencias para registros con baja confianza de parsing</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* AI Model Selector */}
            <div className="rounded-xl p-4" style={{
              backgroundColor: colors.card,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            }}>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4" style={{ color: colors.primary }} />
                  <h3 className="text-base font-semibold" style={{ color: colors.foreground }}>
                    Modelo de IA para Parsing Inteligente
                  </h3>
                </div>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  El sistema intenta primero con RegEx (gratis). Si la confianza es baja (&lt;70%), usa IA automáticamente.
                </p>
              </div>
              <RadioGroup value={selectedModel} onValueChange={(value) => setSelectedModel(value as AIModel)}>
                {Object.values(AI_MODELS).map((model) => (
                  <div key={model.id} className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors" style={{ borderColor: colors.border }}>
                    <RadioGroupItem value={model.id} id={model.id} />
                    <Label htmlFor={model.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{model.icon}</span>
                        <span className="font-semibold" style={{ color: colors.foreground }}>{model.name}</span>
                        <Badge variant={model.id === 'gpt-4o-mini' ? 'default' : 'secondary'}>
                          {model.id === 'gpt-4o-mini' ? 'Recomendado' : 'Premium'}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2" style={{ color: colors.mutedForeground }}>{model.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: colors.mutedForeground }}>
                        <div>
                          <span className="font-medium">Confianza:</span> {model.expectedConfidence}
                        </div>
                        <div>
                          <span className="font-medium">Velocidad:</span> {model.speed}
                        </div>
                        <div>
                          <span className="font-medium">Costo estimado:</span> ${model.averageCostPer741Products.toFixed(2)}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isImporting ? colors.mutedForeground : colors.primary,
                  color: '#ffffff',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  opacity: isImporting ? 0.6 : 1
                }}
              >
                {isImporting ? (
                  <>
                    <Upload className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar Stock
                  </>
                )}
              </button>
              <button
                onClick={isImporting ? handleCancel : handleReset}
                className="px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderWidth: '1px',
                  borderColor: colors.border
                }}
              >
                {isImporting ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Cancelar Importación
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Cancelar
                  </>
                )}
              </button>
            </div>

            {isImporting && (
              <div className="rounded-xl" style={{
                backgroundColor: colors.card,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
                borderWidth: '1px',
                borderColor: colors.primary + '80'
              }}>
                <div className="p-6">
                  <Tabs defaultValue="progress" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="progress" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Progreso
                      </TabsTrigger>
                      <TabsTrigger value="logs" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Console ({logs.length})
                      </TabsTrigger>
                      <TabsTrigger value="issues" className="gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Issues ({liveErrors.length + liveWarnings.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="progress" className="space-y-4 mt-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{currentMessage || 'Iniciando...'}</span>
                          <span className="text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full h-2" />
                        {totalRows > 0 && (
                          <p className="text-sm text-center text-muted-foreground">
                            Procesados: {processedRows} de {totalRows} productos
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Live Statistics */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="rounded-xl p-4" style={{
                          backgroundColor: colors.card,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                        }}>
                          <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>RegEx (Gratis)</p>
                          <div className="text-2xl font-bold text-green-600">⚡ {liveStats.regexUsed}</div>
                        </div>
                        <div className="rounded-xl p-4" style={{
                          backgroundColor: colors.card,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                        }}>
                          <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>IA Usado</p>
                          <div className="text-2xl font-bold text-blue-600">🤖 {liveStats.aiUsed}</div>
                        </div>
                        <div className="rounded-xl p-4" style={{
                          backgroundColor: colors.card,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                        }}>
                          <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>Creados</p>
                          <div className="text-2xl font-bold">✅ {liveStats.created}</div>
                        </div>
                        <div className="rounded-xl p-4" style={{
                          backgroundColor: colors.card,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                        }}>
                          <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>Costo</p>
                          <div className="text-2xl font-bold text-purple-600">${liveStats.estimatedCost.toFixed(3)}</div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="logs" className="mt-4">
                      {/* Live Console Log */}
                      <div className="rounded-xl overflow-hidden" style={{
                        backgroundColor: '#0f172a',
                        borderWidth: '1px',
                        borderColor: '#1e293b'
                      }}>
                        <div className="p-4 flex items-center justify-between" style={{
                          backgroundColor: '#1e293b',
                          borderBottomWidth: '1px',
                          borderBottomColor: '#334155'
                        }}>
                          <h3 className="text-white font-mono text-sm font-semibold">Console Log (Live)</h3>
                          <Badge variant="secondary" className="text-xs">{logs.length} eventos</Badge>
                        </div>
                        <div className="p-0">
                          <ScrollArea className="h-96">
                            <div className="p-4 font-mono text-xs space-y-1">
                              {logs.length === 0 ? (
                                <p className="text-slate-500">Esperando eventos...</p>
                              ) : (
                                logs.map((log, idx) => (
                                  <div
                                    key={idx}
                                    className={`${
                                      log.type === 'error'
                                        ? 'text-red-400'
                                        : log.type === 'warning'
                                        ? 'text-yellow-400'
                                        : log.type === 'success'
                                        ? 'text-green-400'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    <span className="text-slate-500">
                                      [{log.timestamp.toLocaleTimeString()}]
                                    </span>{' '}
                                    {log.message}
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="issues" className="space-y-4 mt-4">
                      {/* Errors & Warnings */}
                      {liveErrors.length === 0 && liveWarnings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                          <p>No hay errores ni advertencias</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {liveErrors.length > 0 && (
                            <div className="rounded-xl overflow-hidden" style={{
                              backgroundColor: colors.card,
                              borderWidth: '1px',
                              borderColor: '#fca5a5'
                            }}>
                              <div className="p-4">
                                <h3 className="text-red-600 text-base font-semibold">
                                  ❌ Errores ({liveErrors.length})
                                </h3>
                              </div>
                              <div className="p-4 pt-0">
                                <ScrollArea className="h-64">
                                  <div className="space-y-2">
                                    {liveErrors.map((error, idx) => (
                                      <div key={idx} className="p-3 rounded-lg" style={{
                                        backgroundColor: '#fef2f2',
                                        borderWidth: '1px',
                                        borderColor: '#fecaca'
                                      }}>
                                        <div className="flex items-start gap-2">
                                          <Badge variant="destructive" className="mt-0.5">#{error.row}</Badge>
                                          <div>
                                            <p className="font-medium text-sm" style={{ color: colors.foreground }}>{error.sku}</p>
                                            <p className="text-xs" style={{ color: colors.mutedForeground }}>{error.error}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </div>
                          )}

                          {liveWarnings.length > 0 && (
                            <div className="rounded-xl overflow-hidden" style={{
                              backgroundColor: colors.card,
                              borderWidth: '1px',
                              borderColor: '#fcd34d'
                            }}>
                              <div className="p-4">
                                <h3 className="text-yellow-600 text-base font-semibold">
                                  ⚠️ Advertencias ({liveWarnings.length})
                                </h3>
                              </div>
                              <div className="p-4 pt-0">
                                <ScrollArea className="h-64">
                                  <div className="space-y-2">
                                    {liveWarnings.map((warning, idx) => (
                                      <div key={idx} className="p-3 rounded-lg" style={{
                                        backgroundColor: '#fefce8',
                                        borderWidth: '1px',
                                        borderColor: '#fde68a'
                                      }}>
                                        <div className="flex items-start gap-2">
                                          <Badge variant="outline" className="mt-0.5 border-yellow-400">#{warning.row}</Badge>
                                          <div>
                                            <p className="font-medium text-sm" style={{ color: colors.foreground }}>{warning.sku}</p>
                                            <p className="text-xs" style={{ color: colors.mutedForeground }}>{warning.warning}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { label: 'Total Procesado', value: importResult.processed, extra: `de ${importResult.totalRows} filas` },
                { label: 'Productos Creados', value: importResult.created, color: 'text-green-600' },
                { label: 'Productos Actualizados', value: importResult.updated, color: 'text-blue-600' },
                { label: 'Errores', value: importResult.errors.length, color: 'text-red-600' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl p-6" style={{
                  backgroundColor: colors.card,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                }}>
                  <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                    {stat.label}
                  </p>
                  <div className={`text-2xl font-bold ${stat.color || ''}`}>{stat.value}</div>
                  {stat.extra && (
                    <p className="text-xs" style={{ color: colors.mutedForeground }}>{stat.extra}</p>
                  )}
                </div>
              ))}
            </div>

            {/* AI Usage Stats */}
            <div className="rounded-xl" style={{
              backgroundColor: colors.card,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            }}>
              <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Estadísticas de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Procesados con RegEx</p>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">{importResult.stats.regex_used}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((importResult.stats.regex_used / importResult.processed) * 100)}%)
                    </span>
                  </div>
                  <p className="text-xs text-green-600">Gratis - Instantáneo</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Procesados con IA</p>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-2xl font-bold">{importResult.stats.ai_used}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((importResult.stats.ai_used / importResult.processed) * 100)}%)
                    </span>
                  </div>
                  <p className="text-xs text-blue-600">{importResult.stats.ai_model}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Costo Total</p>
                  <div className="text-2xl font-bold text-purple-600">
                    ${importResult.stats.estimated_cost.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${(importResult.stats.estimated_cost / importResult.processed).toFixed(4)} por producto
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Confianza Promedio</p>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      importResult.samples.reduce((acc, s) => acc + s.confidence, 0) / importResult.samples.length
                    )}%
                  </div>
                  <p className="text-xs text-muted-foreground">En muestras analizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>

          {/* Success Alert */}
          {importResult.success && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Importación Completada</AlertTitle>
              <AlertDescription>
                Se procesaron {importResult.processed} productos exitosamente.
                {importResult.warnings.length > 0 && (
                  <span className="block mt-1">
                    {importResult.warnings.length} advertencia(s) detectada(s).
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {importResult.warnings.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{
              backgroundColor: colors.card,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
              borderWidth: '1px',
              borderColor: '#fde68a'
            }}>
              <div className="p-6">
                <h3 className="text-yellow-600 font-semibold mb-1">
                  ⚠️ Advertencias ({importResult.warnings.length})
                </h3>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  Registros procesados con advertencias
                </p>
              </div>
              <div className="px-6 pb-6">
                <ScrollArea className="h-96">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{ backgroundColor: colors.secondary }}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20"
                            style={{ color: colors.mutedForeground }}>Fila</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-40"
                            style={{ color: colors.mutedForeground }}>SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                            style={{ color: colors.mutedForeground }}>Advertencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.warnings.map((warning, idx) => (
                          <tr key={idx} style={{
                            borderBottomWidth: '1px',
                            borderBottomColor: colors.border
                          }}>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="border-yellow-400">
                                {warning.row}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-medium" style={{ color: colors.foreground }}>{warning.sku}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: colors.mutedForeground }}>{warning.warning}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{
              backgroundColor: colors.card,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
              borderWidth: '1px',
              borderColor: '#fecaca'
            }}>
              <div className="p-6">
                <h3 className="text-red-600 font-semibold mb-1">
                  ❌ Errores ({importResult.errors.length})
                </h3>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  Registros que no pudieron ser procesados
                </p>
              </div>
              <div className="px-6 pb-6">
                <ScrollArea className="h-96">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead style={{ backgroundColor: colors.secondary }}>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-20"
                            style={{ color: colors.mutedForeground }}>Fila</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-40"
                            style={{ color: colors.mutedForeground }}>SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                            style={{ color: colors.mutedForeground }}>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.errors.map((error, idx) => (
                          <tr key={idx} style={{
                            borderBottomWidth: '1px',
                            borderBottomColor: colors.border
                          }}>
                            <td className="px-6 py-4">
                              <Badge variant="destructive">
                                {error.row}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-medium" style={{ color: colors.foreground }}>{error.sku}</td>
                            <td className="px-6 py-4 text-sm" style={{ color: colors.mutedForeground }}>{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Samples - Antes y Después */}
          {importResult.samples && importResult.samples.length > 0 && (
            <div className="rounded-xl" style={{
              backgroundColor: colors.card,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            }}>
              <div className="p-6">
                <h3 className="font-semibold mb-1" style={{ color: colors.foreground }}>
                  🔍 Vista Previa: Antes y Después
                </h3>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  Comparación de las descripciones originales vs. procesadas ({importResult.samples.length} muestras)
                </p>
              </div>
              <div className="px-6 pb-6">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3 pr-4">
                    {importResult.samples.map((sample, idx) => (
                      <Collapsible key={idx}>
                        <div className="rounded-xl overflow-hidden" style={{
                          backgroundColor: colors.card,
                          borderWidth: '1px',
                          borderColor: colors.border
                        }}>
                          <CollapsibleTrigger className="w-full">
                            <div className="p-4">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">SKU: {sample.sku}</Badge>
                                  <Badge variant={sample.method === 'ai' ? 'secondary' : 'default'}>
                                    {sample.method === 'ai' ? (
                                      <>
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        IA: {sample.ai_model}
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="h-3 w-3 mr-1" />
                                        RegEx
                                      </>
                                    )}
                                  </Badge>
                                </div>
                                <Badge variant={sample.confidence >= 70 ? 'default' : 'destructive'}>
                                  {sample.confidence}%
                                </Badge>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="space-y-4 px-4 pb-4">
                              <Separator />

                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Antes (Original)</p>
                                  <div className="font-mono text-sm bg-muted p-3 rounded border">
                                    {sample.original}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-green-700 uppercase">Después (Procesado)</p>
                                  <div className="font-mono text-sm bg-green-50 p-3 rounded border border-green-200">
                                    {sample.cleaned}
                                  </div>
                                </div>
                              </div>

                              <Separator />

                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Datos Parseados</p>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                  <div className="bg-muted/50 p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Ancho</p>
                                    <p className="font-bold text-lg">{sample.parsed.width || '-'}</p>
                                  </div>
                                  <div className="bg-muted/50 p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Perfil</p>
                                    <p className="font-bold text-lg">{sample.parsed.aspect_ratio || '-'}</p>
                                  </div>
                                  <div className="bg-muted/50 p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Aro</p>
                                    <p className="font-bold text-lg">{sample.parsed.rim_diameter || '-'}</p>
                                  </div>
                                  <div className="bg-muted/50 p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Construcción</p>
                                    <p className="font-bold text-lg">{sample.parsed.construction || '-'}</p>
                                  </div>
                                  <div className="bg-muted/50 p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Índice</p>
                                    <p className="font-bold text-lg">{sample.parsed.load_index || '-'}</p>
                                  </div>
                                  <div className="bg-muted/50 p-3 rounded text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Velocidad</p>
                                    <p className="font-bold text-lg">{sample.parsed.speed_rating || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: colors.secondary,
                  color: colors.foreground,
                  borderWidth: '1px',
                  borderColor: colors.border
                }}
              >
                Importar Otro Archivo
              </button>
            </div>
          </div>
        )}
      </main>
  )
}
