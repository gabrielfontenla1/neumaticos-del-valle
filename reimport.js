const fs = require('fs')

async function reimport() {
  const aiModel = process.argv[2] || 'gpt-4o-mini' // Allow passing model as argument
  console.log(`\n🤖 Modelo AI: ${aiModel}`)
  console.log('Reimportando archivo Excel con DELETE/RECREATE pattern...\n')

  const filePath = '/Users/gabrielfontenla/Downloads/stock.xlsx'
  const fileBuffer = fs.readFileSync(filePath)

  const formData = new FormData()
  const blob = new Blob([fileBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  formData.append('file', blob, 'stock.xlsx')
  formData.append('aiModel', aiModel) // Add AI model selection
  formData.append('stream', 'true') // Enable SSE streaming

  console.log('📤 Enviando archivo con streaming en tiempo real...')
  const startTime = Date.now()

  const response = await fetch('http://localhost:6001/api/admin/stock/import', {
    method: 'POST',
    body: formData,
    // Increase timeout to 10 minutes for large imports
    signal: AbortSignal.timeout(600000)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Error:', response.status, errorText)
    process.exit(1)
  }

  // Process SSE stream
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let buffer = ''
  let stats = { regexUsed: 0, aiUsed: 0, created: 0, estimatedCost: 0 }
  let totalRows = 0
  let processed = 0
  let errors = []
  let warnings = []

  console.log('\n🔄 Procesando en tiempo real:\n')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    // Decode and add to buffer
    buffer += decoder.decode(value, { stream: true })

    // Process complete SSE messages
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue

      // Parse SSE format: event: type\ndata: json
      const eventMatch = line.match(/event: (\w+)\ndata: (.+)/)
      if (!eventMatch) continue

      const [, eventType, dataStr] = eventMatch
      const data = JSON.parse(dataStr)

      switch (eventType) {
        case 'start':
          totalRows = data.totalRows
          console.log(`🚀 Iniciando importación de ${data.totalRows} productos con modelo ${data.aiModel}\n`)
          break

        case 'progress':
          processed++

          // Show different messages based on content
          if (data.message.includes('Limpiando')) {
            console.log(`🗑️  ${data.message}`)
          } else if (data.message.includes('Analizando con IA')) {
            console.log(`🤖 ${data.message}`)
            stats.aiUsed++
          } else if (data.sku) {
            const method = data.method === 'ai' ? '🤖 AI' : '⚡ RegEx'
            const confidence = data.confidence ? `(${data.confidence}%)` : ''
            const progress = `[${data.progress}%]`

            if (data.method === 'regex') {
              stats.regexUsed++
            }
            stats.created++

            // Show compact output: progress, method, SKU
            console.log(`${progress} ${method} ${confidence}: ${data.sku}`)
          }
          break

        case 'error':
          console.log(`❌ Error Fila ${data.row} - ${data.sku}: ${data.error}`)
          errors.push({ row: data.row, sku: data.sku, error: data.error })
          break

        case 'warning':
          console.log(`⚠️  Warning Fila ${data.row} - ${data.sku}: ${data.warning}`)
          warnings.push({ row: data.row, sku: data.sku, warning: data.warning })
          break

        case 'complete':
          const duration = Date.now() - startTime

          console.log('\n📊 Resultados Finales:')
          console.log('  ⏱️  Tiempo:', (duration / 1000).toFixed(2), 'segundos')
          console.log('  📋 Total filas:', totalRows)
          console.log('  ✅ Procesadas:', data.processed)
          console.log('  ➕ Creadas:', data.created)
          console.log('  ❌ Errores:', errors.length)
          console.log('  ⚠️  Advertencias:', warnings.length)

          if (data.stats) {
            console.log('\n🤖 Estadísticas de IA:')
            console.log('  ⚡ RegEx usado:', data.stats.regex_used)
            console.log('  🧠 AI usado:', data.stats.ai_used)
            console.log('  💰 Costo estimado: $' + data.stats.estimated_cost.toFixed(4))
            const aiPercentage = ((data.stats.ai_used / data.processed) * 100).toFixed(1)
            console.log('  📈 Porcentaje AI:', aiPercentage + '%')
          }

          if (errors.length > 0) {
            console.log('\n❌ Primeros errores:')
            errors.slice(0, 5).forEach(e => {
              console.log('  Fila', e.row, '-', e.sku, ':', e.error)
            })
          }

          if (warnings.length > 0) {
            console.log('\n⚠️  Primeras advertencias:')
            warnings.slice(0, 3).forEach(w => {
              console.log('  Fila', w.row, '-', w.sku, ':', w.warning)
            })
          }

          console.log('\n✅ Importación completada!')
          break
      }
    }
  }
}

reimport()
