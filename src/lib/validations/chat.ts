/**
 * AI Chat validation schemas
 * For /api/ai/chat route
 */
import { z } from 'zod'

// Chat message role
export const messageRoleSchema = z.enum(['user', 'assistant', 'system'])

// Chat message schema
export const chatMessageSchema = z.object({
  role: messageRoleSchema,
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(4000, 'Mensaje muy largo'),
})

// Chat request schema
export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, 'Se requiere al menos un mensaje')
    .max(50, 'Demasiados mensajes en el historial'),
  stream: z.boolean().optional().default(true),
})

// Chat response schema (non-streaming)
export const chatResponseSchema = z.object({
  content: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
  model: z.string().optional(),
})

// Type exports
export type MessageRole = z.infer<typeof messageRoleSchema>
export type ChatMessage = z.infer<typeof chatMessageSchema>
export type ChatRequest = z.infer<typeof chatRequestSchema>
export type ChatResponse = z.infer<typeof chatResponseSchema>
