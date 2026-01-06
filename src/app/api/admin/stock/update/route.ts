// Stock Update API Endpoint - Smart update with Pirelli/Corven support
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'

// Create untyped admin client for flexible updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sucursales conocidas
const SUCURSALES = ['CATAMARCA', 'LA_BANDA', 'SALTA', 'SANTIAGO', 'TUCUMAN', 'VIRGEN', 'BELGRANO']

// Source types
type SourceType = 'pirelli' | 'corven'

// Corven category mapping to product categories
const CORVEN_CATEGORY_MAP: Record<string, string> = {
  'AGR': 'agro',
  'CMO': 'camion',
  'VI': 'industrial',
}

interface ExcelRow {
  CODIGO_PROPIO?: string
  'CODIGO PROPIO'?: string
  DESCRIPCION?: string
  PUBLICO?: number
  CONTADO?: number
  CATAMARCA?: number
  LA_BANDA?: number
  'LA BANDA'?: number
  SALTA?: number
  SANTIAGO?: number
  TUCUMAN?: number
  VIRGEN?: number
  BELGRANO?: number
  // Corven-specific columns
  CATEGORIA?: string
  RUBRO?: string
  SUBRUBRO?: string
  PROVEEDOR?: string
  MARCA?: string
  [key: string]: string | number | undefined
}

interface DetectionResult {
  hasPrices: boolean
  hasStock: boolean
  priceColumns: string[]
  stockColumns: string[]
  totalRows: number
  // New: format detection
  detectedFormat: SourceType
  formatIndicators: string[]
  hasCorvenColumns: boolean
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

function cleanCodigo(codigo: string | undefined): string {
  if (!codigo) return ''
  return String(codigo).replace('[', '').replace(']', '').trim()
}

function safeNumber(value: unknown, defaultValue = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

function normalizeColumns(row: ExcelRow): ExcelRow {
  const normalized: ExcelRow = { ...row }

  // Handle alternate column names
  if (row['CODIGO PROPIO'] && !row.CODIGO_PROPIO) {
    normalized.CODIGO_PROPIO = row['CODIGO PROPIO']
  }
  if (row['LA BANDA'] && !row.LA_BANDA) {
    normalized.LA_BANDA = row['LA BANDA']
  }

  return normalized
}

// Corven category values (agro, camiones, industrial)
const CORVEN_CATEGORIES = ['AGR', 'CMO', 'VI', 'OTR']
// Pirelli category values (autos, suvs, motos)
const PIRELLI_CATEGORIES = ['CON', 'SUV', 'CAR', 'VAN', 'MOT']

function detectColumns(jsonData: ExcelRow[]): DetectionResult {
  if (jsonData.length === 0) {
    return {
      hasPrices: false,
      hasStock: false,
      priceColumns: [],
      stockColumns: [],
      totalRows: 0,
      detectedFormat: 'pirelli',
      formatIndicators: [],
      hasCorvenColumns: false
    }
  }

  const sampleRow = jsonData[0]
  const columns = Object.keys(sampleRow).map(col => col.toUpperCase())

  // Detect price columns
  const hasCONTADO = columns.includes('CONTADO')
  const hasPUBLICO = columns.includes('PUBLICO')
  const hasPrices = hasCONTADO && hasPUBLICO

  // Detect stock columns
  const stockColumns: string[] = []
  for (const sucursal of SUCURSALES) {
    if (columns.includes(sucursal) || columns.includes(sucursal.replace('_', ' '))) {
      stockColumns.push(sucursal)
    }
  }
  const hasStock = stockColumns.length > 0

  // Detect format based on CATEGORIA VALUES (not just column presence)
  // Both Pirelli and Corven have CATEGORIA column, but with different values
  const hasCategoria = columns.includes('CATEGORIA')

  let detectedFormat: SourceType = 'pirelli'
  const formatIndicators: string[] = []
  let hasCorvenColumns = false

  if (hasCategoria) {
    // Sample first 50 rows to detect format based on CATEGORIA values
    const categoriaValues = new Set<string>()
    for (let i = 0; i < Math.min(50, jsonData.length); i++) {
      const cat = jsonData[i].CATEGORIA
      if (cat && typeof cat === 'string') {
        categoriaValues.add(cat.toUpperCase().trim())
      }
    }

    // Check if it has Corven-specific categories (AGR, CMO, VI)
    const hasCorvenCategories = CORVEN_CATEGORIES.some(c => categoriaValues.has(c))
    // Check if it ONLY has Pirelli categories (no Corven ones)
    const hasPirelliOnly = !hasCorvenCategories &&
      Array.from(categoriaValues).some(c => PIRELLI_CATEGORIES.includes(c))

    if (hasCorvenCategories) {
      detectedFormat = 'corven'
      hasCorvenColumns = true
      // Add found Corven categories as indicators
      CORVEN_CATEGORIES.forEach(cat => {
        if (categoriaValues.has(cat)) {
          formatIndicators.push(`CATEGORIA=${cat}`)
        }
      })
    } else if (hasPirelliOnly) {
      detectedFormat = 'pirelli'
      // Add found Pirelli categories as indicators
      PIRELLI_CATEGORIES.forEach(cat => {
        if (categoriaValues.has(cat)) {
          formatIndicators.push(`CATEGORIA=${cat}`)
        }
      })
    }
  }

  return {
    hasPrices,
    hasStock,
    priceColumns: hasPrices ? ['CONTADO', 'PUBLICO'] : [],
    stockColumns,
    totalRows: jsonData.length,
    detectedFormat,
    formatIndicators,
    hasCorvenColumns
  }
}

function calculateTotalStock(row: ExcelRow): number {
  let total = 0
  for (const sucursal of SUCURSALES) {
    const value = row[sucursal] ?? row[sucursal.replace('_', ' ')]
    total += safeNumber(value, 0)
  }
  return Math.max(0, total)
}

function getStockByBranch(row: ExcelRow): Record<string, number> {
  const stockByBranch: Record<string, number> = {}
  for (const sucursal of SUCURSALES) {
    const value = row[sucursal] ?? row[sucursal.replace('_', ' ')]
    const stock = safeNumber(value, 0)
    if (stock > 0) {
      stockByBranch[sucursal.toLowerCase()] = stock
    }
  }
  return stockByBranch
}

function mapCorvenCategory(categoria: string | undefined): string {
  if (!categoria) return 'agro'
  const cat = categoria.toUpperCase().trim()
  return CORVEN_CATEGORY_MAP[cat] || 'agro'
}

// GET: Info endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Stock Update API - Supports Pirelli and Corven formats',
    usage: {
      analyze: 'POST with file + action=analyze + source=pirelli|corven',
      update: 'POST with file + action=update + source=pirelli|corven'
    }
  })
}

// POST: Analyze or Update
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const action = formData.get('action') as string || 'analyze'
    const userSource = formData.get('source') as SourceType || 'pirelli'

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Find header row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    let headerRow = 0

    for (let row = range.s.r; row <= Math.min(range.e.r, 10); row++) {
      let rowText = ''
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })]
        if (cell && cell.v) {
          rowText += String(cell.v).toUpperCase() + ' '
        }
      }
      if (rowText.includes('CODIGO_PROPIO') || rowText.includes('CODIGO PROPIO') || rowText.includes('DESCRIPCION')) {
        headerRow = row
        break
      }
    }

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
      range: headerRow,
      defval: null,
    })

    const normalizedData = jsonData.map(normalizeColumns)
    const detection = detectColumns(normalizedData)

    // Check for format mismatch
    const formatMismatch = detection.detectedFormat !== userSource
    let mismatchWarning: string | undefined

    if (formatMismatch) {
      if (userSource === 'pirelli' && detection.hasCorvenColumns) {
        mismatchWarning = `Seleccionaste "Pirelli" pero el archivo tiene columnas de Corven (${detection.formatIndicators.join(', ')}). ¿Estás seguro?`
      } else if (userSource === 'corven' && !detection.hasCorvenColumns) {
        mismatchWarning = `Seleccionaste "Corven" pero el archivo NO tiene la columna CATEGORIA. Parece ser formato Pirelli.`
      }
    }

    // If action is 'analyze', return detection info
    if (action === 'analyze') {
      return NextResponse.json({
        success: true,
        detection,
        userSource,
        formatMismatch,
        mismatchWarning,
        message: formatMismatch
          ? `⚠️ ${mismatchWarning}`
          : detection.hasPrices && detection.hasStock
            ? `✅ Excel ${detection.detectedFormat.toUpperCase()} con precios y stock detectado`
            : detection.hasPrices
              ? `✅ Excel ${detection.detectedFormat.toUpperCase()} solo con precios detectado`
              : detection.hasStock
                ? `✅ Excel ${detection.detectedFormat.toUpperCase()} solo con stock detectado`
                : '❌ No se detectaron columnas válidas'
      })
    }

    // Action is 'update'
    if (!detection.hasPrices && !detection.hasStock) {
      return NextResponse.json(
        { error: 'El Excel no tiene columnas de precio (CONTADO/PUBLICO) ni de stock (sucursales)' },
        { status: 400 }
      )
    }

    // Get products from DB
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock, category, brand, features') as {
        data: Array<{
          id: string
          name: string
          price: number
          stock: number | null
          category: string | null
          brand: string | null
          features: Record<string, unknown> | null
        }> | null
        error: Error | null
      }

    if (fetchError) {
      return NextResponse.json(
        { error: 'Error al obtener productos', details: fetchError.message },
        { status: 500 }
      )
    }

    // Create lookup map
    const productMap = new Map<string, {
      id: string
      name: string
      price: number
      stock: number
      category: string
      brand: string
      features: Record<string, unknown>
    }>()

    for (const p of products || []) {
      const features = p.features as Record<string, unknown> | null
      const codigo = features?.codigo_propio ? String(features.codigo_propio).trim() : null
      if (codigo) {
        productMap.set(codigo, {
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock || 0,
          category: p.category || '',
          brand: p.brand || '',
          features: features || {}
        })
      }
    }

    console.log(`📊 Products in DB: ${productMap.size}`)
    console.log(`📊 Rows in Excel: ${normalizedData.length}`)
    console.log(`📊 Source: ${userSource} (detected: ${detection.detectedFormat})`)

    const result: UpdateResult = {
      success: true,
      mode: detection.hasPrices && detection.hasStock
        ? 'prices_and_stock'
        : detection.hasPrices
          ? 'prices_only'
          : 'stock_only',
      source: userSource,
      totalRows: normalizedData.length,
      updated: 0,
      notFound: 0,
      created: 0,
      errors: [],
      priceUpdates: 0,
      stockUpdates: 0,
      formatMismatch,
      mismatchWarning
    }

    // Process each row
    for (const row of normalizedData) {
      const codigo = cleanCodigo(row.CODIGO_PROPIO)

      if (!codigo || codigo === 'nan') {
        continue
      }

      const product = productMap.get(codigo)

      if (!product) {
        result.notFound++
        continue
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {}
      const features = { ...product.features }

      // Update prices if available
      if (detection.hasPrices) {
        const contado = safeNumber(row.CONTADO, 0)
        const publico = safeNumber(row.PUBLICO, 0)

        if (contado > 0) {
          updateData.price = contado
          result.priceUpdates++
        }
        if (publico > 0) {
          features.price_list = publico
        }
      }

      // Update stock if available
      if (detection.hasStock) {
        const totalStock = calculateTotalStock(row)
        const stockByBranch = getStockByBranch(row)

        updateData.stock = totalStock
        // Always update stock_by_branch (even if empty, to clear old data)
        features.stock_by_branch = stockByBranch
        // Remove legacy field if present
        if ('stock_por_sucursal' in features) {
          delete features.stock_por_sucursal
        }
        result.stockUpdates++
      }

      // For Corven: update category and brand from Excel
      if (userSource === 'corven' && detection.hasCorvenColumns) {
        if (row.CATEGORIA) {
          updateData.category = mapCorvenCategory(row.CATEGORIA)
        }
        if (row.MARCA) {
          updateData.brand = String(row.MARCA).trim()
        }
        // Store additional Corven metadata
        if (row.RUBRO) features.rubro = row.RUBRO
        if (row.SUBRUBRO) features.subrubro = row.SUBRUBRO
        if (row.PROVEEDOR) features.proveedor = row.PROVEEDOR
      }

      // Update features if changed
      if (JSON.stringify(features) !== JSON.stringify(product.features)) {
        updateData.features = features
      }

      // Execute update
      if (Object.keys(updateData).length > 0) {
        try {
          const { error: updateError } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', product.id)

          if (updateError) {
            result.errors.push({ codigo, error: updateError.message })
          } else {
            result.updated++
          }
        } catch (err) {
          result.errors.push({ codigo, error: err instanceof Error ? err.message : 'Unknown error' })
        }
      }
    }

    result.success = result.errors.length === 0 || result.updated > 0

    console.log(`✅ Update completed:`, {
      source: result.source,
      mode: result.mode,
      updated: result.updated,
      notFound: result.notFound,
      errors: result.errors.length
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Update error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process update',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
