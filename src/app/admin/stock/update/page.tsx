// Quick Stock/Price Update Page - Supports Pirelli and Corven
'use client'

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCw, ArrowLeft, DollarSign, Package, AlertTriangle, Truck, Car } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  secondary: '#262626',
}

type SourceType = 'pirelli' | 'corven'

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
}

interface UpdateResult {
  success: boolean
  mode: 'prices_and_stock' | 'prices_only' | 'stock_only'
  source: SourceType
  totalRows: number
  updated: number
  notFound: number
  created: number
  errors: Array<{ codigo: string; error: string }>
  priceUpdates: number
  stockUpdates: number
  formatMismatch: boolean
  mismatchWarning?: string
}

export default function StockUpdatePage() {
  const [source, setSource] = useState<SourceType>('pirelli')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null)
  const [updateResult, setUpdateResult] = useState<UpdateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [showMismatchConfirm, setShowMismatchConfirm] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const isExcelFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const validExtensions = ['.xlsx', '.xls']
    return validTypes.includes(file.type) || validExtensions.some(ext => file.name.endsWith(ext))
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isExcelFile(droppedFile)) {
      setFile(droppedFile)
      setError(null)
      setAnalysisResult(null)
      setUpdateResult(null)
      setShowMismatchConfirm(false)
      await analyzeFile(droppedFile)
    } else {
      setError('Por favor selecciona un archivo Excel válido (.xlsx, .xls)')
    }
  }, [source])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isExcelFile(selectedFile)) {
      setFile(selectedFile)
      setError(null)
      setAnalysisResult(null)
      setUpdateResult(null)
      setShowMismatchConfirm(false)
      await analyzeFile(selectedFile)
    } else {
      setError('Por favor selecciona un archivo Excel válido (.xlsx, .xls)')
    }
  }

  const analyzeFile = async (fileToAnalyze: File) => {
    setIsAnalyzing(true)
    setProgress(30)

    try {
      const formData = new FormData()
      formData.append('file', fileToAnalyze)
      formData.append('action', 'analyze')
      formData.append('source', source)

      const response = await fetch('/api/admin/stock/update', {
        method: 'POST',
        body: formData,
      })

      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al analizar archivo')
      }

      const data: AnalysisResponse = await response.json()
      setAnalysisResult(data)

      // If there's a mismatch, show confirmation dialog
      if (data.formatMismatch) {
        setShowMismatchConfirm(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  const handleUpdate = async (forceUpdate = false) => {
    if (!file) return

    // If there's a mismatch and user hasn't confirmed, show warning
    if (analysisResult?.formatMismatch && !forceUpdate) {
      setShowMismatchConfirm(true)
      return
    }

    setIsUpdating(true)
    setProgress(0)
    setError(null)
    setShowMismatchConfirm(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('action', 'update')
      formData.append('source', source)

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/admin/stock/update', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar')
      }

      const result = await response.json()
      setUpdateResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setAnalysisResult(null)
    setUpdateResult(null)
    setError(null)
    setProgress(0)
    setShowMismatchConfirm(false)
  }

  const handleSourceChange = (newSource: SourceType) => {
    setSource(newSource)
    // Re-analyze if file exists
    if (file) {
      setAnalysisResult(null)
      setShowMismatchConfirm(false)
      analyzeFile(file)
    }
  }

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'prices_and_stock':
        return 'Precios y Stock'
      case 'prices_only':
        return 'Solo Precios'
      case 'stock_only':
        return 'Solo Stock'
      default:
        return mode
    }
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        className="rounded-lg shadow-xl p-6"
        style={{ backgroundColor: colors.card }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin/stock/import">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Importación Completa
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
          Actualización Rápida de Stock/Precios
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
          Actualiza precios y/o stock sin borrar productos existentes. Soporta Excel de Pirelli y Corven.
        </p>
      </motion.div>

      {/* Source Selector */}
      <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>
          1. Selecciona el origen del Excel
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSourceChange('pirelli')}
            className={`p-6 rounded-xl border-2 transition-all ${
              source === 'pirelli'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${source === 'pirelli' ? 'bg-orange-500' : 'bg-gray-600'}`}>
                <Car className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold" style={{ color: colors.foreground }}>
                  Pirelli
                </h3>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  Neumáticos de autos y camionetas
                </p>
                <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                  Excel sin columna CATEGORIA
                </p>
              </div>
            </div>
            {source === 'pirelli' && (
              <Badge className="mt-3 bg-orange-500">Seleccionado</Badge>
            )}
          </button>

          <button
            onClick={() => handleSourceChange('corven')}
            className={`p-6 rounded-xl border-2 transition-all ${
              source === 'corven'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${source === 'corven' ? 'bg-blue-500' : 'bg-gray-600'}`}>
                <Truck className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold" style={{ color: colors.foreground }}>
                  Corven
                </h3>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  Agro, camiones e industrial
                </p>
                <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                  Excel con columna CATEGORIA (AGR, CMO, VI)
                </p>
              </div>
            </div>
            {source === 'corven' && (
              <Badge className="mt-3 bg-blue-500">Seleccionado</Badge>
            )}
          </button>
        </div>
      </div>

      {/* Upload Area */}
      {!file && (
        <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
              2. Subir Excel de {source === 'pirelli' ? 'Pirelli' : 'Corven'}
            </h2>
            <p className="text-sm" style={{ color: colors.mutedForeground }}>
              Arrastra y suelta tu archivo Excel aquí
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            className="border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer"
            style={{
              borderColor: isDragging
                ? (source === 'pirelli' ? '#f97316' : '#3b82f6')
                : colors.border,
              backgroundColor: isDragging
                ? (source === 'pirelli' ? '#f9731610' : '#3b82f610')
                : 'transparent'
            }}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
            />
            <FileSpreadsheet
              className="h-16 w-16 mx-auto mb-4"
              style={{ color: source === 'pirelli' ? '#f97316' : '#3b82f6' }}
            />
            <p className="text-lg font-medium mb-2" style={{ color: colors.foreground }}>
              {isDragging ? 'Suelta el archivo aquí' : 'Selecciona un archivo Excel'}
            </p>
            <p className="text-sm" style={{ color: colors.mutedForeground }}>
              Formatos: .xlsx, .xls
            </p>
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

      {/* Analysis Loading */}
      {isAnalyzing && (
        <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
          <div className="space-y-4">
            <p className="text-center" style={{ color: colors.foreground }}>
              Analizando archivo...
            </p>
            <Progress value={progress} className="w-full" />
          </div>
        </div>
      )}

      {/* Format Mismatch Warning */}
      {showMismatchConfirm && analysisResult?.formatMismatch && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <AlertTitle className="text-yellow-500 text-lg">Advertencia: Formato No Coincide</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="text-yellow-200 mb-4">{analysisResult.mismatchWarning}</p>
            <div className="flex gap-4">
              <Button
                onClick={() => handleUpdate(true)}
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
              >
                Continuar de todas formas
              </Button>
              <Button
                onClick={() => {
                  setShowMismatchConfirm(false)
                  handleSourceChange(analysisResult.detection.detectedFormat)
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Cambiar a {analysisResult.detection.detectedFormat === 'pirelli' ? 'Pirelli' : 'Corven'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detection Results */}
      {file && analysisResult && !updateResult && !showMismatchConfirm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  {file.name}
                </CardTitle>
                <CardDescription>
                  {analysisResult.detection.totalRows} filas detectadas
                </CardDescription>
              </div>
              <Badge
                className={
                  analysisResult.detection.detectedFormat === 'pirelli'
                    ? 'bg-orange-500'
                    : 'bg-blue-500'
                }
              >
                Formato: {analysisResult.detection.detectedFormat.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Detection Info */}
            {analysisResult.detection.formatIndicators.length > 0 && (
              <div className="rounded-lg p-4 bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-400">
                  Columnas Corven detectadas: {analysisResult.detection.formatIndicators.join(', ')}
                </p>
              </div>
            )}

            {/* Detection Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4" style={{ backgroundColor: analysisResult.detection.hasPrices ? '#dcfce7' : colors.secondary }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`h-5 w-5 ${analysisResult.detection.hasPrices ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-semibold" style={{ color: analysisResult.detection.hasPrices ? '#166534' : colors.mutedForeground }}>
                    Precios
                  </span>
                </div>
                {analysisResult.detection.hasPrices ? (
                  <div className="text-sm text-green-700">
                    <p>✅ CONTADO → precio real</p>
                    <p>✅ PUBLICO → precio de lista</p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: colors.mutedForeground }}>
                    No se detectaron columnas de precio
                  </p>
                )}
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: analysisResult.detection.hasStock ? '#dbeafe' : colors.secondary }}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className={`h-5 w-5 ${analysisResult.detection.hasStock ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-semibold" style={{ color: analysisResult.detection.hasStock ? '#1e40af' : colors.mutedForeground }}>
                    Stock
                  </span>
                </div>
                {analysisResult.detection.hasStock ? (
                  <div className="text-sm text-blue-700">
                    <p>✅ Sucursales: {analysisResult.detection.stockColumns.join(', ')}</p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: colors.mutedForeground }}>
                    No se detectaron columnas de stock
                  </p>
                )}
              </div>
            </div>

            {/* Mode Badge */}
            <div className="flex justify-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Modo: {analysisResult.detection.hasPrices && analysisResult.detection.hasStock
                  ? '📊 Precios + Stock'
                  : analysisResult.detection.hasPrices
                    ? '💰 Solo Precios'
                    : '📦 Solo Stock'}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-lg px-4 py-2 ${
                  source === 'pirelli' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {source === 'pirelli' ? '🚗 Pirelli (Autos)' : '🚜 Corven (Agro/Camiones)'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => handleUpdate()}
                disabled={isUpdating}
                className="flex-1"
                style={{ backgroundColor: source === 'pirelli' ? '#f97316' : '#3b82f6' }}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Actualizar Productos {source === 'pirelli' ? 'Pirelli' : 'Corven'}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
            </div>

            {/* Progress */}
            {isUpdating && (
              <Progress value={progress} className="w-full" />
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
      )}

      {/* Update Results */}
      {updateResult && (
        <div className="space-y-6">
          {/* Source Badge */}
          <div className="flex justify-center">
            <Badge
              className={`text-lg px-6 py-2 ${
                updateResult.source === 'pirelli' ? 'bg-orange-500' : 'bg-blue-500'
              }`}
            >
              {updateResult.source === 'pirelli' ? '🚗 Pirelli' : '🚜 Corven'} - Actualización Completada
            </Badge>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
              <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                Modo
              </p>
              <div className="text-xl font-bold" style={{ color: colors.foreground }}>
                {getModeLabel(updateResult.mode)}
              </div>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
              <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                Actualizados
              </p>
              <div className="text-2xl font-bold text-green-600">
                ✅ {updateResult.updated}
              </div>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
              <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                No Encontrados
              </p>
              <div className="text-2xl font-bold text-yellow-600">
                ⚠️ {updateResult.notFound}
              </div>
            </div>
            <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
              <p className="text-sm font-medium mb-2" style={{ color: colors.mutedForeground }}>
                Errores
              </p>
              <div className="text-2xl font-bold text-red-600">
                {updateResult.errors.length > 0 ? '❌' : '✅'} {updateResult.errors.length}
              </div>
            </div>
          </div>

          {/* Detail Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            {updateResult.priceUpdates > 0 && (
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold" style={{ color: colors.foreground }}>
                    Precios Actualizados
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {updateResult.priceUpdates}
                </div>
              </div>
            )}
            {updateResult.stockUpdates > 0 && (
              <div className="rounded-xl p-6" style={{ backgroundColor: colors.card }}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold" style={{ color: colors.foreground }}>
                    Stocks Actualizados
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {updateResult.stockUpdates}
                </div>
              </div>
            )}
          </div>

          {/* Success Alert */}
          {updateResult.success && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Actualización Completada</AlertTitle>
              <AlertDescription>
                Se actualizaron {updateResult.updated} productos de {updateResult.source === 'pirelli' ? 'Pirelli' : 'Corven'} exitosamente.
                {updateResult.notFound > 0 && (
                  <span className="block mt-1">
                    {updateResult.notFound} productos del Excel no se encontraron en la base de datos.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Errors */}
          {updateResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Errores ({updateResult.errors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {updateResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>[{err.codigo}] {err.error}</li>
                  ))}
                  {updateResult.errors.length > 5 && (
                    <li>... y {updateResult.errors.length - 5} más</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={handleReset}>
              Actualizar Otro Archivo
            </Button>
            <Link href={updateResult.source === 'corven' ? '/agro-camiones' : '/admin/products'}>
              <Button variant="outline">
                Ver Productos {updateResult.source === 'corven' ? 'Agro/Camiones' : ''}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
