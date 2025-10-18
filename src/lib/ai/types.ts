// AI Model Types and Configuration

export type AIModel = 'gpt-4o-mini' | 'claude-sonnet-3.5'

export interface AIModelConfig {
  id: AIModel
  name: string
  provider: 'openai' | 'anthropic'
  description: string
  costPer1MTokens: {
    input: number
    output: number
  }
  averageCostPer741Products: number
  expectedConfidence: string
  speed: string
  icon: string
}

export const AI_MODELS: Record<AIModel, AIModelConfig> = {
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Rápido y económico. Ideal para uso diario.',
    costPer1MTokens: {
      input: 0.15,
      output: 0.60,
    },
    averageCostPer741Products: 0.22,
    expectedConfidence: '92-95%',
    speed: 'Rápido (60-75 seg)',
    icon: '⚡',
  },
  'claude-sonnet-3.5': {
    id: 'claude-sonnet-3.5',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Máxima precisión. Para casos difíciles.',
    costPer1MTokens: {
      input: 3.00,
      output: 15.00,
    },
    averageCostPer741Products: 4.40,
    expectedConfidence: '97-99%',
    speed: 'Más lento (120-180 seg)',
    icon: '🎯',
  },
}

export interface TireParserResult {
  width: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  construction: string | null
  load_index: number | null
  speed_rating: string | null
  extra_load: boolean
  run_flat: boolean
  seal_inside: boolean
  tube_type: boolean
  homologation: string | null
  original_description: string
  display_name: string
  parse_confidence: number
  parse_warnings: string[]
  parse_method: 'regex' | 'ai'
  ai_model?: AIModel
  ai_reasoning?: string
}
