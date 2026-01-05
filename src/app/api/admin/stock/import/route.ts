// Stock Import API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminAuth } from '@/lib/auth/admin-check'
import { parseTireDescription } from '@/lib/tire-parser'
import { parseTireDescriptionWithAI } from '@/lib/ai/tire-parser-ai'
import type { AIModel } from '@/lib/ai/types'
import type { Database } from '@/types/database'

// Type aliases from Database
type ProductInsert = Database['public']['Tables']['products']['Insert']

// Branch name to code mapping
const BRANCH_MAPPING: Record<string, string> = {
  'BELGRANO': 'BELGRANO',
  'CATAMARCA': 'CATAMARCA',
  'LA_BANDA': 'LA_BANDA',
  'SALTA': 'SALTA',
  'SANTIAGO': 'SANTIAGO',
  'TUCUMAN': 'TUCUMAN',
  'VIRGEN': 'VIRGEN',
}

interface ExcelRow {
  CODIGO_PROPIO: string
  CODIGO_PROVEEDOR: string
  DESCRIPCION: string
  BELGRANO: number | null
  CATAMARCA: number | null
  LA_BANDA: number | null
  SALTA: number | null
  SANTIAGO: number | null
  TUCUMAN: number | null
  VIRGEN: number | null
  MARCA: string
  PUBLICO: number
  CONTADO: number
  STOCK: number
}

// Database branch record type
interface DBBranch {
  id: string
  code: string
  name: string
}

// ProductInsertData is now ProductInsert from Database types

// Stock record for branch
interface StockRecord {
  product_id: string
  branch_id: string
  quantity: number
  last_updated: string
}

// Stock data per product before DB insert
interface ProductStockData {
  branchId: string
  branchCode: string
  quantity: number
}

// SSE event data types
interface SSEEventData {
  [key: string]: unknown
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

async function createStreamingResponse(jsonData: ExcelRow[], aiModel: AIModel) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: SSEEventData) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      try {
        // Send initial event
        sendEvent('start', {
          totalRows: jsonData.length,
          aiModel
        })

        const result: ImportResult = {
          success: true,
          totalRows: jsonData.length,
          processed: 0,
          created: 0,
          updated: 0,
          errors: [],
          warnings: [],
          samples: [],
          stats: {
            regex_used: 0,
            ai_used: 0,
            ai_model: aiModel,
            estimated_cost: 0,
          },
        }

        // Clear existing data
        sendEvent('progress', { message: 'Limpiando datos existentes...', step: 'cleanup' })

        const { error: stockDeleteError } = await supabaseAdmin
          .from('branch_stock')
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000')

        if (stockDeleteError) throw new Error('Failed to clear existing stock')

        const { error: vouchersDeleteError } = await supabaseAdmin
          .from('vouchers')
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000')

        if (vouchersDeleteError) throw new Error('Failed to clear existing vouchers')

        const { error: productsDeleteError } = await supabaseAdmin
          .from('products')
          .delete()
          .gte('id', '00000000-0000-0000-0000-000000000000')

        if (productsDeleteError) throw new Error('Failed to clear existing products')

        sendEvent('progress', { message: 'Datos limpiados. Iniciando importación...', step: 'cleanup_complete' })

        // Get branches
        const { data: branches } = await supabaseAdmin
          .from('branches')
          .select('id, code, name')

        if (!branches || branches.length === 0) {
          throw new Error('No branches found in database')
        }

        const branchMap = new Map<string, string>(
          branches.map((b: DBBranch) => [b.code, b.id])
        )

        // ==================== PHASE 1: PARSE ALL PRODUCTS ====================
        sendEvent('progress', {
          message: `Fase 1/3: Parseando ${jsonData.length} productos...`,
          step: 'phase1_parsing'
        })

        const BATCH_SIZE = 100
        const totalBatches = Math.ceil(jsonData.length / BATCH_SIZE)
        const productsToInsert: ProductInsert[] = []
        const stockDataByProduct: Array<{ sku: string, stocks: ProductStockData[] }> = []

        // Process in batches to maintain parallelism while parsing
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const startIdx = batchIndex * BATCH_SIZE
          const endIdx = Math.min(startIdx + BATCH_SIZE, jsonData.length)
          const batch = jsonData.slice(startIdx, endIdx)

          // Process entire batch in parallel (parsing only)
          const batchResults = await Promise.all(
            batch.map(async (row, batchOffset) => {
              const i = startIdx + batchOffset
              const rowNumber = i + 3
              const progressPercent = Math.round(((i + 1) / jsonData.length) * 100)

              try {
                if (!row.CODIGO_PROPIO || !row.DESCRIPCION) {
                  const error = { row: rowNumber, sku: row.CODIGO_PROPIO || 'N/A', error: 'Missing required fields' }
                  result.errors.push(error)
                  sendEvent('error', { ...error, progress: progressPercent })
                  return null
                }

                // Parse tire description
                let tireData = parseTireDescription(row.DESCRIPCION)
                let usedAI = false

                if (tireData.parse_confidence < 70) {
                  try {
                    sendEvent('progress', {
                      message: `🤖 IA: ${row.DESCRIPCION.substring(0, 40)}...`,
                      sku: row.CODIGO_PROPIO,
                      progress: progressPercent
                    })
                    tireData = await parseTireDescriptionWithAI(row.DESCRIPCION, aiModel)
                    usedAI = true
                    result.stats.ai_used++
                    const costPerProduct = aiModel === 'gpt-4o-mini' ? 0.0003 : 0.006
                    result.stats.estimated_cost += costPerProduct
                  } catch (aiError) {
                    const warning = { row: rowNumber, sku: row.CODIGO_PROPIO, warning: 'AI parsing failed' }
                    result.warnings.push(warning)
                    sendEvent('warning', { ...warning, progress: progressPercent })
                  }
                } else {
                  result.stats.regex_used++
                }

                // Send progress event
                sendEvent('progress', {
                  row: rowNumber,
                  sku: row.CODIGO_PROPIO,
                  description: row.DESCRIPCION,
                  method: usedAI ? 'ai' : 'regex',
                  confidence: tireData.parse_confidence,
                  progress: progressPercent,
                  message: `${usedAI ? '🤖' : '⚡'} ${row.CODIGO_PROPIO}`
                })

                // Prepare product data (no insert yet)
                const productData = {
                  sku: row.CODIGO_PROPIO,
                  name: tireData.display_name,
                  slug: row.CODIGO_PROPIO.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  width: tireData.width,
                  aspect_ratio: tireData.aspect_ratio,
                  rim_diameter: tireData.rim_diameter,
                  construction: tireData.construction,
                  load_index: tireData.load_index,
                  speed_rating: tireData.speed_rating,
                  extra_load: tireData.extra_load,
                  run_flat: tireData.run_flat,
                  seal_inside: tireData.seal_inside,
                  tube_type: tireData.tube_type,
                  homologation: tireData.homologation,
                  original_description: tireData.original_description,
                  display_name: tireData.display_name,
                  parse_confidence: tireData.parse_confidence,
                  parse_warnings: tireData.parse_warnings,
                  price: row.CONTADO || row.PUBLICO || null,
                  price_list: row.PUBLICO || null,
                  brand_name: row.MARCA || null,
                }

                // Prepare stock data for this product
                const stocks = Object.entries(BRANCH_MAPPING).map(([branchColumnName, branchCode]) => {
                  const rawQuantity = row[branchColumnName as keyof ExcelRow] as number | null
                  const quantity = rawQuantity ?? 0
                  const branchId = branchMap.get(branchCode)

                  if (!branchId) {
                    const warning = { row: rowNumber, sku: row.CODIGO_PROPIO, warning: `Branch not found: ${branchCode}` }
                    result.warnings.push(warning)
                    return null
                  }

                  return {
                    branchId,
                    branchCode,
                    quantity
                  }
                }).filter((stock): stock is ProductStockData => stock !== null)

                // Capture samples
                if (result.samples.length < 10) {
                  result.samples.push({
                    sku: row.CODIGO_PROPIO,
                    original: row.DESCRIPCION,
                    cleaned: tireData.display_name,
                    parsed: {
                      width: tireData.width,
                      aspect_ratio: tireData.aspect_ratio,
                      rim_diameter: tireData.rim_diameter,
                      construction: tireData.construction,
                      load_index: tireData.load_index,
                      speed_rating: tireData.speed_rating,
                    },
                    confidence: tireData.parse_confidence,
                    method: usedAI ? 'ai' : 'regex',
                    ai_model: usedAI ? aiModel : undefined,
                  })
                }

                return { productData, stocks, sku: row.CODIGO_PROPIO }
              } catch (error) {
                const errorObj = { row: rowNumber, sku: row.CODIGO_PROPIO || 'N/A', error: error instanceof Error ? error.message : 'Unknown error' }
                result.errors.push(errorObj)
                sendEvent('error', { ...errorObj, progress: progressPercent })
                return null
              }
            })
          )

          // Add successfully parsed products to insert list
          for (const batchResult of batchResults) {
            if (batchResult) {
              productsToInsert.push(batchResult.productData)
              stockDataByProduct.push({ sku: batchResult.sku, stocks: batchResult.stocks })
            }
          }

          // Send batch completion event
          const batchProgress = Math.round(((batchIndex + 1) / totalBatches) * 100)
          sendEvent('progress', {
            message: `Parseado ${productsToInsert.length}/${jsonData.length} productos (${batchProgress}%)`,
            step: 'parse_batch_complete',
            batchIndex: batchIndex + 1,
            totalBatches,
            progress: batchProgress
          })
        }

        // ==================== PHASE 2: BULK INSERT PRODUCTS ====================
        sendEvent('progress', {
          message: `Fase 2/3: Insertando ${productsToInsert.length} productos en bulk...`,
          step: 'phase2_bulk_insert_products'
        })

        const PRODUCT_CHUNK_SIZE = 500
        const productChunks = []
        for (let i = 0; i < productsToInsert.length; i += PRODUCT_CHUNK_SIZE) {
          productChunks.push(productsToInsert.slice(i, i + PRODUCT_CHUNK_SIZE))
        }

        const insertedProducts: Array<{ id: string, sku: string }> = []

        for (let chunkIndex = 0; chunkIndex < productChunks.length; chunkIndex++) {
          const chunk = productChunks[chunkIndex]

          sendEvent('progress', {
            message: `Insertando chunk ${chunkIndex + 1}/${productChunks.length} (${chunk.length} productos)...`,
            step: 'inserting_product_chunk'
          })

          // Type assertion needed due to Supabase generated types compatibility issue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: newProducts, error: bulkInsertError } = await (supabaseAdmin as any)
            .from('products')
            .insert(chunk)
            .select('id, sku')

          if (bulkInsertError) {
            throw new Error(`Bulk insert failed: ${bulkInsertError.message}`)
          }

          if (newProducts) {
            insertedProducts.push(...newProducts)
            result.created += newProducts.length
            result.processed += newProducts.length
          }
        }

        sendEvent('progress', {
          message: `✅ ${insertedProducts.length} productos insertados`,
          step: 'phase2_complete'
        })

        // ==================== PHASE 3: BULK INSERT STOCKS ====================
        sendEvent('progress', {
          message: `Fase 3/3: Insertando stocks para ${insertedProducts.length} productos...`,
          step: 'phase3_bulk_insert_stocks'
        })

        // Create SKU to product ID mapping
        const skuToIdMap = new Map(insertedProducts.map(p => [p.sku, p.id]))

        // DEBUG: Log mapping info
        console.log(`📊 SKU to ID map size: ${skuToIdMap.size}`)
        console.log(`📊 Stock data by product count: ${stockDataByProduct.length}`)

        // Prepare all stock records
        const allStockRecords: StockRecord[] = []
        let skippedProducts = 0
        let emptyStocks = 0

        for (const { sku, stocks } of stockDataByProduct) {
          const productId = skuToIdMap.get(sku)
          if (!productId) {
            skippedProducts++
            console.warn(`⚠️ Product ID not found for SKU: ${sku}`)
            continue
          }

          if (!stocks || stocks.length === 0) {
            emptyStocks++
            console.warn(`⚠️ Empty stocks array for SKU: ${sku}`)
          }

          for (const stock of stocks) {
            if (stock) {
              // Ensure quantity is never negative (fix for Excel with negative values)
              const safeQuantity = Math.max(0, stock.quantity)

              allStockRecords.push({
                product_id: productId,
                branch_id: stock.branchId,
                quantity: safeQuantity,
                last_updated: new Date().toISOString()
              })
            }
          }
        }

        console.log(`📊 Skipped products (no ID): ${skippedProducts}`)
        console.log(`📊 Products with empty stocks: ${emptyStocks}`)
        console.log(`📊 Total stock records prepared: ${allStockRecords.length}`)

        // Bulk insert all stocks in chunks
        const STOCK_CHUNK_SIZE = 1000
        const stockChunks = []
        for (let i = 0; i < allStockRecords.length; i += STOCK_CHUNK_SIZE) {
          stockChunks.push(allStockRecords.slice(i, i + STOCK_CHUNK_SIZE))
        }

        for (let chunkIndex = 0; chunkIndex < stockChunks.length; chunkIndex++) {
          const chunk = stockChunks[chunkIndex]

          sendEvent('progress', {
            message: `Insertando stocks ${chunkIndex + 1}/${stockChunks.length} (${chunk.length} registros)...`,
            step: 'inserting_stock_chunk'
          })

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: stockBulkError } = await (supabaseAdmin as any)
            .from('branch_stock')
            .insert(chunk)

          if (stockBulkError) {
            console.error('Stock bulk insert error:', stockBulkError)
            result.warnings.push({
              row: 0,
              sku: 'BULK',
              warning: `Stock bulk insert chunk ${chunkIndex + 1} failed: ${stockBulkError.message}`
            })
          }
        }

        sendEvent('progress', {
          message: `✅ ${allStockRecords.length} registros de stock insertados`,
          step: 'phase3_complete'
        })

        result.success = result.errors.length === 0 || result.processed > 0

        // Send completion event
        sendEvent('complete', {
          success: result.success,
          processed: result.processed,
          created: result.created,
          errors: result.errors.length,
          warnings: result.warnings.length,
          stats: result.stats,
          samples: result.samples
        })

        controller.close()
      } catch (error) {
        sendEvent('error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fatal: true
        })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const aiModel = (formData.get('aiModel') as AIModel) || 'gpt-4o-mini'
    const useStream = formData.get('stream') === 'true' // Enable SSE streaming

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    console.log(`🤖 Using AI model: ${aiModel} for fallback parsing`)

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON, skipping first row (merged header)
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
      range: 1, // Start from row 2 (0-indexed)
      defval: null,
    })

    console.log(`📊 Processing ${jsonData.length} rows from Excel`)

    // If streaming is enabled, use Server-Sent Events
    if (useStream) {
      return createStreamingResponse(jsonData, aiModel)
    }

    const result: ImportResult = {
      success: true,
      totalRows: jsonData.length,
      processed: 0,
      created: 0,
      updated: 0,
      errors: [],
      warnings: [],
      samples: [],
      stats: {
        regex_used: 0,
        ai_used: 0,
        ai_model: aiModel,
        estimated_cost: 0,
      },
    }

    // 🗑️ CLEAR EXISTING DATA: Excel is the source of truth, delete all products and stock
    console.log('🗑️ Cleaning existing products and stock...')

    // Step 1: Delete all branch_stock entries (child of products)
    const { error: stockDeleteError } = await supabaseAdmin
      .from('branch_stock')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // Delete all records (UUID >= 00000000...)

    if (stockDeleteError) {
      console.error('❌ Failed to delete branch stock:', stockDeleteError)
      return NextResponse.json(
        { error: 'Failed to clear existing stock', details: stockDeleteError.message },
        { status: 500 }
      )
    }
    console.log('✅ Branch stock cleared')

    // Step 2: Delete all vouchers entries (child of products)
    const { error: vouchersDeleteError } = await supabaseAdmin
      .from('vouchers')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // Delete all records (UUID >= 00000000...)

    if (vouchersDeleteError) {
      console.error('❌ Failed to delete vouchers:', vouchersDeleteError)
      return NextResponse.json(
        { error: 'Failed to clear existing vouchers', details: vouchersDeleteError.message },
        { status: 500 }
      )
    }
    console.log('✅ Vouchers cleared')

    // Step 3: Delete all products (parent table)
    const { error: productsDeleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000') // Delete all records (UUID >= 00000000...)

    if (productsDeleteError) {
      console.error('❌ Failed to delete products:', productsDeleteError)
      return NextResponse.json(
        { error: 'Failed to clear existing products', details: productsDeleteError.message },
        { status: 500 }
      )
    }

    console.log('✅ Existing data cleared successfully')

    // Get all branches with their codes
    const { data: branches } = await supabaseAdmin
      .from('branches')
      .select('id, code, name')

    if (!branches || branches.length === 0) {
      return NextResponse.json(
        { error: 'No branches found in database' },
        { status: 500 }
      )
    }

    const branchMap = new Map<string, string>(
      branches.map((b: DBBranch) => [b.code, b.id])
    )

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      const rowNumber = i + 3 // +3 because Excel starts at 1, we skip 2 header rows

      try {
        // Validate required fields
        if (!row.CODIGO_PROPIO || !row.DESCRIPCION) {
          result.errors.push({
            row: rowNumber,
            sku: row.CODIGO_PROPIO || 'N/A',
            error: 'Missing required fields (CODIGO_PROPIO or DESCRIPCION)',
          })
          continue
        }

        // HYBRID PARSING: Try RegEx first, fallback to AI if confidence is low
        let tireData = parseTireDescription(row.DESCRIPCION)
        let usedAI = false

        if (tireData.parse_confidence < 70) {
          // Low confidence with RegEx → Use AI
          try {
            console.log(`🤖 Low confidence (${tireData.parse_confidence}%) for "${row.DESCRIPCION}", using AI...`)
            tireData = await parseTireDescriptionWithAI(row.DESCRIPCION, aiModel)
            usedAI = true
            result.stats.ai_used++

            // Estimate cost (rough approximation: ~100 tokens per product)
            const costPerProduct = aiModel === 'gpt-4o-mini' ? 0.0003 : 0.006
            result.stats.estimated_cost += costPerProduct
          } catch (aiError) {
            console.error(`❌ AI parsing failed, keeping RegEx result:`, aiError)
            // Keep RegEx result even with low confidence
            result.warnings.push({
              row: rowNumber,
              sku: row.CODIGO_PROPIO,
              warning: `AI parsing failed, using low-confidence RegEx result (${tireData.parse_confidence}%)`,
            })
          }
        } else {
          result.stats.regex_used++
        }

        // Log remaining low confidence warnings (after AI attempt)
        if (tireData.parse_confidence < 70) {
          result.warnings.push({
            row: rowNumber,
            sku: row.CODIGO_PROPIO,
            warning: `Low parse confidence (${tireData.parse_confidence}%): ${tireData.parse_warnings.join(', ')}`,
          })
        }

        // Create new product (we always create since we deleted all existing products)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newProduct, error: createError } = await (supabaseAdmin as any)
          .from('products')
          .insert({
            sku: row.CODIGO_PROPIO,
            name: tireData.display_name,
            slug: row.CODIGO_PROPIO.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            width: tireData.width,
            aspect_ratio: tireData.aspect_ratio,
            rim_diameter: tireData.rim_diameter,
            construction: tireData.construction,
            load_index: tireData.load_index,
            speed_rating: tireData.speed_rating,
            extra_load: tireData.extra_load,
            run_flat: tireData.run_flat,
            seal_inside: tireData.seal_inside,
            tube_type: tireData.tube_type,
            homologation: tireData.homologation,
            original_description: tireData.original_description,
            display_name: tireData.display_name,
            parse_confidence: tireData.parse_confidence,
            parse_warnings: tireData.parse_warnings,
            price: row.CONTADO || row.PUBLICO || null,
            price_list: row.PUBLICO || null,
            brand_name: row.MARCA || null,
          })
          .select('id')
          .single()

        if (createError) throw createError
        if (!newProduct) throw new Error('Failed to create product')

        const productId = newProduct.id
        result.created++

        // Update branch stock for each branch
        for (const [branchColumnName, branchCode] of Object.entries(BRANCH_MAPPING)) {
          const rawQuantity = row[branchColumnName as keyof ExcelRow] as number | null

          // If cell is empty/null, stock should be 0
          const quantity = rawQuantity ?? 0

          const branchId = branchMap.get(branchCode)
          if (!branchId) {
            result.warnings.push({
              row: rowNumber,
              sku: row.CODIGO_PROPIO,
              warning: `Branch not found: ${branchCode}`,
            })
            continue
          }

          // Insert branch stock (we deleted all stock at the beginning)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: stockError } = await (supabaseAdmin as any)
            .from('branch_stock')
            .insert({
              product_id: productId,
              branch_id: branchId,
              quantity: quantity,
              last_updated: new Date().toISOString(),
            })

          if (stockError) {
            result.warnings.push({
              row: rowNumber,
              sku: row.CODIGO_PROPIO,
              warning: `Failed to update stock for ${branchCode}: ${stockError.message}`,
            })
          }
        }

        result.processed++

        // Capture samples for display (first 10 products)
        if (result.samples.length < 10) {
          result.samples.push({
            sku: row.CODIGO_PROPIO,
            original: row.DESCRIPCION,
            cleaned: tireData.display_name,
            parsed: {
              width: tireData.width,
              aspect_ratio: tireData.aspect_ratio,
              rim_diameter: tireData.rim_diameter,
              construction: tireData.construction,
              load_index: tireData.load_index,
              speed_rating: tireData.speed_rating,
            },
            confidence: tireData.parse_confidence,
            method: usedAI ? 'ai' : 'regex',
            ai_model: usedAI ? aiModel : undefined,
          })
        }

      } catch (error) {
        // Log first error in detail for debugging
        if (result.errors.length === 0) {
          console.error('❌ First import error details:', error)
        }
        result.errors.push({
          row: rowNumber,
          sku: row.CODIGO_PROPIO || 'N/A',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Determine overall success
    result.success = result.errors.length === 0 || result.processed > 0

    console.log(`✅ Import completed:`, {
      processed: result.processed,
      created: result.created,
      errors: result.errors.length,
      warnings: result.warnings.length,
      regex_used: result.stats.regex_used,
      ai_used: result.stats.ai_used,
      ai_model: result.stats.ai_model,
      estimated_cost: `$${result.stats.estimated_cost.toFixed(2)}`,
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Import error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process import',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
