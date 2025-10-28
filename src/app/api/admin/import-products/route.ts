import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  normalizeExcelRow,
  convertToProduct,
  parseTireSize,
  determineCategory,
  cleanDescription,
  normalizeModelName
} from '@/features/products/utils/importHelpers'

// Usar service role key para bypass de RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { products: rows } = await request.json()

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { success: false, error: 'No se recibieron productos para importar' },
        { status: 400 }
      )
    }

    // Detectar si es una importación estilo Pirelli con columnas de sucursales
    const hasSucursales = rows.length > 0 &&
      (rows[0].BELGRANO !== undefined ||
       rows[0].CATAMARCA !== undefined ||
       rows[0].LA_BANDA !== undefined)

    const products = rows.map(row => {
      // Si tiene formato de sucursales, usar la lógica de normalización completa
      if (hasSucursales) {
        const normalizedRow = normalizeExcelRow(row)
        return convertToProduct(normalizedRow)
      }

      // Si no, usar la lógica simple existente mejorada
      const description = cleanDescription(
        row.description?.toString() ||
        row.DESCRIPCION?.toString() ||
        row.name?.toString() || ''
      )

      // Normalizar el modelo
      const modelNormalized = normalizeModelName(description)

      // Extraer dimensiones automáticamente si no vienen
      let width = row.width ? parseInt(row.width.toString()) : null
      let profile = row.profile ? parseInt(row.profile.toString()) : null
      let diameter = row.diameter ? parseInt(row.diameter.toString()) : null

      if (!width || !profile || !diameter) {
        const extracted = parseTireSize(modelNormalized)
        width = width || extracted.width
        profile = profile || extracted.profile
        diameter = diameter || extracted.diameter
      }

      // Determinar categoría (también puede venir del Excel)
      const categoriaExcel = (row.CATEGORIA?.toString() || row.categoria?.toString() || '').toUpperCase()
      let category = ''

      // Mapear categorías del Excel a nuestras categorías
      if (categoriaExcel.includes('CON') || categoriaExcel.includes('CAR')) {
        category = determineCategory(modelNormalized, width)
      } else if (categoriaExcel.includes('SUV') || categoriaExcel.includes('CAMIONETA')) {
        category = 'camioneta'
      } else if (categoriaExcel.includes('CAMION')) {
        category = 'camion'
      } else if (categoriaExcel.includes('MOTO')) {
        category = 'moto'
      } else {
        category = row.category?.toString().trim() || determineCategory(modelNormalized, width)
      }

      // Validar que la categoría sea válida
      const validCategories = ['auto', 'camioneta', 'camion', 'moto']
      const finalCategory = validCategories.includes(category) ? category : 'auto'

      // Crear nombre del producto con modelo normalizado
      let name = cleanDescription(row.name?.toString().trim() || modelNormalized)
      // Solo agregar dimensiones si son válidas (no null y no 0)
      if (width && profile && diameter && width > 0 && profile > 0 && diameter > 0 && !name.includes('/')) {
        name = `${width}/${profile}R${diameter} ${modelNormalized}`
      } else {
        // Si el nombre ya existe pero tiene códigos extraños, limpiarlo
        name = cleanDescription(name)
      }
      // Si no hay nombre válido, usar el modelo normalizado
      if (!name || name.length < 3) {
        name = modelNormalized || description || 'PRODUCTO SIN NOMBRE'
      }

      // Obtener marca
      const brand = (row.brand?.toString().trim() || row.MARCA?.toString().trim() || 'PIRELLI').toUpperCase()

      // Manejo de precios mejorado
      // PUBLICO es precio de lista, CONTADO es precio con descuento
      const priceList = row.PUBLICO ? parseFloat(row.PUBLICO.toString()) :
                       row.price_list ? parseFloat(row.price_list.toString()) : 0
      const priceSale = row.CONTADO ? parseFloat(row.CONTADO.toString()) :
                       row.price ? parseFloat(row.price.toString().replace(/[^0-9.-]/g, '')) : 0

      // Si no hay precio de venta pero sí precio de lista, aplicar descuento
      const finalPrice = priceSale || (priceList ? priceList * 0.75 : 100000)
      const finalPriceList = priceList || (priceSale ? priceSale / 0.75 : 0)

      return {
        name: name.substring(0, 200),
        brand,
        model: modelNormalized.substring(0, 100),
        category: finalCategory,
        width,
        profile,
        diameter,
        price: finalPrice,
        stock: row.stock ? parseInt(row.stock.toString()) : 0,
        description: modelNormalized,
        features: {
          ...row.features,
          price_list: finalPriceList,
          discount_percentage: finalPriceList > finalPrice ?
            Math.round(((finalPriceList - finalPrice) / finalPriceList) * 100) : 0
        },
        image_url: '/mock-tire.png'
      }
    })

    // Crear cliente con service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Primero, opcionalmente eliminar productos existentes si se solicita
    const shouldDeleteExisting = request.headers.get('X-Delete-Existing') === 'true'

    if (shouldDeleteExisting) {
      // Contar productos existentes
      const { count: existingCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (existingCount && existingCount > 0) {
        // Eliminar todos los productos existentes
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Condición que siempre es true

        if (deleteError) {
          console.error('Error eliminando productos existentes:', deleteError)
        } else {
          console.log(`Eliminados ${existingCount} productos existentes`)
        }
      }
    }

    // Importar en batches de 50
    const batchSize = 50
    const results = []
    let totalImported = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1

      try {
        const { data, error } = await supabase
          .from('products')
          .insert(batch)
          .select()

        if (error) {
          console.error(`Error importing batch ${batchNumber}:`, error)
          results.push({
            success: false,
            error: error.message,
            batch: batchNumber,
            code: error.code
          })
        } else {
          const importedCount = data?.length || 0
          totalImported += importedCount
          console.log(`✓ Batch ${batchNumber} imported successfully: ${importedCount} products`)
          results.push({
            success: true,
            count: importedCount,
            batch: batchNumber
          })
        }
      } catch (err) {
        console.error(`Exception in batch ${batchNumber}:`, err)
        results.push({
          success: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
          batch: batchNumber
        })
      }
    }

    const allSuccessful = results.every(r => r.success)

    return NextResponse.json({
      success: allSuccessful,
      results,
      totalImported,
      totalProducts: products.length,
      hasSucursales,
      message: allSuccessful
        ? `✅ Se importaron ${totalImported} productos correctamente`
        : `⚠️ Se importaron ${totalImported} de ${products.length} productos`
    })

  } catch (error) {
    console.error('Error in import endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}