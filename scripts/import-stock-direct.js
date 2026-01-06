const fs = require('fs');
const FormData = require('form-data');

async function importStock() {
  console.log('=== INICIANDO IMPORTACIÓN DE STOCK ===');
  console.log('');

  // Leer el archivo
  const filePath = '/Users/gabrielfontenla/Downloads/stock5.xlsx';
  const fileBuffer = fs.readFileSync(filePath);

  console.log('📁 Archivo leído:', filePath);
  console.log('📊 Tamaño:', (fileBuffer.length / 1024).toFixed(2), 'KB');
  console.log('');

  // Crear FormData
  const formData = new FormData();
  formData.append('file', fileBuffer, {
    filename: 'stock5.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  formData.append('aiModel', 'gpt-4o-mini');
  formData.append('stream', 'false'); // Sin streaming para capturar resultado completo

  console.log('📤 Enviando a API...');
  console.log('🤖 Modelo IA: gpt-4o-mini');
  console.log('');

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/admin/stock/import', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('⏱️  Tiempo de procesamiento:', elapsed, 'segundos');
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error HTTP:', response.status);
      console.error('Detalles:', errorText);
      return;
    }

    const result = await response.json();

    console.log('=== RESULTADO DE IMPORTACIÓN ===');
    console.log('');
    console.log('✅ Éxito:', result.success);
    console.log('📊 Total filas:', result.totalRows);
    console.log('📦 Procesados:', result.processed);
    console.log('➕ Creados:', result.created);
    console.log('❌ Errores:', result.errors?.length || 0);
    console.log('⚠️  Advertencias:', result.warnings?.length || 0);
    console.log('');
    console.log('=== ESTADÍSTICAS DE PARSING ===');
    console.log('⚡ RegEx usado:', result.stats?.regex_used || 0);
    console.log('🤖 IA usado:', result.stats?.ai_used || 0);
    console.log('💰 Costo estimado: $' + (result.stats?.estimated_cost || 0).toFixed(4));
    console.log('');

    if (result.errors?.length > 0) {
      console.log('=== PRIMEROS 10 ERRORES ===');
      result.errors.slice(0, 10).forEach((e, i) => {
        console.log((i+1) + '. Fila ' + e.row + ' [' + e.sku + ']: ' + e.error);
      });
      console.log('');
    }

    if (result.warnings?.length > 0) {
      console.log('=== PRIMERAS 10 ADVERTENCIAS ===');
      result.warnings.slice(0, 10).forEach((w, i) => {
        console.log((i+1) + '. Fila ' + w.row + ' [' + w.sku + ']: ' + w.warning);
      });
      console.log('');
    }

    if (result.samples?.length > 0) {
      console.log('=== MUESTRAS DE PRODUCTOS IMPORTADOS ===');
      result.samples.forEach((s, i) => {
        console.log('---');
        console.log((i+1) + '. SKU:', s.sku);
        console.log('   Original:', s.original);
        console.log('   Limpio:', s.cleaned);
        console.log('   Confianza:', s.confidence + '%');
        console.log('   Método:', s.method);
        console.log('   Datos:', JSON.stringify(s.parsed));
      });
    }

    // Guardar resultado completo para análisis
    fs.writeFileSync('/tmp/import-result.json', JSON.stringify(result, null, 2));
    console.log('');
    console.log('📄 Resultado completo guardado en /tmp/import-result.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

importStock();
