// Test del tire parser con ejemplos del Excel
const { parseTireDescription } = require('./src/lib/tire-parser.ts')

// Ejemplos reales del Excel
const testCases = [
  '205/75R15  99T XL  SCORPION ATR wl (NB)x',
  '185/65R15  88H  TURANZA T005 wl (NB)x',
  '225/45R17  94Y XL  P ZERO (NB)x (*)',
  '195/65R15  91H  ECOCONTACT 6',
  '265/70R16  112T  LTX FORCE wl',
  '175R13C  97/95N TT  (NB)x',
]

console.log('🧪 Prueba del Parser de Neumáticos\n')
console.log('='.repeat(80))

testCases.forEach((desc, idx) => {
  console.log(`\n${idx + 1}. Descripción Original:`)
  console.log(`   "${desc}"`)

  const result = parseTireDescription(desc)

  console.log(`\n   ✅ Datos Extraídos:`)
  console.log(`   - Medida: ${result.width}/${result.aspect_ratio}R${result.rim_diameter}`)
  console.log(`   - Construcción: ${result.construction || 'N/A'}`)
  console.log(`   - Índice Carga: ${result.load_index || 'N/A'}`)
  console.log(`   - Velocidad: ${result.speed_rating || 'N/A'}`)
  console.log(`   - Extra Load: ${result.extra_load ? 'Sí' : 'No'}`)
  console.log(`   - Run Flat: ${result.run_flat ? 'Sí' : 'No'}`)
  console.log(`   - Homologación: ${result.homologation || 'N/A'}`)

  console.log(`\n   📊 Calidad:`)
  console.log(`   - Confianza: ${result.parse_confidence}%`)
  console.log(`   - Advertencias: ${result.parse_warnings.length > 0 ? result.parse_warnings.join(', ') : 'Ninguna'}`)

  console.log(`\n   🎨 Display:`)
  console.log(`   - Original: "${result.original_description}"`)
  console.log(`   - Limpio:   "${result.display_name}"`)
  console.log(`   - Códigos removidos: ${desc !== result.display_name ? '✅' : '❌'}`)

  console.log('\n' + '-'.repeat(80))
})

console.log('\n✨ Prueba completada\n')
