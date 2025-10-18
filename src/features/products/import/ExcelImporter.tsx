'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { ImportRow } from '../types'
import { importProducts } from '../api'

export default function ExcelImporter() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

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
      const json = XLSX.utils.sheet_to_json(worksheet) as ImportRow[]

      // Preview primeros 10 registros
      setPreview(json.slice(0, 10))
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

      const result = await importProducts(json)
      setResult(result)
      setLoading(false)
    }

    reader.readAsBinaryString(file)
  }

  const downloadTemplate = () => {
    const template = [
      {
        sku: 'MICH-195-65-15',
        name: 'Michelin Energy XM2+',
        brand: 'Michelin',
        model: 'Energy XM2+',
        category: 'neumatico',
        width: 195,
        profile: 65,
        diameter: 15,
        price: 45000,
        price_list: 52000,
        stock: 10,
        description: 'Neumático de alto rendimiento'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productos')
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).slice(0, 8).map(key => (
                      <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).slice(0, 8).map((value, i) => (
                        <td key={i} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {value?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                {result.results.map((r: any, i: number) => (
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