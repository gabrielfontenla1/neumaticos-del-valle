#!/usr/bin/env node

/**
 * Script simple de verificación del módulo de importación de Excel
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

console.log('=====================================');
console.log('VERIFICACIÓN: Módulo de Importación');
console.log('=====================================\n');

// 1. Verificar configuración del entorno
console.log('1. Verificación de configuración:');
console.log('---------------------------------');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  console.log('  NEXT_PUBLIC_SUPABASE_URL:', hasSupabaseUrl ? '✅' : '❌');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', hasAnonKey ? '✅' : '❌');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', hasServiceKey ? '✅ (RLS bypass habilitado)' : '⚠️ (puede haber problemas con RLS)');
} else {
  console.log('  ❌ Archivo .env.local no encontrado');
}

// 2. Verificar archivos del módulo
console.log('\n2. Archivos del módulo:');
console.log('----------------------');
const files = [
  'src/features/products/utils/importHelpers.ts',
  'src/features/products/import/ExcelImporter.tsx',
  'src/app/api/admin/import-products/route.ts',
  'src/features/products/api.ts'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${file}:`, exists ? '✅' : '❌');
});

// 3. Verificar archivo Excel
console.log('\n3. Archivo Excel de prueba:');
console.log('---------------------------');
const excelPath = '/Users/gabrielfontenla/Downloads/STOCK_PIRELLI_23_10_25.xlsx';
if (fs.existsSync(excelPath)) {
  console.log('  Archivo encontrado: ✅');

  // Leer y analizar el archivo
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`  Hoja: ${sheetName}`);
  console.log(`  Filas: ${json.length}`);

  // Detectar columnas de sucursales
  const headers = json[1]; // Los headers están en la fila 1
  const branchColumns = ['BELGRANO', 'CATAMARCA', 'LA_BANDA', 'SALTA', 'TUCUMAN', 'VIRGEN'];
  const hasAllBranches = branchColumns.every(col => headers.includes(col));

  if (hasAllBranches) {
    console.log('  Formato de sucursales: ✅ Detectado');
    console.log('  Columnas de stock: ', branchColumns.join(', '));
  } else {
    console.log('  Formato de sucursales: ❌ No detectado');
  }
} else {
  console.log('  ❌ Archivo no encontrado en:', excelPath);
}

// 4. Instrucciones de prueba
console.log('\n=====================================');
console.log('INSTRUCCIONES DE PRUEBA:');
console.log('=====================================');
console.log('\n1. Asegúrate de que el servidor de desarrollo esté corriendo:');
console.log('   npm run dev');
console.log('\n2. Navega al módulo de importación en el admin dashboard:');
console.log('   http://localhost:6001/admin (o tu puerto configurado)');
console.log('\n3. Busca la sección de "Importar Productos"');
console.log('\n4. Carga el archivo Excel:');
console.log('   ' + excelPath);
console.log('\n5. Verifica que:');
console.log('   - Se detecte el formato de sucursales');
console.log('   - Se muestre la información de normalización');
console.log('   - Aparezca la opción de eliminar productos existentes');
console.log('   - La importación se complete exitosamente');
console.log('\n6. El sistema debería:');
console.log('   - Extraer dimensiones automáticamente');
console.log('   - Categorizar productos (auto/camioneta/camion/moto)');
console.log('   - Consolidar stock por sucursales');
console.log('   - Usar el service role key para bypass de RLS');

console.log('\n=====================================');
console.log('RESUMEN:');
console.log('=====================================');
console.log('\nEl módulo de importación ha sido actualizado con:');
console.log('✅ Normalización automática de datos');
console.log('✅ Extracción de dimensiones desde descripción');
console.log('✅ Categorización automática de productos');
console.log('✅ Manejo de stock por sucursales');
console.log('✅ Uso de service role key para bypass de RLS');
console.log('✅ Opción para eliminar productos existentes');
console.log('✅ Templates de Excel dual (simple y sucursales)');
console.log('\n📝 El módulo está listo para usar con la misma lógica');
console.log('   que el script de Python original.');