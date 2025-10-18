const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Función para parsear la descripción y extraer medidas
function parseProductDescription(description) {
  if (!description || typeof description !== 'string') {
    return null
  }

  // Limpiar la descripción
  const cleaned = description.trim()

  // Patrón para medidas estándar: 205/75R15, 225/45ZR17, etc.
  const standardPattern = /^(\d{2,3})\/(\d{2})(?:Z)?R(\d{2})/i
  const match = cleaned.match(standardPattern)

  if (match) {
    return {
      width: parseInt(match[1]),
      profile: parseInt(match[2]),
      diameter: parseInt(match[3]),
      sizeDisplay: `${match[1]}/${match[2]}R${match[3]}`
    }
  }

  // Patrón alternativo para formatos como 5.20S12
  const altPattern = /^(\d+\.?\d*)S(\d{2})/i
  const altMatch = cleaned.match(altPattern)

  if (altMatch) {
    return {
      width: Math.round(parseFloat(altMatch[1]) * 25.4), // Convertir pulgadas a mm aproximado
      profile: null,
      diameter: parseInt(altMatch[2]),
      sizeDisplay: cleaned.split(/\s+/)[0]
    }
  }

  return null
}

// Función para extraer el modelo del producto
function extractModel(description) {
  if (!description) return null

  // Buscar el modelo después de las especificaciones técnicas
  // Patrón: después del índice de carga/velocidad viene el modelo
  const parts = description.split(/\s+/)

  // Filtrar partes que parecen ser el modelo (texto alfabético, no especificaciones técnicas)
  const modelParts = []
  let foundSpecs = false

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // Skip medidas y specs técnicas
    if (part.match(/^\d+\/\d+/) || part.match(/^R\d+/) || part.match(/^\d+[A-Z]$/) || part.match(/^XL$/i) || part.match(/^R-F$/i) || part.match(/^TT$/i)) {
      foundSpecs = true
      continue
    }

    // Después de las specs, capturar el modelo
    if (foundSpecs && part.match(/^[A-Z]/i) && !part.match(/^\([A-Z0-9]+\)/)) {
      modelParts.push(part)
    }
  }

  return modelParts.length > 0 ? modelParts.join(' ') : null
}

async function importPirelliData() {
  console.log('📊 Importando datos de Pirelli...\n')

  try {
    // Leer archivo Excel
    const workbook = XLSX.readFile('/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_14_10_25.xlsx')
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    console.log(`✓ Archivo leído: ${rawData.length} filas encontradas\n`)

    // La primera fila son los encabezados en la primera celda
    // La segunda fila son los encabezados reales
    const headers = rawData[1]

    // Mapear índices de columnas
    const colMap = {
      codigoPropio: 0,
      codigoProveedor: 1,
      descripcion: 2,
      proveedor: 18,
      categoria: 19,
      rubro: 20,
      subrubro: 21,
      marca: 22
    }

    const products = []
    let skipped = 0
    let processed = 0

    // Procesar desde la fila 3 (índice 2) en adelante
    for (let i = 2; i < rawData.length; i++) {
      const row = rawData[i]

      // Saltar filas vacías
      if (!row || !row[colMap.descripcion]) {
        skipped++
        continue
      }

      const description = row[colMap.descripcion]
      const sizeInfo = parseProductDescription(description)

      if (!sizeInfo) {
        console.log(`⚠️  Fila ${i + 1}: No se pudo parsear medida - ${description}`)
        skipped++
        continue
      }

      const model = extractModel(description)

      // Mapear categoría de Pirelli a nuestras categorías
      const rawCategory = row[colMap.categoria] || row[colMap.subrubro] || ''
      let category = 'auto' // por defecto

      if (rawCategory.match(/SUV|PICK|CAMIONETA|4X4|SCORPION/i)) {
        category = 'camioneta'
      } else if (rawCategory.match(/CAMI[OÓ]N|TRUCK|LT|CARGO/i)) {
        category = 'camion'
      }

      const product = {
        name: description,
        brand: 'Pirelli',
        model: model,
        category: category,
        size: sizeInfo.sizeDisplay,
        width: sizeInfo.width,
        profile: sizeInfo.profile,
        diameter: sizeInfo.diameter,
        load_index: null,
        speed_rating: null,
        price: 0, // Precio por defecto, deberás actualizarlo
        stock: 0, // Stock por defecto
        image_url: null,
        description: `Neumático Pirelli ${model || ''} ${sizeInfo.sizeDisplay}`.trim(),
        features: row[colMap.codigoProveedor] ? `SKU: ${row[colMap.codigoProveedor]}` : null
      }

      products.push(product)
      processed++

      // Mostrar progreso cada 50 productos
      if (processed % 50 === 0) {
        console.log(`✓ Procesados ${processed} productos...`)
      }
    }

    console.log(`\n📝 Resumen del procesamiento:`)
    console.log(`   - Total filas: ${rawData.length - 2}`)
    console.log(`   - Procesados: ${processed}`)
    console.log(`   - Omitidos: ${skipped}`)
    console.log(`   - Para insertar: ${products.length}\n`)

    if (products.length === 0) {
      console.log('❌ No hay productos para insertar')
      return
    }

    // Confirmar antes de insertar
    console.log('🚀 Insertando productos en la base de datos...\n')

    // Insertar en lotes de 100
    const batchSize = 100
    let inserted = 0
    let errors = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)

      const { data, error } = await supabase
        .from('products')
        .insert(batch)
        .select()

      if (error) {
        console.error(`❌ Error en lote ${Math.floor(i / batchSize) + 1}:`, error.message)
        errors += batch.length
      } else {
        inserted += data.length
        console.log(`✓ Lote ${Math.floor(i / batchSize) + 1}: ${data.length} productos insertados`)
      }
    }

    console.log(`\n✅ Importación completada:`)
    console.log(`   - Insertados exitosamente: ${inserted}`)
    console.log(`   - Errores: ${errors}`)

    // Mostrar algunos ejemplos
    if (inserted > 0) {
      console.log('\n📋 Ejemplos de productos insertados:')
      const { data: samples } = await supabase
        .from('products')
        .select('name, brand, model, width, profile, diameter, category')
        .eq('brand', 'Pirelli')
        .order('created_at', { ascending: false })
        .limit(5)

      samples?.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name}`)
        console.log(`      Modelo: ${p.model || 'N/A'} | Medidas: ${p.width}/${p.profile || 'N/A'}R${p.diameter} | Categoría: ${p.category}`)
      })
    }

  } catch (error) {
    console.error('❌ Error durante la importación:', error)
    process.exit(1)
  }
}

// Ejecutar
importPirelliData()
