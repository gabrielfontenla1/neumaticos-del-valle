// AI Clients Configuration
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

/**
 * OpenAI Client - GPT-4o-mini
 * Cost: $0.15/1M input tokens, $0.60/1M output tokens
 * Best for: Fast, cost-effective parsing with JSON mode
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

/**
 * Anthropic Client - Claude 3.5 Sonnet
 * Cost: $3/1M input tokens, $15/1M output tokens
 * Best for: Maximum precision, complex reasoning
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Verify API keys are configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not configured - GPT-4o-mini will not work')
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not configured - Claude Sonnet will not work')
}
