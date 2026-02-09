/**
 * Stock Update Verification API
 *
 * Compares Excel data against Supabase database to verify
 * that all updates were applied correctly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'
import type {
  VerificationRequest,
  VerificationResult,
  VerificationItem,
  ExcelRowCache,
} from '@/features/admin/types/stock-update'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ProductFeatures {
  codigo_propio?: string
  price_list?: number
  stock_by_branch?: Record<string, number>
  [key: string]: unknown
}

interface ProductRow {
  id: string
  name: string
  price: number
  stock: number | null
  features: ProductFeatures | null
}

/**
 * Calculate discount percentage between list price and actual price
 */
function calculateDiscountPercent(listPrice: number, actualPrice: number): number {
  if (listPrice <= 0 || actualPrice <= 0) return 0
  if (actualPrice >= listPrice) return 0
  return Math.round(((listPrice - actualPrice) / listPrice) * 100)
}

/**
 * Compare Excel row with database product
 */
function compareItem(
  excelRow: ExcelRowCache,
  product: ProductRow | null
): VerificationItem {
  const differences: string[] = []

  // If product not found in DB
  if (!product) {
    return {
      codigo_propio: excelRow.codigo_propio,
      descripcion: excelRow.descripcion,
      status: 'not_found',
      excel: {
        contado: excelRow.contado,
        publico: excelRow.publico,
        stock_total: excelRow.stock_total,
        stock_by_branch: excelRow.stock_by_branch,
      },
      database: null,
      frontend: {
        main_price: 0,
        list_price: 0,
        discount_percent: 0,
        stock_status: 'out_of_stock',
      },
      differences: ['Producto no encontrado en base de datos'],
    }
  }

  const features = product.features || {}
  const dbPriceList = Number(features.price_list) || 0
  const dbStockByBranch = (features.stock_by_branch || {}) as Record<string, number>
  const dbStock = product.stock || 0

  // Compare prices
  if (excelRow.contado > 0 && Math.abs(product.price - excelRow.contado) > 0.01) {
    differences.push(`Precio CONTADO: Excel $${excelRow.contado.toLocaleString()} vs DB $${product.price.toLocaleString()}`)
  }

  if (excelRow.publico > 0 && Math.abs(dbPriceList - excelRow.publico) > 0.01) {
    differences.push(`Precio PUBLICO: Excel $${excelRow.publico.toLocaleString()} vs DB $${dbPriceList.toLocaleString()}`)
  }

  // Compare total stock
  if (Math.abs(dbStock - excelRow.stock_total) > 0) {
    differences.push(`Stock total: Excel ${excelRow.stock_total} vs DB ${dbStock}`)
  }

  // Compare stock by branch
  const allBranches = new Set([
    ...Object.keys(excelRow.stock_by_branch),
    ...Object.keys(dbStockByBranch),
  ])

  for (const branch of allBranches) {
    const excelStock = excelRow.stock_by_branch[branch] || 0
    const dbBranchStock = dbStockByBranch[branch] || 0
    if (excelStock !== dbBranchStock) {
      differences.push(`Stock ${branch}: Excel ${excelStock} vs DB ${dbBranchStock}`)
    }
  }

  const status: VerificationItem['status'] = differences.length > 0 ? 'mismatch' : 'match'

  // Calculate frontend values
  const mainPrice = product.price
  const listPrice = dbPriceList || product.price
  const discountPercent = calculateDiscountPercent(listPrice, mainPrice)
  const stockStatus = dbStock > 0 ? 'available' : 'out_of_stock'

  return {
    codigo_propio: excelRow.codigo_propio,
    descripcion: excelRow.descripcion,
    status,
    excel: {
      contado: excelRow.contado,
      publico: excelRow.publico,
      stock_total: excelRow.stock_total,
      stock_by_branch: excelRow.stock_by_branch,
    },
    database: {
      price: product.price,
      price_list: dbPriceList,
      stock: dbStock,
      stock_by_branch: dbStockByBranch,
    },
    frontend: {
      main_price: mainPrice,
      list_price: listPrice,
      discount_percent: discountPercent,
      stock_status: stockStatus,
    },
    differences,
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth()
  if (!authResult.authorized) {
    return authResult.response
  }

  try {
    const body = await request.json() as VerificationRequest

    if (!body.excelData || !Array.isArray(body.excelData)) {
      return NextResponse.json(
        { error: 'Missing or invalid excelData' },
        { status: 400 }
      )
    }

    if (body.excelData.length === 0) {
      return NextResponse.json(
        { error: 'No data to verify' },
        { status: 400 }
      )
    }

    // Extract all codigo_propio values
    const codigos = body.excelData
      .map(row => row.codigo_propio)
      .filter(Boolean)

    // Fetch all matching products from DB in one query
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock, features')

    if (fetchError) {
      console.error('Error fetching products:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener productos de la base de datos' },
        { status: 500 }
      )
    }

    // Create lookup map by codigo_propio
    const productMap = new Map<string, ProductRow>()
    for (const p of products || []) {
      const features = p.features as ProductFeatures | null
      const codigo = features?.codigo_propio ? String(features.codigo_propio).trim() : null
      if (codigo) {
        productMap.set(codigo, p as ProductRow)
      }
    }

    // Compare each Excel row with DB
    const items: VerificationItem[] = []
    let matches = 0
    let mismatches = 0
    let notFound = 0

    for (const excelRow of body.excelData) {
      const product = productMap.get(excelRow.codigo_propio) || null
      const item = compareItem(excelRow, product)
      items.push(item)

      switch (item.status) {
        case 'match':
          matches++
          break
        case 'mismatch':
          mismatches++
          break
        case 'not_found':
          notFound++
          break
      }
    }

    const result: VerificationResult = {
      timestamp: new Date().toISOString(),
      source: body.source,
      total: body.excelData.length,
      matches,
      mismatches,
      notFound,
      items,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Error durante la verificacion' },
      { status: 500 }
    )
  }
}
