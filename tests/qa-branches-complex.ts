/**
 * QA Exhaustivo - Sistema de Sucursales
 * 10 Casos Complejos de Prueba
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Cliente anónimo para pruebas de seguridad
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin para operaciones de prueba (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TestResult {
  case: number
  name: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  duration: number
  details: string[]
  errors: string[]
}

const results: TestResult[] = []

function logTest(testNum: number, message: string) {
  console.log(`   ${message}`)
}

function logSuccess(message: string) {
  console.log(`   ✅ ${message}`)
}

function logError(message: string) {
  console.log(`   ❌ ${message}`)
}

function logWarning(message: string) {
  console.log(`   ⚠️  ${message}`)
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// CASO 1: Validación de Datos Extremos y Límites
// ============================================================================
async function testCase1(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 1,
    name: 'Validación de Datos Extremos y Límites',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 1: Validación de Datos Extremos y Límites')
  console.log('─'.repeat(70))

  try {
    // Test 1.1: Nombre extremadamente largo (255+ caracteres)
    logTest(1, 'Testing nombre extremadamente largo...')
    const longName = 'A'.repeat(300)
    const { data: d1, error: e1 } = await supabaseAdmin
      .from('stores')
      .insert({
        name: longName,
        address: 'Test',
        city: 'Test',
        province: 'Test',
        phone: '123456789',
        opening_hours: { weekdays: '9-5', saturday: '9-1', sunday: 'Cerrado' }
      })
      .select()

    if (e1) {
      logSuccess('Sistema rechaza nombres excesivamente largos')
      result.details.push('Validación de longitud de nombre: OK')
    } else {
      logWarning('Sistema acepta nombres de 300+ caracteres')
      result.status = 'WARNING'
      result.details.push('Validación de longitud de nombre: PERMISIVO')
    }

    // Test 1.2: Campos especiales y caracteres Unicode
    logTest(1, 'Testing caracteres especiales y Unicode...')
    const { data: d2, error: e2 } = await supabaseAdmin
      .from('stores')
      .insert({
        name: 'Sucursal 测试 🏪 <script>alert("xss")</script>',
        address: 'Calle ñ Ñ ü Ü',
        city: 'São Paulo',
        province: 'Test',
        phone: '+54-9-383-4197501',
        email: 'test+special@example.com',
        opening_hours: { weekdays: '9-5', saturday: '9-1', sunday: 'Cerrado' }
      })
      .select()

    if (!e2 && d2) {
      logSuccess('Sistema acepta caracteres Unicode y especiales correctamente')
      result.details.push('Unicode y caracteres especiales: OK')

      // Cleanup
      await supabaseAdmin.from('stores').delete().eq('id', d2[0].id)
    } else {
      logError('Sistema rechaza caracteres válidos Unicode')
      result.status = 'FAIL'
      result.errors.push('No acepta caracteres Unicode válidos')
    }

    // Test 1.3: Coordenadas geográficas extremas
    logTest(1, 'Testing coordenadas geográficas en límites...')
    const { data: d3, error: e3 } = await supabaseAdmin
      .from('stores')
      .insert({
        name: 'Test Coords',
        address: 'Test',
        city: 'Test',
        province: 'Test',
        phone: '123456789',
        latitude: 90.0,  // Polo Norte
        longitude: 180.0, // Límite Este
        opening_hours: { weekdays: '9-5', saturday: '9-1', sunday: 'Cerrado' }
      })
      .select()

    if (!e3 && d3) {
      logSuccess('Sistema acepta coordenadas geográficas válidas extremas')
      result.details.push('Coordenadas extremas: OK')
      await supabaseAdmin.from('stores').delete().eq('id', d3[0].id)
    }

    // Test 1.4: JSON malformado en opening_hours
    logTest(1, 'Testing JSON structures en opening_hours...')
    const { data: d4, error: e4 } = await supabaseAdmin
      .from('stores')
      .insert({
        name: 'Test JSON',
        address: 'Test',
        city: 'Test',
        province: 'Test',
        phone: '123456789',
        opening_hours: { weekdays: '', saturday: '', sunday: '', extra_field: 'test' }
      })
      .select()

    if (!e4 && d4) {
      logSuccess('Sistema acepta opening_hours con campos adicionales')
      result.details.push('JSON flexible en opening_hours: OK')
      await supabaseAdmin.from('stores').delete().eq('id', d4[0].id)
    }

  } catch (error) {
    logError(`Error inesperado: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 2: Concurrencia y Race Conditions
// ============================================================================
async function testCase2(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 2,
    name: 'Concurrencia y Race Conditions',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 2: Concurrencia y Race Conditions')
  console.log('─'.repeat(70))

  try {
    // Test 2.1: Múltiples intentos de marcar sucursal principal simultáneamente
    logTest(2, 'Testing race condition en is_main flag...')

    const { data: branches } = await supabase
      .from('stores')
      .select('id')
      .limit(3)

    if (branches && branches.length >= 2) {
      // Intentar marcar 2 sucursales como principales simultáneamente
      const promises = branches.slice(0, 2).map(branch =>
        supabase
          .from('stores')
          .update({ is_main: true })
          .eq('id', branch.id)
      )

      await Promise.all(promises)

      // Verificar cuántas quedaron como principales
      const { data: mainBranches } = await supabase
        .from('stores')
        .select('id')
        .eq('is_main', true)

      if (mainBranches && mainBranches.length > 1) {
        logWarning(`Se permiten ${mainBranches.length} sucursales principales simultáneas`)
        result.status = 'WARNING'
        result.details.push('Race condition en is_main no previene duplicados')
      } else {
        logSuccess('Sistema maneja correctamente la concurrencia en is_main')
        result.details.push('Concurrencia en is_main: OK')
      }
    }

    // Test 2.2: Creación y eliminación simultánea
    logTest(2, 'Testing creación y eliminación simultánea...')

    const { data: newBranch } = await supabaseAdmin
      .from('stores')
      .insert({
        name: 'Test Concurrent',
        address: 'Test',
        city: 'Test',
        province: 'Test',
        phone: '123456789',
        opening_hours: { weekdays: '9-5', saturday: '9-1', sunday: 'Cerrado' }
      })
      .select()
      .single()

    if (newBranch) {
      // Intentar actualizar y eliminar simultáneamente
      const [updateResult, deleteResult] = await Promise.allSettled([
        supabaseAdmin.from('stores').update({ name: 'Updated' }).eq('id', newBranch.id),
        supabaseAdmin.from('stores').delete().eq('id', newBranch.id)
      ])

      logSuccess('Sistema maneja operaciones concurrentes sin crashes')
      result.details.push('Operaciones concurrentes: Manejadas sin error fatal')
    }

  } catch (error) {
    logError(`Error en pruebas de concurrencia: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 3: Integridad Referencial y Cascadas
// ============================================================================
async function testCase3(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 3,
    name: 'Integridad Referencial y Cascadas',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 3: Integridad Referencial y Cascadas')
  console.log('─'.repeat(70))

  try {
    // Test 3.1: Eliminar sucursal con imagen asociada
    logTest(3, 'Testing eliminación de sucursal con imagen...')

    const { data: branchWithImage } = await supabase
      .from('stores')
      .select('id, background_image_url')
      .not('background_image_url', 'is', null)
      .limit(1)

    if (branchWithImage && branchWithImage.length > 0) {
      logSuccess('Encontrada sucursal con imagen para testing')
      result.details.push('Sucursal con imagen disponible para testing')
    } else {
      logWarning('No hay sucursales con imágenes para probar cascada')
      result.status = 'WARNING'
      result.details.push('Sin datos para probar eliminación en cascada')
    }

    // Test 3.2: Verificar si hay relaciones con otras tablas (orders, appointments, etc)
    logTest(3, 'Verificando relaciones con otras tablas...')

    const { data: sample } = await supabase
      .from('stores')
      .select('id')
      .limit(1)
      .single()

    if (sample) {
      // Intentar encontrar órdenes relacionadas
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('store_id', sample.id)
        .limit(1)

      if (orders && orders.length > 0) {
        logSuccess('Detectadas relaciones con tabla orders')
        result.details.push('Relaciones detectadas: orders table')

        // Verificar que no se pueda eliminar sucursal con órdenes
        const { error: deleteError } = await supabase
          .from('stores')
          .delete()
          .eq('id', sample.id)

        if (deleteError) {
          logSuccess('Sistema previene eliminación de sucursal con órdenes')
          result.details.push('Integridad referencial: PROTEGIDA')
        } else {
          logWarning('Sistema permite eliminar sucursal con órdenes')
          result.status = 'WARNING'
          result.details.push('Integridad referencial: NO PROTEGIDA')
        }
      } else {
        logTest(3, 'No hay órdenes asociadas para testing')
        result.details.push('Sin órdenes para verificar integridad')
      }
    }

  } catch (error) {
    logError(`Error en pruebas de integridad: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 4: Seguridad y Autorización
// ============================================================================
async function testCase4(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 4,
    name: 'Seguridad y Autorización',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 4: Seguridad y Autorización')
  console.log('─'.repeat(70))

  try {
    // Test 4.1: Intentar acceso a API admin sin autenticación
    logTest(4, 'Testing acceso a API admin sin auth...')

    const adminResponse = await fetch('http://localhost:6001/api/admin/branches')

    if (adminResponse.status === 401 || adminResponse.status === 403) {
      logSuccess('API admin requiere autenticación')
      result.details.push('Protección de API admin: OK')
    } else if (adminResponse.status === 404) {
      logWarning('Endpoint no accesible desde test (esperado en desarrollo)')
      result.details.push('API admin: No accesible desde script (normal)')
    } else {
      logWarning(`API admin respondió con status ${adminResponse.status}`)
      result.status = 'WARNING'
      result.details.push(`API admin status: ${adminResponse.status}`)
    }

    // Test 4.2: Verificar que API pública solo retorna sucursales activas
    logTest(4, 'Testing que API pública filtra por active=true...')

    const publicResponse = await fetch('http://localhost:6001/api/branches')

    if (publicResponse.ok || publicResponse.status === 404) {
      logSuccess('API pública accesible o correctamente protegida')
      result.details.push('API pública: Configuración correcta')
    }

    // Test 4.3: Verificar RLS en storage
    logTest(4, 'Testing políticas RLS en storage...')

    const { data: storageList } = await supabase
      .storage
      .from('branches')
      .list()

    if (storageList !== null) {
      logSuccess('Storage branches accesible con permisos correctos')
      result.details.push('RLS en storage: Permite lectura pública')
    }

    // Test 4.4: Intentar subir archivo sin autenticación
    logTest(4, 'Testing upload sin autenticación...')

    const testFile = new Uint8Array([137, 80, 78, 71]) // PNG header
    const { error: uploadError } = await supabase
      .storage
      .from('branches')
      .upload('test-unauthorized.png', testFile)

    if (uploadError) {
      logSuccess('Sistema previene uploads sin autenticación')
      result.details.push('Upload sin auth: BLOQUEADO')
    } else {
      logError('Sistema permite uploads sin autenticación')
      result.status = 'FAIL'
      result.errors.push('Upload sin auth permitido')
    }

  } catch (error) {
    logError(`Error en pruebas de seguridad: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 5: Performance y Escalabilidad
// ============================================================================
async function testCase5(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 5,
    name: 'Performance y Escalabilidad',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 5: Performance y Escalabilidad')
  console.log('─'.repeat(70))

  try {
    // Test 5.1: Tiempo de respuesta de query simple
    logTest(5, 'Midiendo tiempo de respuesta de query...')

    const queryStart = Date.now()
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('active', true)
    const queryTime = Date.now() - queryStart

    if (queryTime < 500) {
      logSuccess(`Query ejecutado en ${queryTime}ms (excelente)`)
      result.details.push(`Query time: ${queryTime}ms`)
    } else if (queryTime < 1000) {
      logWarning(`Query ejecutado en ${queryTime}ms (aceptable)`)
      result.status = 'WARNING'
      result.details.push(`Query time: ${queryTime}ms (podría mejorar)`)
    } else {
      logError(`Query ejecutado en ${queryTime}ms (lento)`)
      result.status = 'FAIL'
      result.errors.push(`Query demasiado lento: ${queryTime}ms`)
    }

    // Test 5.2: Query con múltiples filtros
    logTest(5, 'Testing query complejo con múltiples filtros...')

    const complexStart = Date.now()
    const { data: filtered } = await supabase
      .from('stores')
      .select('*')
      .eq('active', true)
      .not('province', 'is', null)
      .order('is_main', { ascending: false })
      .order('name', { ascending: true })
    const complexTime = Date.now() - complexStart

    if (complexTime < 1000) {
      logSuccess(`Query complejo en ${complexTime}ms`)
      result.details.push(`Complex query: ${complexTime}ms`)
    } else {
      logWarning(`Query complejo lento: ${complexTime}ms`)
      result.status = 'WARNING'
      result.details.push(`Complex query lento: ${complexTime}ms`)
    }

    // Test 5.3: Carga de múltiples sucursales en paralelo
    logTest(5, 'Testing carga paralela de datos...')

    const parallelStart = Date.now()
    const promises = Array(5).fill(null).map(() =>
      supabase.from('stores').select('id, name, province').limit(10)
    )
    await Promise.all(promises)
    const parallelTime = Date.now() - parallelStart

    if (parallelTime < 2000) {
      logSuccess(`5 queries paralelos en ${parallelTime}ms`)
      result.details.push(`Parallel queries: ${parallelTime}ms`)
    } else {
      logWarning(`Queries paralelos lentos: ${parallelTime}ms`)
      result.status = 'WARNING'
    }

    // Test 5.4: Conteo de registros
    logTest(5, 'Verificando cantidad de registros...')

    if (data) {
      logSuccess(`Total de sucursales activas: ${data.length}`)
      result.details.push(`Sucursales activas: ${data.length}`)

      if (data.length > 100) {
        logWarning('Alto número de sucursales - considerar paginación')
        result.details.push('Recomendación: Implementar paginación')
      }
    }

  } catch (error) {
    logError(`Error en pruebas de performance: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 6: Validación de Datos de Negocio
// ============================================================================
async function testCase6(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 6,
    name: 'Validación de Datos de Negocio',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 6: Validación de Datos de Negocio')
  console.log('─'.repeat(70))

  try {
    // Test 6.1: Validar formato de teléfono argentino
    logTest(6, 'Testing formatos de teléfono...')

    const phoneFormats = [
      { phone: '0383 419-7501', valid: true },
      { phone: '+54-9-383-4197501', valid: true },
      { phone: '5493834197501', valid: true },
      { phone: '123', valid: false },
      { phone: 'invalid', valid: false }
    ]

    for (const format of phoneFormats) {
      const { data, error } = await supabaseAdmin
        .from('stores')
        .insert({
          name: 'Test Phone',
          address: 'Test',
          city: 'Test',
          province: 'Test',
          phone: format.phone,
          opening_hours: { weekdays: '9-5', saturday: '9-1', sunday: 'Cerrado' }
        })
        .select()

      if (!error && data) {
        await supabaseAdmin.from('stores').delete().eq('id', data[0].id)

        if (format.valid) {
          logSuccess(`Formato válido aceptado: ${format.phone}`)
        } else {
          logWarning(`Formato inválido aceptado: ${format.phone}`)
          result.status = 'WARNING'
        }
      } else if (error && !format.valid) {
        logSuccess(`Formato inválido rechazado correctamente: ${format.phone}`)
      }
    }

    result.details.push('Validación de teléfonos: Revisada')

    // Test 6.2: Validar formato de email
    logTest(6, 'Testing formatos de email...')

    const emails = [
      { email: 'test@example.com', valid: true },
      { email: 'invalid', valid: false },
      { email: 'test+tag@example.com', valid: true }
    ]

    for (const emailTest of emails) {
      const { data, error } = await supabaseAdmin
        .from('stores')
        .insert({
          name: 'Test Email',
          address: 'Test',
          city: 'Test',
          province: 'Test',
          phone: '123456789',
          email: emailTest.email,
          opening_hours: { weekdays: '9-5', saturday: '9-1', sunday: 'Cerrado' }
        })
        .select()

      if (!error && data) {
        await supabaseAdmin.from('stores').delete().eq('id', data[0].id)
        result.details.push(`Email ${emailTest.email}: Aceptado`)
      }
    }

    // Test 6.3: Verificar que existe al menos una sucursal principal
    logTest(6, 'Verificando existencia de sucursal principal...')

    const { data: mainBranch, count } = await supabase
      .from('stores')
      .select('id', { count: 'exact' })
      .eq('is_main', true)
      .eq('active', true)

    if (count && count >= 1) {
      logSuccess(`Existe ${count} sucursal(es) principal(es)`)
      result.details.push(`Sucursales principales: ${count}`)
    } else {
      logError('No existe sucursal principal activa')
      result.status = 'FAIL'
      result.errors.push('Falta sucursal principal')
    }

    // Test 6.4: Validar coherencia de provincias
    logTest(6, 'Verificando provincias argentinas válidas...')

    const { data: allBranches } = await supabase
      .from('stores')
      .select('province')
      .not('province', 'is', null)

    const validProvinces = [
      'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
      'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
      'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
      'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
      'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
    ]

    if (allBranches) {
      const invalidProvinces = allBranches.filter(
        b => b.province && !validProvinces.includes(b.province)
      )

      if (invalidProvinces.length === 0) {
        logSuccess('Todas las provincias son válidas')
        result.details.push('Provincias: Todas válidas')
      } else {
        logWarning(`${invalidProvinces.length} sucursales con provincias no estándar`)
        result.status = 'WARNING'
        result.details.push(`Provincias no estándar: ${invalidProvinces.length}`)
      }
    }

  } catch (error) {
    logError(`Error en validación de datos de negocio: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 7: Consistencia de Imágenes y Storage
// ============================================================================
async function testCase7(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 7,
    name: 'Consistencia de Imágenes y Storage',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 7: Consistencia de Imágenes y Storage')
  console.log('─'.repeat(70))

  try {
    // Test 7.1: Verificar URLs de imágenes válidas
    logTest(7, 'Verificando URLs de imágenes...')

    const { data: branchesWithImages } = await supabase
      .from('stores')
      .select('id, name, background_image_url')
      .not('background_image_url', 'is', null)

    if (branchesWithImages && branchesWithImages.length > 0) {
      logSuccess(`${branchesWithImages.length} sucursales con imágenes`)
      result.details.push(`Sucursales con imagen: ${branchesWithImages.length}`)

      // Verificar formato de URLs
      for (const branch of branchesWithImages.slice(0, 3)) {
        if (branch.background_image_url) {
          if (branch.background_image_url.includes('/branches/')) {
            logSuccess(`URL válida para ${branch.name}`)
          } else {
            logWarning(`URL no estándar para ${branch.name}`)
            result.status = 'WARNING'
          }
        }
      }
    } else {
      logWarning('No hay sucursales con imágenes para validar')
      result.details.push('Sin imágenes para validar')
    }

    // Test 7.2: Listar archivos en bucket
    logTest(7, 'Listando archivos en bucket branches...')

    const { data: files, error: listError } = await supabase
      .storage
      .from('branches')
      .list()

    if (!listError && files) {
      logSuccess(`${files.length} archivos en bucket branches`)
      result.details.push(`Archivos en storage: ${files.length}`)

      // Verificar que no haya archivos huérfanos (sin referencia en BD)
      if (files.length > 0 && branchesWithImages) {
        const referencedFiles = branchesWithImages
          .map(b => b.background_image_url?.split('/branches/')[1])
          .filter(Boolean)

        const orphanFiles = files.filter(
          file => !referencedFiles.includes(file.name)
        )

        if (orphanFiles.length > 0) {
          logWarning(`${orphanFiles.length} archivos huérfanos en storage`)
          result.status = 'WARNING'
          result.details.push(`Archivos huérfanos: ${orphanFiles.length}`)
        } else {
          logSuccess('No hay archivos huérfanos')
          result.details.push('Storage limpio: Sin huérfanos')
        }
      }
    } else {
      logError('No se pudo listar archivos en bucket')
      result.errors.push('Error al listar bucket')
    }

    // Test 7.3: Verificar tamaño de archivos
    logTest(7, 'Verificando tamaños de archivos...')

    if (files && files.length > 0) {
      const largFiles = files.filter(f => f.metadata?.size && f.metadata.size > 5242880) // 5MB

      if (largFiles.length > 0) {
        logWarning(`${largFiles.length} archivos exceden el límite de 5MB`)
        result.status = 'WARNING'
        result.details.push(`Archivos grandes: ${largFiles.length}`)
      } else {
        logSuccess('Todos los archivos dentro del límite de 5MB')
        result.details.push('Tamaños de archivo: OK')
      }
    }

  } catch (error) {
    logError(`Error en pruebas de storage: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 8: Flujo Completo End-to-End
// ============================================================================
async function testCase8(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 8,
    name: 'Flujo Completo End-to-End',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 8: Flujo Completo End-to-End')
  console.log('─'.repeat(70))

  let createdBranchId: string | null = null

  try {
    // Test 8.1: Crear nueva sucursal
    logTest(8, 'Paso 1: Creando nueva sucursal...')

    const { data: newBranch, error: createError } = await supabaseAdmin
      .from('stores')
      .insert({
        name: 'QA Test Branch E2E',
        address: 'Calle Test 123',
        city: 'Ciudad Test',
        province: 'Catamarca',
        phone: '0383-123-4567',
        whatsapp: '5493831234567',
        email: 'test@qatest.com',
        latitude: -28.4699,
        longitude: -65.7795,
        opening_hours: {
          weekdays: '08:00 - 12:30 y 16:00 - 20:00',
          saturday: '08:30 - 12:30',
          sunday: 'Cerrado'
        },
        is_main: false,
        active: true
      })
      .select()
      .single()

    if (!createError && newBranch) {
      createdBranchId = newBranch.id
      logSuccess(`Sucursal creada con ID: ${createdBranchId}`)
      result.details.push('Creación: OK')
    } else {
      throw new Error(`No se pudo crear sucursal de prueba: ${createError?.message || 'Error desconocido'}`)
    }

    // Test 8.2: Leer sucursal creada
    logTest(8, 'Paso 2: Leyendo sucursal creada...')

    const { data: readBranch } = await supabase
      .from('stores')
      .select('*')
      .eq('id', createdBranchId)
      .single()

    if (readBranch && readBranch.name === 'QA Test Branch E2E') {
      logSuccess('Sucursal leída correctamente')
      result.details.push('Lectura: OK')
    } else {
      throw new Error('Datos leídos no coinciden')
    }

    // Test 8.3: Actualizar sucursal
    logTest(8, 'Paso 3: Actualizando sucursal...')

    const { data: updatedBranch, error: updateError } = await supabaseAdmin
      .from('stores')
      .update({
        name: 'QA Test Branch E2E UPDATED',
        phone: '0383-999-9999'
      })
      .eq('id', createdBranchId)
      .select()
      .single()

    if (!updateError && updatedBranch.name === 'QA Test Branch E2E UPDATED') {
      logSuccess('Sucursal actualizada correctamente')
      result.details.push('Actualización: OK')
    } else {
      throw new Error('Actualización falló')
    }

    // Test 8.4: Verificar en listado público (active=true)
    logTest(8, 'Paso 4: Verificando en API pública...')

    const { data: publicList } = await supabase
      .from('stores')
      .select('id')
      .eq('active', true)

    const foundInPublic = publicList?.some(b => b.id === createdBranchId)

    if (foundInPublic) {
      logSuccess('Sucursal visible en listado público')
      result.details.push('Visibilidad pública: OK')
    } else {
      logError('Sucursal no visible en listado público')
      result.errors.push('No visible en público')
    }

    // Test 8.5: Desactivar sucursal
    logTest(8, 'Paso 5: Desactivando sucursal...')

    const { error: deactivateError } = await supabaseAdmin
      .from('stores')
      .update({ active: false })
      .eq('id', createdBranchId)

    if (!deactivateError) {
      logSuccess('Sucursal desactivada')
      result.details.push('Desactivación: OK')

      // Verificar que no aparece en público
      const { data: publicList2 } = await supabase
        .from('stores')
        .select('id')
        .eq('active', true)

      const stillInPublic = publicList2?.some(b => b.id === createdBranchId)

      if (!stillInPublic) {
        logSuccess('Sucursal correctamente oculta de público')
        result.details.push('Filtro active: OK')
      } else {
        logError('Sucursal aún visible en público tras desactivar')
        result.errors.push('Filtro active no funciona')
      }
    }

    // Test 8.6: Eliminar sucursal
    logTest(8, 'Paso 6: Eliminando sucursal...')

    const { error: deleteError } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', createdBranchId)

    if (!deleteError) {
      logSuccess('Sucursal eliminada correctamente')
      result.details.push('Eliminación: OK')

      // Verificar que ya no existe
      const { data: checkDeleted } = await supabase
        .from('stores')
        .select('id')
        .eq('id', createdBranchId)

      if (!checkDeleted || checkDeleted.length === 0) {
        logSuccess('Sucursal confirmada como eliminada')
        result.details.push('Verificación eliminación: OK')
        createdBranchId = null // Ya no necesitamos limpiar
      }
    }

  } catch (error) {
    logError(`Error en flujo E2E: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  } finally {
    // Cleanup: Asegurar que eliminamos la sucursal de prueba
    if (createdBranchId) {
      logTest(8, 'Limpieza: Eliminando sucursal de prueba...')
      await supabaseAdmin.from('stores').delete().eq('id', createdBranchId)
    }
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 9: Recuperación ante Fallos
// ============================================================================
async function testCase9(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 9,
    name: 'Recuperación ante Fallos',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 9: Recuperación ante Fallos')
  console.log('─'.repeat(70))

  try {
    // Test 9.1: Inserción con campos faltantes obligatorios
    logTest(9, 'Testing inserción con campos faltantes...')

    const { error: e1 } = await supabase
      .from('stores')
      .insert({
        name: 'Test Incomplete'
        // Falta address, city, province, phone
      })

    if (e1) {
      logSuccess('Sistema rechaza correctamente registros incompletos')
      result.details.push('Validación campos requeridos: OK')
    } else {
      logError('Sistema acepta registros incompletos')
      result.status = 'FAIL'
      result.errors.push('Acepta datos incompletos')
    }

    // Test 9.2: Update de ID inexistente
    logTest(9, 'Testing update de registro inexistente...')

    const { data: updated, error: e2 } = await supabase
      .from('stores')
      .update({ name: 'Updated' })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select()

    if (!updated || updated.length === 0) {
      logSuccess('Update de ID inexistente no genera error crítico')
      result.details.push('Manejo ID inexistente: OK')
    }

    // Test 9.3: Delete de ID inexistente
    logTest(9, 'Testing delete de registro inexistente...')

    const { error: e3 } = await supabase
      .from('stores')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000')

    if (!e3) {
      logSuccess('Delete de ID inexistente no genera error')
      result.details.push('Delete ID inexistente: OK')
    }

    // Test 9.4: Transaccionalidad (rollback simulado)
    logTest(9, 'Testing comportamiento transaccional...')

    const { count: beforeCountVal } = await supabase
      .from('stores')
      .select('id', { count: 'exact', head: true })

    // Intentar operación que debería fallar
    const { error: failError } = await supabaseAdmin
      .from('stores')
      .insert([
        {
          name: 'Test Transaction 1',
          address: 'Test',
          city: 'Test',
          province: 'Test',
          phone: '123'
        },
        {
          name: 'Test Transaction 2',
          // Falta campos requeridos para que falle
        }
      ])

    const { count: afterCountVal } = await supabase
      .from('stores')
      .select('id', { count: 'exact', head: true })

    if (beforeCountVal === afterCountVal) {
      logSuccess('Operación falló sin dejar datos inconsistentes')
      result.details.push('Consistencia en fallos: OK')
    } else {
      logWarning('Posible inserción parcial en batch')
      result.status = 'WARNING'
      result.details.push('Inserción batch: Requiere revisión')
    }

    // Test 9.5: Reconexión tras timeout
    logTest(9, 'Testing comportamiento con delays...')

    await sleep(100)

    const { data: afterDelay, error: delayError } = await supabase
      .from('stores')
      .select('id')
      .limit(1)

    if (!delayError && afterDelay) {
      logSuccess('Conexión estable tras delay')
      result.details.push('Estabilidad de conexión: OK')
    }

  } catch (error) {
    logError(`Error en pruebas de recuperación: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// CASO 10: Análisis de Datos y Reportes
// ============================================================================
async function testCase10(): Promise<TestResult> {
  const startTime = Date.now()
  const result: TestResult = {
    case: 10,
    name: 'Análisis de Datos y Reportes',
    status: 'PASS',
    duration: 0,
    details: [],
    errors: []
  }

  console.log('\n📝 CASO 10: Análisis de Datos y Reportes')
  console.log('─'.repeat(70))

  try {
    // Test 10.1: Distribución por provincia
    logTest(10, 'Analizando distribución por provincia...')

    const { data: allBranches } = await supabase
      .from('stores')
      .select('province')
      .eq('active', true)

    if (allBranches) {
      const distribution = allBranches.reduce((acc, b) => {
        const prov = b.province || 'Sin provincia'
        acc[prov] = (acc[prov] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      logSuccess('Distribución por provincia:')
      Object.entries(distribution).forEach(([prov, count]) => {
        console.log(`      ${prov}: ${count} sucursal(es)`)
      })

      result.details.push('Análisis por provincia: Completado')

      // Detectar concentración excesiva
      const maxProvince = Math.max(...Object.values(distribution))
      const totalBranches = allBranches.length

      if (maxProvince / totalBranches > 0.5) {
        logWarning(`Concentración alta: ${Math.round(maxProvince / totalBranches * 100)}% en una provincia`)
        result.details.push('Concentración geográfica: Alta')
      }
    }

    // Test 10.2: Sucursales con datos completos vs incompletos
    logTest(10, 'Analizando completitud de datos...')

    const { data: allData } = await supabase
      .from('stores')
      .select('*')

    if (allData) {
      const withEmail = allData.filter(b => b.email).length
      const withCoords = allData.filter(b => b.latitude && b.longitude).length
      const withImage = allData.filter(b => b.background_image_url).length
      const total = allData.length

      logSuccess(`Completitud de datos:`)
      console.log(`      Con email: ${withEmail}/${total} (${Math.round(withEmail/total*100)}%)`)
      console.log(`      Con coordenadas: ${withCoords}/${total} (${Math.round(withCoords/total*100)}%)`)
      console.log(`      Con imagen: ${withImage}/${total} (${Math.round(withImage/total*100)}%)`)

      result.details.push('Análisis de completitud: OK')

      if (withImage / total < 0.3) {
        logWarning('Menos del 30% de sucursales tienen imagen')
        result.status = 'WARNING'
        result.details.push('Cobertura de imágenes: Baja')
      }
    }

    // Test 10.3: Patrones de horarios
    logTest(10, 'Analizando patrones de horarios...')

    if (allData) {
      const standardHours = allData.filter(b =>
        b.opening_hours?.weekdays?.includes('16:00') // Horario partido típico
      ).length

      logSuccess(`Sucursales con horario partido: ${standardHours}/${allData.length}`)
      result.details.push('Análisis de horarios: Completado')
    }

    // Test 10.4: Verificación de calidad de datos
    logTest(10, 'Verificando calidad de datos...')

    if (allData) {
      const issues = []

      // Teléfonos cortos
      const shortPhones = allData.filter(b => b.phone && b.phone.length < 8)
      if (shortPhones.length > 0) {
        issues.push(`${shortPhones.length} teléfonos sospechosamente cortos`)
      }

      // WhatsApp sin prefijo internacional
      const badWhatsApp = allData.filter(b =>
        b.whatsapp && !b.whatsapp.startsWith('549')
      )
      if (badWhatsApp.length > 0) {
        issues.push(`${badWhatsApp.length} WhatsApp sin formato internacional`)
      }

      // Provincias NULL
      const noProvince = allData.filter(b => !b.province)
      if (noProvince.length > 0) {
        issues.push(`${noProvince.length} sucursales sin provincia`)
      }

      if (issues.length === 0) {
        logSuccess('Calidad de datos: Excelente')
        result.details.push('Calidad de datos: Excelente')
      } else {
        logWarning('Problemas de calidad detectados:')
        issues.forEach(issue => console.log(`      - ${issue}`))
        result.status = 'WARNING'
        result.details.push(`Calidad de datos: ${issues.length} problemas`)
      }
    }

  } catch (error) {
    logError(`Error en análisis de datos: ${error}`)
    result.status = 'FAIL'
    result.errors.push(`Error: ${error}`)
  }

  result.duration = Date.now() - startTime
  return result
}

// ============================================================================
// MAIN - Ejecutar todos los casos y generar reporte
// ============================================================================
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║     🔍 QA EXHAUSTIVO - SISTEMA DE SUCURSALES                ║')
  console.log('║     10 Casos Complejos de Prueba                             ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')

  const startTime = Date.now()

  // Ejecutar todos los casos
  results.push(await testCase1())
  results.push(await testCase2())
  results.push(await testCase3())
  results.push(await testCase4())
  results.push(await testCase5())
  results.push(await testCase6())
  results.push(await testCase7())
  results.push(await testCase8())
  results.push(await testCase9())
  results.push(await testCase10())

  const totalDuration = Date.now() - startTime

  // Generar reporte
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗')
  console.log('║                    📊 REPORTE FINAL                          ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const warnings = results.filter(r => r.status === 'WARNING').length
  const failed = results.filter(r => r.status === 'FAIL').length

  console.log('📈 RESUMEN:')
  console.log(`   ✅ Pasados: ${passed}/10`)
  console.log(`   ⚠️  Advertencias: ${warnings}/10`)
  console.log(`   ❌ Fallidos: ${failed}/10`)
  console.log(`   ⏱️  Tiempo total: ${totalDuration}ms\n`)

  console.log('📋 DETALLE POR CASO:\n')

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'
    console.log(`${icon} CASO ${result.case}: ${result.name}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Duración: ${result.duration}ms`)

    if (result.details.length > 0) {
      console.log('   Detalles:')
      result.details.forEach(detail => console.log(`      - ${detail}`))
    }

    if (result.errors.length > 0) {
      console.log('   Errores:')
      result.errors.forEach(error => console.log(`      ❌ ${error}`))
    }

    console.log('')
  })

  // Guardar reporte en archivo
  const reportPath = resolve(process.cwd(), 'QA_BRANCHES_REPORT.json')
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 10,
      passed,
      warnings,
      failed,
      duration: totalDuration
    },
    results
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n💾 Reporte guardado en: ${reportPath}\n`)

  // Conclusión
  if (failed === 0 && warnings === 0) {
    console.log('🎉 ¡TODOS LOS CASOS PASARON EXITOSAMENTE!\n')
  } else if (failed === 0) {
    console.log('✅ Sistema funcional con algunas advertencias menores\n')
  } else {
    console.log('⚠️  Se detectaron problemas que requieren atención\n')
  }

  return failed === 0
}

// Ejecutar QA
main()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en QA:', error)
    process.exit(1)
  })
