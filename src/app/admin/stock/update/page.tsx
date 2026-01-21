// Quick Stock/Price Update Page - Supports Pirelli and Corven
'use client'

import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCw, ArrowLeft, DollarSign, Package, AlertTriangle, Truck, Car } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  border: '#3a3a38',
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
    <main className="p-6 space-y-6 bg-[#30302e] min-h-screen">
      {/* Header Card */}
      <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#d97757]/20 border border-[#d97757]/30">
              <Upload className="w-8 h-8 text-[#d97757]" />
            </div>
            <div>
              <CardTitle className="text-2xl text-[#fafafa]">Actualización de Stock y Precios</CardTitle>
              <CardDescription className="text-[#888888]">
                Actualiza precios y/o stock sin borrar productos existentes. Soporta Excel de Pirelli y Corven.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Source Selector Card */}
      <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-lg text-[#fafafa]">1. Selecciona el origen del Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSourceChange('pirelli')}
              className={`p-6 rounded-xl border-2 transition-all ${
                source === 'pirelli'
                  ? 'border-[#d97757] bg-[#d97757]/10'
                  : 'border-[#3a3a38] hover:border-[#d97757]/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${source === 'pirelli' ? 'bg-[#d97757]' : 'bg-[#3a3a38]'}`}>
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-[#fafafa]">
                    Pirelli
                  </h3>
                  <p className="text-sm text-[#888888]">
                    Neumáticos de autos y camionetas
                  </p>
                  <p className="text-xs mt-1 text-[#666666]">
                    Excel sin columna CATEGORIA
                  </p>
                </div>
              </div>
              {source === 'pirelli' && (
                <Badge className="mt-3 bg-[#d97757] text-white">Seleccionado</Badge>
              )}
            </button>

            <button
              onClick={() => handleSourceChange('corven')}
              className={`p-6 rounded-xl border-2 transition-all ${
                source === 'corven'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-[#3a3a38] hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${source === 'corven' ? 'bg-blue-500' : 'bg-[#3a3a38]'}`}>
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-[#fafafa]">
                    Corven
                  </h3>
                  <p className="text-sm text-[#888888]">
                    Agro, camiones e industrial
                  </p>
                  <p className="text-xs mt-1 text-[#666666]">
                    Excel con columna CATEGORIA (AGR, CMO, VI)
                  </p>
                </div>
              </div>
              {source === 'corven' && (
                <Badge className="mt-3 bg-blue-500 text-white">Seleccionado</Badge>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      {!file && (
        <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-lg text-[#fafafa]">
              2. Subir Excel de {source === 'pirelli' ? 'Pirelli' : 'Corven'}
            </CardTitle>
            <CardDescription className="text-[#888888]">
              Arrastra y suelta tu archivo Excel aquí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
              className="border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer"
              style={{
                borderColor: isDragging
                  ? (source === 'pirelli' ? '#d97757' : '#3b82f6')
                  : colors.border,
                backgroundColor: isDragging
                  ? (source === 'pirelli' ? '#d9775710' : '#3b82f610')
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
                style={{ color: source === 'pirelli' ? '#d97757' : '#3b82f6' }}
              />
              <p className="text-lg font-medium mb-2 text-[#fafafa]">
                {isDragging ? 'Suelta el archivo aquí' : 'Selecciona un archivo Excel'}
              </p>
              <p className="text-sm text-[#888888]">
                Formatos: .xlsx, .xls
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-6 bg-red-950/50 border-red-900 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Loading */}
      {isAnalyzing && (
        <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-center text-[#fafafa]">
                Analizando archivo...
              </p>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
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
        <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#fafafa]">
                  <FileSpreadsheet className="h-5 w-5" />
                  {file.name}
                </CardTitle>
                <CardDescription className="text-[#888888]">
                  {analysisResult.detection.totalRows} filas detectadas
                </CardDescription>
              </div>
              <Badge
                className={
                  analysisResult.detection.detectedFormat === 'pirelli'
                    ? 'bg-[#d97757] text-white'
                    : 'bg-blue-500 text-white'
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
              <div className="rounded-lg p-4" style={{ backgroundColor: analysisResult.detection.hasPrices ? '#14532d20' : colors.secondary }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`h-5 w-5 ${analysisResult.detection.hasPrices ? 'text-green-500' : 'text-gray-500'}`} />
                  <span className="font-semibold" style={{ color: analysisResult.detection.hasPrices ? '#86efac' : colors.mutedForeground }}>
                    Precios
                  </span>
                </div>
                {analysisResult.detection.hasPrices ? (
                  <div className="text-sm text-green-400">
                    <p>✅ CONTADO → precio real</p>
                    <p>✅ PUBLICO → precio de lista</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#888888]">
                    No se detectaron columnas de precio
                  </p>
                )}
              </div>

              <div className="rounded-lg p-4" style={{ backgroundColor: analysisResult.detection.hasStock ? '#1e40af20' : colors.secondary }}>
                <div className="flex items-center gap-2 mb-2">
                  <Package className={`h-5 w-5 ${analysisResult.detection.hasStock ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="font-semibold" style={{ color: analysisResult.detection.hasStock ? '#60a5fa' : colors.mutedForeground }}>
                    Stock
                  </span>
                </div>
                {analysisResult.detection.hasStock ? (
                  <div className="text-sm text-blue-300">
                    <p>✅ Sucursales: {analysisResult.detection.stockColumns.join(', ')}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#888888]">
                    No se detectaron columnas de stock
                  </p>
                )}
              </div>
            </div>

            {/* Mode Badge */}
            <div className="flex justify-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-[#3a3a38] text-[#fafafa]">
                Modo: {analysisResult.detection.hasPrices && analysisResult.detection.hasStock
                  ? '📊 Precios + Stock'
                  : analysisResult.detection.hasPrices
                    ? '💰 Solo Precios'
                    : '📦 Solo Stock'}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-lg px-4 py-2 ${
                  source === 'pirelli' ? 'bg-[#d97757]/20 text-[#d97757]' : 'bg-blue-500/20 text-blue-400'
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
                className="flex-1 bg-[#d97757] hover:bg-[#d97757]/90 text-white"
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
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38]"
              >
                Cancelar
              </Button>
            </div>

            {/* Progress */}
            {isUpdating && (
              <Progress value={progress} className="w-full" />
            )}

            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
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
          {/* Main Result Card */}
          <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-lg ${
                    updateResult.updated > 0
                      ? 'bg-green-500/20 border border-green-500/30'
                      : 'bg-yellow-500/20 border border-yellow-500/30'
                  }`}>
                    {updateResult.updated > 0 ? (
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-[#fafafa]">
                      {updateResult.updated > 0 ? 'Actualización Completada' : 'Actualización Sin Cambios'}
                    </CardTitle>
                    <CardDescription className="text-[#888888] mt-1">
                      {updateResult.source === 'pirelli' ? '🚗 Origen: Pirelli (Autos)' : '🚜 Origen: Corven (Agro/Camiones)'} •
                      Modo: {getModeLabel(updateResult.mode)}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statistics Grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Actualizados */}
                <div className="text-center p-4 rounded-lg bg-[#1a1a18] border border-[#3a3a38]">
                  <div className="text-4xl font-bold mb-2" style={{
                    color: updateResult.updated > 0 ? '#86efac' : '#a1a1aa'
                  }}>
                    {updateResult.updated}
                  </div>
                  <div className="text-sm text-[#888888]">Actualizados</div>
                  {updateResult.priceUpdates > 0 && (
                    <div className="text-xs text-green-400 mt-1">
                      💰 {updateResult.priceUpdates} precios
                    </div>
                  )}
                  {updateResult.stockUpdates > 0 && (
                    <div className="text-xs text-blue-400 mt-1">
                      📦 {updateResult.stockUpdates} stocks
                    </div>
                  )}
                </div>

                {/* No Encontrados */}
                <div className="text-center p-4 rounded-lg bg-[#1a1a18] border border-[#3a3a38]">
                  <div className="text-4xl font-bold mb-2 text-yellow-500">
                    {updateResult.notFound}
                  </div>
                  <div className="text-sm text-[#888888]">No Encontrados</div>
                  {updateResult.notFound > 0 && (
                    <div className="text-xs text-yellow-400 mt-1">
                      No existen en BD
                    </div>
                  )}
                </div>

                {/* Errores */}
                <div className="text-center p-4 rounded-lg bg-[#1a1a18] border border-[#3a3a38]">
                  <div className="text-4xl font-bold mb-2" style={{
                    color: updateResult.errors.length > 0 ? '#fca5a5' : '#86efac'
                  }}>
                    {updateResult.errors.length}
                  </div>
                  <div className="text-sm text-[#888888]">Errores</div>
                  {updateResult.errors.length === 0 && (
                    <div className="text-xs text-green-400 mt-1">
                      Sin problemas
                    </div>
                  )}
                </div>
              </div>

              {/* Total Procesado */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#1a1a18] border border-[#3a3a38]">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#888888]" />
                  <span className="text-[#fafafa] font-medium">Total procesado del Excel</span>
                </div>
                <span className="text-2xl font-bold text-[#d97757]">{updateResult.totalRows} productos</span>
              </div>
            </CardContent>
          </Card>

          {/* Status Alert */}
          {updateResult.updated === 0 && updateResult.notFound > 0 && (
            <Alert className="border-yellow-500 bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <AlertTitle className="text-yellow-500 text-lg">Ningún Producto fue Actualizado</AlertTitle>
              <AlertDescription className="text-yellow-200 mt-2">
                <p className="mb-3">
                  Los {updateResult.notFound} productos del Excel no se encontraron en la base de datos.
                  Esto puede ocurrir por:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Los códigos de producto en el Excel no coinciden con los de la base de datos</li>
                  <li>Los productos aún no fueron importados al sistema</li>
                  <li>Hay diferencias en el formato de los códigos (espacios, guiones, etc.)</li>
                </ul>
                <p className="mt-3 font-semibold">
                  💡 Recomendación: Verifica que los códigos del Excel coincidan con los de tus productos existentes
                </p>
              </AlertDescription>
            </Alert>
          )}

          {updateResult.updated > 0 && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-500 text-lg">¡Actualización Exitosa!</AlertTitle>
              <AlertDescription className="text-green-200">
                <p>
                  Se actualizaron correctamente {updateResult.updated} productos de {updateResult.source === 'pirelli' ? 'Pirelli' : 'Corven'}.
                </p>
                {updateResult.notFound > 0 && (
                  <p className="mt-2 text-yellow-200">
                    ⚠️ {updateResult.notFound} productos del Excel no se encontraron en la base de datos y no fueron actualizados.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Errors List */}
          {updateResult.errors.length > 0 && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg">Se encontraron {updateResult.errors.length} errores</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {updateResult.errors.map((err, idx) => (
                    <div key={idx} className="text-sm font-mono bg-black/20 p-2 rounded">
                      <span className="text-red-300">[{err.codigo}]</span> {err.error}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleReset}
                  size="lg"
                  className="bg-[#d97757] hover:bg-[#d97757]/90 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Actualizar Otro Archivo
                </Button>
                <Link href={updateResult.source === 'corven' ? '/agro-camiones' : '/admin/products'}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38]"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Ver Productos{updateResult.source === 'corven' ? ' Agro/Camiones' : ''}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
