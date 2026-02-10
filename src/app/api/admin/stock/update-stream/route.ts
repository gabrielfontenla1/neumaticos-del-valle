// Streaming Stock Update API - Batch parallel RPC for ~90% speedup
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
  | { type: 'batch_progress'; batchIndex: number; totalBatches: number; batchUpdated: number; message: string }
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

// Build update payload for a single product row
interface ProductUpdate {
  id: number
  codigo: string
  descripcion: string
  price?: number
  price_list?: number
  stock?: number
  features?: Record<string, unknown>
  category?: string
  brand?: string
}

function buildUpdatePayload(
  row: ExcelRow,
  product: { id: string; features: Record<string, unknown> },
  detection: { hasPrices: boolean; hasStock: boolean; hasCorvenColumns: boolean },
  userSource: SourceType
): { update: ProductUpdate; hasPriceUpdate: boolean; hasStockUpdate: boolean } | null {
  const codigo = cleanCodigo(row.CODIGO_PROPIO)
  const descripcion = row.DESCRIPCION?.substring(0, 50) || ''
  const features = { ...product.features }
  let hasPriceUpdate = false
  let hasStockUpdate = false

  const update: ProductUpdate = {
    id: Number(product.id),
    codigo,
    descripcion,
  }

  // Update prices if available
  if (detection.hasPrices) {
    const contado = safeNumber(row.CONTADO, 0)
    const publico = safeNumber(row.PUBLICO, 0)

    if (contado > 0) {
      update.price = contado
      hasPriceUpdate = true
    }
    if (publico > 0) {
      features.price_list = publico
      update.price_list = publico
    }
  }

  // Update stock if available
  if (detection.hasStock) {
    const totalStock = calculateTotalStock(row)
    const stockByBranch = getStockByBranch(row)

    update.stock = totalStock
    features.stock_by_branch = stockByBranch
    if ('stock_por_sucursal' in features) {
      delete features.stock_por_sucursal
    }
    hasStockUpdate = true
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
      update.category = mapCorvenCategory(row.CATEGORIA)
    }
    if (row.MARCA) {
      update.brand = String(row.MARCA).trim()
    }
    if (row.RUBRO) features.rubro = row.RUBRO
    if (row.SUBRUBRO) features.subrubro = row.SUBRUBRO
    if (row.PROVEEDOR) features.proveedor = row.PROVEEDOR
  }

  // Check if features changed
  if (JSON.stringify(features) !== JSON.stringify(product.features)) {
    update.features = features
  }

  // Only return if there's something to update
  const hasChanges = update.price !== undefined ||
    update.price_list !== undefined ||
    update.stock !== undefined ||
    update.features !== undefined ||
    update.category !== undefined ||
    update.brand !== undefined

  if (!hasChanges) return null

  return { update, hasPriceUpdate, hasStockUpdate }
}

// Split array into chunks
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// Run promises with concurrency limit
async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length)
  let nextIndex = 0

  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++
      try {
        const value = await tasks[index]()
        results[index] = { status: 'fulfilled', value }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext())
  await Promise.all(workers)
  return results
}

const BATCH_SIZE = 150
const MAX_CONCURRENCY = 3

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

      // ============================================================
      // PHASE 1: Preparation (CPU only) — iterate rows, build payloads
      // ============================================================
      const updatePayloads: ProductUpdate[] = []
      const branchStockRecords: Array<{ product_id: number; branch_code: string; quantity: number }> = []
      // Track codigo→descripcion for success/error events
      const codigoMap = new Map<number, { codigo: string; descripcion: string; precio: number; stock: number }>()

      for (let i = 0; i < normalizedData.length; i++) {
        const row = normalizedData[i]
        const codigo = cleanCodigo(row.CODIGO_PROPIO)
        const descripcion = row.DESCRIPCION?.substring(0, 50) || ''

        // Skip invalid codes
        if (!codigo || codigo === 'nan') {
          result.skipped++
          continue
        }

        const product = productMap.get(codigo)

        if (!product) {
          result.notFound++
          emit({ type: 'not_found', codigo, descripcion })
          continue
        }

        const payload = buildUpdatePayload(row, product, detection, userSource)
        if (!payload) {
          result.skipped++
          continue
        }

        updatePayloads.push(payload.update)
        if (payload.hasPriceUpdate) result.priceUpdates++
        if (payload.hasStockUpdate) result.stockUpdates++

        codigoMap.set(Number(product.id), {
          codigo,
          descripcion,
          precio: payload.update.price || 0,
          stock: payload.update.stock || 0,
        })

        // Collect branch_stock records
        if (detection.hasStock) {
          const stockByBranch = getStockByBranch(row)
          for (const [branchCode, quantity] of Object.entries(stockByBranch)) {
            branchStockRecords.push({
              product_id: Number(product.id),
              branch_code: branchCode,
              quantity,
            })
          }
        }
      }

      // Progress: preparation complete (30%)
      emit({
        type: 'progress',
        current: 0,
        total: normalizedData.length,
        percent: 30
      })

      emit({
        type: 'batch_progress',
        batchIndex: 0,
        totalBatches: Math.ceil(updatePayloads.length / BATCH_SIZE),
        batchUpdated: 0,
        message: `Preparacion: ${updatePayloads.length} productos para actualizar, ${result.notFound} no encontrados`
      })

      // ============================================================
      // PHASE 2: Batch updates via RPC (parallel, max 3 concurrent)
      // ============================================================
      if (updatePayloads.length > 0) {
        const batches = chunk(updatePayloads, BATCH_SIZE)
        const totalBatches = batches.length
        let completedBatches = 0

        const tasks = batches.map((batch, batchIdx) => {
          return async () => {
            // Build the JSONB payload for the RPC
            const rpcPayload = batch.map(item => {
              const obj: Record<string, unknown> = { id: item.id }
              if (item.price !== undefined) obj.price = item.price
              if (item.price_list !== undefined) obj.price_list = item.price_list
              if (item.stock !== undefined) obj.stock = item.stock
              if (item.features !== undefined) obj.features = item.features
              if (item.category !== undefined) obj.category = item.category
              if (item.brand !== undefined) obj.brand = item.brand
              return obj
            })

            const { data, error } = await supabaseAdmin.rpc('bulk_update_products', {
              p_updates: rpcPayload
            })

            completedBatches++
            const percent = 30 + Math.round((completedBatches / totalBatches) * 50)

            if (error) {
              // Entire batch failed — record errors for all items
              for (const item of batch) {
                const info = codigoMap.get(item.id)
                result.errors.push({
                  codigo: info?.codigo || String(item.id),
                  error: error.message
                })
                if (info) {
                  emit({ type: 'error', codigo: info.codigo, message: error.message })
                }
              }

              emit({
                type: 'batch_progress',
                batchIndex: batchIdx + 1,
                totalBatches,
                batchUpdated: 0,
                message: `Lote ${batchIdx + 1}/${totalBatches} ERROR: ${error.message}`
              })
            } else {
              const batchUpdated = data?.updated ?? batch.length
              result.updated += batchUpdated

              // Emit individual success events for UI
              for (const item of batch) {
                const info = codigoMap.get(item.id)
                if (info) {
                  emit({
                    type: 'success',
                    codigo: info.codigo,
                    precio: info.precio,
                    stock: info.stock,
                    descripcion: info.descripcion
                  })
                }
              }

              // Handle per-item errors from RPC response
              const rpcErrors = data?.errors || []
              if (Array.isArray(rpcErrors)) {
                for (const rpcErr of rpcErrors) {
                  if (rpcErr && typeof rpcErr === 'object' && 'id' in rpcErr) {
                    const errId = Number(rpcErr.id)
                    const info = codigoMap.get(errId)
                    result.errors.push({
                      codigo: info?.codigo || String(errId),
                      error: String(rpcErr.error || 'Unknown RPC error')
                    })
                    if (info) {
                      emit({ type: 'error', codigo: info.codigo, message: String(rpcErr.error) })
                    }
                  }
                }
              }

              emit({
                type: 'batch_progress',
                batchIndex: batchIdx + 1,
                totalBatches,
                batchUpdated,
                message: `Lote ${batchIdx + 1}/${totalBatches}: ${batchUpdated} actualizados`
              })
            }

            // Progress update
            emit({
              type: 'progress',
              current: Math.min(
                Math.round((completedBatches / totalBatches) * normalizedData.length),
                normalizedData.length
              ),
              total: normalizedData.length,
              percent
            })

            return data
          }
        })

        await parallelLimit(tasks, MAX_CONCURRENCY)
      }

      // ============================================================
      // PHASE 3: Sync branch_stock via RPC (single call)
      // ============================================================
      if (branchStockRecords.length > 0) {
        emit({
          type: 'batch_progress',
          batchIndex: 0,
          totalBatches: 1,
          batchUpdated: 0,
          message: `Sincronizando stock por sucursal: ${branchStockRecords.length} registros...`
        })

        try {
          const { data: branchResult, error: branchError } = await supabaseAdmin.rpc(
            'bulk_upsert_branch_stock',
            { p_records: branchStockRecords }
          )

          if (branchError) {
            emit({
              type: 'batch_progress',
              batchIndex: 1,
              totalBatches: 1,
              batchUpdated: 0,
              message: `Error sincronizando branch_stock: ${branchError.message}`
            })
          } else {
            const upserted = branchResult?.upserted ?? branchStockRecords.length
            emit({
              type: 'batch_progress',
              batchIndex: 1,
              totalBatches: 1,
              batchUpdated: upserted,
              message: `branch_stock sincronizado: ${upserted} registros`
            })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          emit({
            type: 'batch_progress',
            batchIndex: 1,
            totalBatches: 1,
            batchUpdated: 0,
            message: `Error branch_stock: ${msg}`
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
