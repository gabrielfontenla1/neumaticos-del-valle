// Streaming Stock Update API - Real-time progress via SSE
import { NextRequest } from 'next/server'
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
  CODIGO_PROVEEDOR?: string | number
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
  CATEGORIA?: string
  RUBRO?: string
  SUBRUBRO?: string
  PROVEEDOR?: string
  MARCA?: string
  [key: string]: string | number | undefined
}

// Stream event types
type StreamEvent =
  | { type: 'start'; totalRows: number; timestamp: string }
  | { type: 'progress'; current: number; total: number; percent: number }
  | { type: 'processing'; codigo: string; descripcion: string }
  | { type: 'success'; codigo: string; precio: number; stock: number; descripcion: string }
  | { type: 'not_found'; codigo: string; descripcion: string }
  | { type: 'skipped'; codigo: string; reason: string }
  | { type: 'error'; codigo: string; message: string }
  | { type: 'complete'; result: UpdateResult }

interface UpdateResult {
  success: boolean
  mode: 'prices_and_stock' | 'prices_only' | 'stock_only'
  source: SourceType
  totalRows: number
  updated: number
  notFound: number
  skipped: number
  errors: Array<{ codigo: string; error: string }>
  priceUpdates: number
  stockUpdates: number
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
  if (row['CODIGO PROPIO'] && !row.CODIGO_PROPIO) {
    normalized.CODIGO_PROPIO = row['CODIGO PROPIO']
  }
  if (row['LA BANDA'] && !row.LA_BANDA) {
    normalized.LA_BANDA = row['LA BANDA']
  }
  return normalized
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

const CORVEN_CATEGORIES = ['AGR', 'CMO', 'VI', 'OTR']

function detectColumns(jsonData: ExcelRow[]) {
  if (jsonData.length === 0) {
    return {
      hasPrices: false,
      hasStock: false,
      stockColumns: [] as string[],
      hasCorvenColumns: false
    }
  }

  const sampleRow = jsonData[0]
  const columns = Object.keys(sampleRow).map(col => col.toUpperCase())

  const hasCONTADO = columns.includes('CONTADO')
  const hasPUBLICO = columns.includes('PUBLICO')
  const hasPrices = hasCONTADO && hasPUBLICO

  const stockColumns: string[] = []
  for (const sucursal of SUCURSALES) {
    if (columns.includes(sucursal) || columns.includes(sucursal.replace('_', ' '))) {
      stockColumns.push(sucursal)
    }
  }
  const hasStock = stockColumns.length > 0

  const hasCategoria = columns.includes('CATEGORIA')
  let hasCorvenColumns = false

  if (hasCategoria) {
    const categoriaValues = new Set<string>()
    for (let i = 0; i < Math.min(50, jsonData.length); i++) {
      const cat = jsonData[i].CATEGORIA
      if (cat && typeof cat === 'string') {
        categoriaValues.add(cat.toUpperCase().trim())
      }
    }
    hasCorvenColumns = CORVEN_CATEGORIES.some(c => categoriaValues.has(c))
  }

  return { hasPrices, hasStock, stockColumns, hasCorvenColumns }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth()
  if (!authResult.authorized) {
    return authResult.response
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const userSource = formData.get('source') as SourceType || 'pirelli'

  if (!file) {
    return new Response(
      JSON.stringify({ error: 'No file uploaded' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
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

  if (!detection.hasPrices && !detection.hasStock) {
    return new Response(
      JSON.stringify({ error: 'El Excel no tiene columnas de precio (CONTADO/PUBLICO) ni de stock' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
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
    return new Response(
      JSON.stringify({ error: 'Error al obtener productos', details: fetchError.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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

  // Create streaming response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

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
        skipped: 0,
        errors: [],
        priceUpdates: 0,
        stockUpdates: 0
      }

      // Emit start event
      emit({
        type: 'start',
        totalRows: normalizedData.length,
        timestamp: new Date().toISOString()
      })

      // Process each row
      for (let i = 0; i < normalizedData.length; i++) {
        const row = normalizedData[i]
        const codigo = cleanCodigo(row.CODIGO_PROPIO)
        const descripcion = row.DESCRIPCION?.substring(0, 50) || ''

        // Skip invalid codes
        if (!codigo || codigo === 'nan') {
          result.skipped++
          continue
        }

        // Emit processing event
        emit({
          type: 'processing',
          codigo,
          descripcion
        })

        // Small delay every 5 items for UI responsiveness
        if (i % 5 === 0) {
          await new Promise(r => setTimeout(r, 5))
        }

        const product = productMap.get(codigo)

        if (!product) {
          result.notFound++
          emit({
            type: 'not_found',
            codigo,
            descripcion
          })

          // Emit progress every 10 items
          if ((i + 1) % 10 === 0) {
            emit({
              type: 'progress',
              current: i + 1,
              total: normalizedData.length,
              percent: Math.round(((i + 1) / normalizedData.length) * 100)
            })
          }
          continue
        }

        // Prepare update data
        const updateData: Record<string, unknown> = {}
        const features = { ...product.features }
        let contado = 0
        let totalStock = 0

        // Update prices if available
        if (detection.hasPrices) {
          contado = safeNumber(row.CONTADO, 0)
          const publico = safeNumber(row.PUBLICO, 0)

          if (contado > 0) {
            updateData.price = contado
            result.priceUpdates++
          }
          if (publico > 0) {
            features.price_list = publico
            updateData.price_list = publico
          }
        }

        // Update stock if available
        if (detection.hasStock) {
          totalStock = calculateTotalStock(row)
          const stockByBranch = getStockByBranch(row)

          updateData.stock = totalStock
          features.stock_by_branch = stockByBranch
          if ('stock_por_sucursal' in features) {
            delete features.stock_por_sucursal
          }
          result.stockUpdates++
        }

        // Save codigo_proveedor if available
        if (row.CODIGO_PROVEEDOR) {
          const codigoProveedor = String(row.CODIGO_PROVEEDOR).trim()
          if (codigoProveedor && codigoProveedor !== 'nan' && codigoProveedor !== '') {
            features.codigo_proveedor = codigoProveedor
          }
        }

        // For Corven: update category and brand
        if (userSource === 'corven' && detection.hasCorvenColumns) {
          if (row.CATEGORIA) {
            updateData.category = mapCorvenCategory(row.CATEGORIA)
          }
          if (row.MARCA) {
            updateData.brand = String(row.MARCA).trim()
          }
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
              emit({
                type: 'error',
                codigo,
                message: updateError.message
              })
            } else {
              result.updated++
              emit({
                type: 'success',
                codigo,
                precio: contado,
                stock: totalStock,
                descripcion
              })
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            result.errors.push({ codigo, error: errorMsg })
            emit({
              type: 'error',
              codigo,
              message: errorMsg
            })
          }
        }

        // Emit progress every 10 items
        if ((i + 1) % 10 === 0) {
          emit({
            type: 'progress',
            current: i + 1,
            total: normalizedData.length,
            percent: Math.round(((i + 1) / normalizedData.length) * 100)
          })
        }
      }

      // Final progress
      emit({
        type: 'progress',
        current: normalizedData.length,
        total: normalizedData.length,
        percent: 100
      })

      result.success = result.errors.length === 0 || result.updated > 0

      // Emit complete event
      emit({
        type: 'complete',
        result
      })

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  })
}
