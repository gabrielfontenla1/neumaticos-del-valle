// AI-Powered Tire Description Parser
import { openai, anthropic } from './clients'
import type { AIModel, TireParserResult } from './types'

const TIRE_PARSING_SYSTEM_PROMPT = `Eres un experto técnico en nomenclatura de neumáticos con 20 años de experiencia.

CONTEXTO REGIONAL:
- País: Argentina
- Mercado: Neumáticos para vehículos livianos y SUVs
- Marcas comunes: Fate, Firestone, Pirelli, Michelin, Bridgestone, Goodyear

PATRONES VÁLIDOS:
1. Métrico: 185/65 R15 88H
2. Pulgadas: 31x10.5 R15
3. Numérico: 7.50-16

REGLAS ESTRICTAS:
1. ANCHO: número (145-355 para métrico, o pulgadas)
2. PERFIL: porcentaje (30-100) o puede faltar en neumáticos antiguos
3. CONSTRUCCIÓN: R (radial), D (diagonal), B (bias belt), o - (antiguo)
4. DIÁMETRO: 10-24 pulgadas (más común: 13-22)
5. ÍNDICE CARGA: 0-279 (tabla estándar)
6. VELOCIDAD: letras A-Z excepto I,O,X (tabla estándar)

CÓDIGOS ESPECIALES:
- XL/EXTRA LOAD: refuerzo extra
- RFT/RUN FLAT: neumático antipinchazos
- MOE: Mercedes Original Extended
- SSR: Self Supporting Runflat
- TL/TUBELESS: sin cámara
- TT/TUBE TYPE: con cámara
- Homologaciones: MO, N0, N1, AO, K1, J

IMPORTANTE:
- Si NO estás seguro, pon confidence < 80
- Si encuentras datos inconsistentes, explícalo en "reasoning"
- Si falta información, pon null (no inventes)
- El display_name debe ser limpio y legible para clientes`

/**
 * Parse tire description using OpenAI GPT-4o-mini
 */
async function parseWithGPT4Mini(
  description: string
): Promise<TireParserResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: TIRE_PARSING_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `DESCRIPCIÓN A ANALIZAR:
"${description}"

Analiza CUIDADOSAMENTE y responde con un JSON con esta estructura:
{
  "width": number | null,
  "aspect_ratio": number | null,
  "construction": "R" | "D" | "B" | "-" | null,
  "rim_diameter": number | null,
  "load_index": number | null,
  "speed_rating": string | null,
  "extra_load": boolean,
  "run_flat": boolean,
  "seal_inside": boolean,
  "tube_type": "TL" | "TT" | null,
  "homologation": string | null,
  "display_name": string,
  "confidence": number (0-100),
  "reasoning": "breve explicación"
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 500,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from GPT-4o-mini')
    }

    const parsed = JSON.parse(content)

    return {
      width: parsed.width ? Math.round(parsed.width) : null, // Convert to integer
      aspect_ratio: parsed.aspect_ratio,
      rim_diameter: parsed.rim_diameter,
      construction: parsed.construction,
      load_index: parsed.load_index,
      speed_rating: parsed.speed_rating,
      extra_load: parsed.extra_load || false,
      run_flat: parsed.run_flat || false,
      seal_inside: parsed.seal_inside || false,
      tube_type: parsed.tube_type === 'TT', // Convert "TT" to true, "TL"/null to false
      homologation: parsed.homologation,
      original_description: description,
      display_name: parsed.display_name || description,
      parse_confidence: parsed.confidence || 85,
      parse_warnings: parsed.confidence < 80 ? [parsed.reasoning] : [],
      parse_method: 'ai',
      ai_model: 'gpt-4o-mini',
      ai_reasoning: parsed.reasoning,
    }
  } catch (error) {
    console.error('❌ GPT-4o-mini parsing error:', error)
    throw error
  }
}

/**
 * Parse tire description using Claude 3.5 Sonnet
 */
async function parseWithClaudeSonnet(
  description: string
): Promise<TireParserResult> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `${TIRE_PARSING_SYSTEM_PROMPT}

DESCRIPCIÓN A ANALIZAR:
"${description}"

Analiza CUIDADOSAMENTE y responde SOLO con un JSON válido con esta estructura:
{
  "width": number | null,
  "aspect_ratio": number | null,
  "construction": "R" | "D" | "B" | "-" | null,
  "rim_diameter": number | null,
  "load_index": number | null,
  "speed_rating": string | null,
  "extra_load": boolean,
  "run_flat": boolean,
  "seal_inside": boolean,
  "tube_type": "TL" | "TT" | null,
  "homologation": string | null,
  "display_name": string,
  "confidence": number (0-100),
  "reasoning": "breve explicación"
}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response (Claude might wrap it in markdown)
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/```\n?$/, '')
    }

    const parsed = JSON.parse(jsonText)

    return {
      width: parsed.width ? Math.round(parsed.width) : null, // Convert to integer
      aspect_ratio: parsed.aspect_ratio,
      rim_diameter: parsed.rim_diameter,
      construction: parsed.construction,
      load_index: parsed.load_index,
      speed_rating: parsed.speed_rating,
      extra_load: parsed.extra_load || false,
      run_flat: parsed.run_flat || false,
      seal_inside: parsed.seal_inside || false,
      tube_type: parsed.tube_type === 'TT', // Convert "TT" to true, "TL"/null to false
      homologation: parsed.homologation,
      original_description: description,
      display_name: parsed.display_name || description,
      parse_confidence: parsed.confidence || 90,
      parse_warnings: parsed.confidence < 85 ? [parsed.reasoning] : [],
      parse_method: 'ai',
      ai_model: 'claude-sonnet-3.5',
      ai_reasoning: parsed.reasoning,
    }
  } catch (error) {
    console.error('❌ Claude Sonnet parsing error:', error)
    throw error
  }
}

/**
 * Parse tire description with AI (supports multiple models)
 */
export async function parseTireDescriptionWithAI(
  description: string,
  model: AIModel = 'gpt-4o-mini'
): Promise<TireParserResult> {
  const startTime = Date.now()

  try {
    let result: TireParserResult

    switch (model) {
      case 'gpt-4o-mini':
        result = await parseWithGPT4Mini(description)
        break
      case 'claude-sonnet-3.5':
        result = await parseWithClaudeSonnet(description)
        break
      default:
        throw new Error(`Unsupported AI model: ${model}`)
    }

    const duration = Date.now() - startTime
    console.log(
      `✅ AI parsing (${model}): "${description}" → confidence: ${result.parse_confidence}% (${duration}ms)`
    )

    return result
  } catch (error) {
    console.error(`❌ AI parsing failed (${model}):`, error)
    throw error
  }
}
