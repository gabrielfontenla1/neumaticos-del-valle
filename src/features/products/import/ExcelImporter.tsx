'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { ImportRow, ImportRowPreview } from '../types'
import { importProducts } from '../api'

interface ImportBatchResult {
  batch: number
  success: boolean
  count?: number
  error?: string
}

interface ImportResult {
  success: boolean
  totalImported?: number
  results?: ImportBatchResult[]
  error?: string
}

export default function ExcelImporter() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportRowPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [deleteExisting, setDeleteExisting] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setFile(file)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Obtener headers para identificar si tiene formato de sucursales
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
      const headers: string[] = []
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })]
        headers.push(cell ? String(cell.v) : '')
      }

      const json = XLSX.utils.sheet_to_json(worksheet) as ImportRow[]

      // Detectar si tiene columnas de sucursales
      const hasSucursales = headers.some(h =>
        ['BELGRANO', 'CATAMARCA', 'LA_BANDA', 'SALTA', 'TUCUMAN', 'VIRGEN'].includes(h.toUpperCase())
      )

      // Agregar metadata al preview
      const previewWithInfo = json.slice(0, 10).map(row => ({
        ...row,
        _hasSucursales: hasSucursales,
        _headers: headers
      }))

      setPreview(previewWithInfo)
    }
    reader.readAsBinaryString(file)
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      const data = e.target?.result
      const workbook = XLSX.read(data, { type: 'binary' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet) as ImportRow[]

      const result = await importProducts(json, deleteExisting)
      setResult(result)
      setLoading(false)
    }

    reader.readAsBinaryString(file)
  }

  const downloadTemplate = () => {
    // Dos formatos de template
    const templateSimple = [
      {
        sku: 'MICH-195-65-15',
        name: 'Michelin Energy XM2+',
        brand: 'Michelin',
        model: 'Energy XM2+',
        category: 'auto',
        width: 195,
        profile: 65,
        diameter: 15,
        price: 45000,
        price_list: 52000,
        stock: 10,
        description: 'Neumático de alto rendimiento'
      },
      {
        // Ejemplo con dimensiones en la descripción (se extraerán automáticamente)
        sku: 'PIR-205-55-16',
        name: '205/55R16 91V CINTURATO P7',
        brand: 'Pirelli',
        model: 'CINTURATO P7',
        category: '', // Se categorizará automáticamente
        price: 50000,
        stock: 5,
        description: '205/55R16 91V CINTURATO P7'
      }
    ]

    const templateConSucursales = [
      {
        CODIGO_PROPIO: '001',
        CODIGO_PROVEEDOR: '3629900',
        DESCRIPCION: '175/65R15 84T CINTURATO P4',
        MARCA: 'PIRELLI',
        CATEGORIA: 'CUBIERTAS',
        RUBRO: 'NEUMATICOS',
        SUBRUBRO: 'AUTO',
        BELGRANO: 5,
        CATAMARCA: 3,
        LA_BANDA: 0,
        SALTA: 2,
        TUCUMAN: 1,
        VIRGEN: 0,
        PROVEEDOR: 'PIRELLI NEUMATICOS SAIC'
      },
      {
        CODIGO_PROPIO: '002',
        CODIGO_PROVEEDOR: '3629901',
        DESCRIPCION: '235/60R18 107H XL SCORPION VERDE',
        MARCA: 'PIRELLI',
        CATEGORIA: 'CUBIERTAS',
        RUBRO: 'NEUMATICOS',
        SUBRUBRO: 'CAMIONETA',
        BELGRANO: 2,
        CATAMARCA: 1,
        LA_BANDA: 1,
        SALTA: 0,
        TUCUMAN: 3,
        VIRGEN: 2,
        PROVEEDOR: 'PIRELLI NEUMATICOS SAIC'
      }
    ]

    const wb = XLSX.utils.book_new()

    // Hoja 1: Template Simple
    const ws1 = XLSX.utils.json_to_sheet(templateSimple)
    XLSX.utils.book_append_sheet(wb, ws1, 'Formato Simple')

    // Hoja 2: Template con Sucursales
    const ws2 = XLSX.utils.json_to_sheet(templateConSucursales)
    XLSX.utils.book_append_sheet(wb, ws2, 'Formato Sucursales')

    XLSX.writeFile(wb, 'template_productos.xlsx')
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Importar Productos</h2>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Descargar Template Excel
          </button>
        </div>

        {/* Zona de drag & drop */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>

          <p className="mt-2 text-sm text-gray-600">
            {file ? (
              <span className="font-semibold">{file.name}</span>
            ) : (
              <>
                <span className="font-semibold">Arrastra tu archivo Excel aquí</span> o haz clic para seleccionar
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">XLSX, XLS o CSV hasta 10MB</p>
        </div>

        {/* Preview de datos */}
        {preview.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Vista Previa (primeros 10 registros)</h3>

            {/* Info sobre formato detectado */}
            {preview[0]._hasSucursales && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800 font-medium">
                  ✓ Formato con stock por sucursal detectado
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Se encontraron columnas de stock para: Belgrano, Catamarca, La Banda, Salta, Tucumán, Virgen
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0])
                      .filter(key => !key.startsWith('_'))
                      .slice(0, 8)
                      .map(key => (
                        <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {Object.entries(row)
                        .filter(([key]) => !key.startsWith('_'))
                        .slice(0, 8)
                        .map(([key, value], i) => (
                          <td key={i} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {value?.toString() || '-'}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info adicional sobre el proceso */}
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Proceso de normalización automática:
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Se extraerán las dimensiones (ancho/perfil/diámetro) desde la descripción</li>
                <li>• Se categorizará automáticamente (auto, camioneta, camión, moto)</li>
                <li>• Se limpiarán descripciones y códigos</li>
                {preview[0]._hasSucursales && (
                  <li>• Se consolidará el stock total desde las sucursales</li>
                )}
                <li>• Se utilizará service role key para bypass de RLS (si está disponible)</li>
              </ul>
            </div>

            {/* Opción para eliminar productos existentes */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteExisting}
                  onChange={(e) => setDeleteExisting(e.target.checked)}
                  className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Eliminar todos los productos existentes antes de importar
                </span>
              </label>
              {deleteExisting && (
                <p className="text-xs text-yellow-800 mt-2">
                  ⚠️ Esta acción eliminará TODOS los productos actuales de la base de datos antes de importar los nuevos.
                </p>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={loading}
              className="mt-4 w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Importando...' : `Importar ${preview.length} productos`}
            </button>
          </div>
        )}

        {/* Resultado de importación */}
        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? '✅ Importación Exitosa' : '❌ Error en la Importación'}
            </h3>
            {result.totalImported && (
              <p className="text-sm mt-1 text-gray-700">
                Se importaron {result.totalImported} productos correctamente
              </p>
            )}
            {result.results && (
              <ul className="mt-2 space-y-1">
                {result.results.map((r: ImportBatchResult, i: number) => (
                  <li key={i} className="text-sm text-gray-600">
                    Batch {r.batch}: {r.success ? `✓ ${r.count} productos` : `✗ ${r.error}`}
                  </li>
                ))}
              </ul>
            )}
            {result.error && (
              <p className="text-sm mt-1 text-red-600">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}