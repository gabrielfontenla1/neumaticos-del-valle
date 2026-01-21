/**
 * Zod validators for AI configuration
 * Ensures data integrity before saving to database
 */

import { z } from 'zod';

// ============================================================================
// AI Models Configuration Validator
// ============================================================================

export const aiModelConfigSchema = z.object({
  chatModel: z
    .string()
    .min(1, 'Chat model is required')
    .regex(/^gpt-/, 'Must be a valid GPT model'),
  fastModel: z
    .string()
    .min(1, 'Fast model is required')
    .regex(/^gpt-/, 'Must be a valid GPT model'),
  temperature: z
    .number()
    .min(0, 'Temperature must be >= 0')
    .max(2, 'Temperature must be <= 2'),
  maxTokens: z
    .number()
    .int()
    .min(100, 'Max tokens must be >= 100')
    .max(100000, 'Max tokens must be <= 100000'),
  topP: z.number().min(0).max(1),
  frequencyPenalty: z.number().min(-2).max(2),
  presencePenalty: z.number().min(-2).max(2),
});

export type AIModelConfigInput = z.infer<typeof aiModelConfigSchema>;

// ============================================================================
// WhatsApp Bot Configuration Validator
// ============================================================================

const businessHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  enabled: z.boolean(),
});

export const whatsappBotConfigSchema = z.object({
  isActive: z.boolean(),
  maintenanceMode: z.boolean(),
  welcomeMessage: z
    .string()
    .min(10, 'Welcome message must be at least 10 characters')
    .max(500, 'Welcome message must be at most 500 characters'),
  errorMessage: z
    .string()
    .min(10, 'Error message must be at least 10 characters')
    .max(500, 'Error message must be at most 500 characters'),
  maintenanceMessage: z
    .string()
    .min(10, 'Maintenance message must be at least 10 characters')
    .max(500, 'Maintenance message must be at most 500 characters'),
  respectBusinessHours: z.boolean(),
  businessHours: z.object({
    monday: businessHoursSchema,
    tuesday: businessHoursSchema,
    wednesday: businessHoursSchema,
    thursday: businessHoursSchema,
    friday: businessHoursSchema,
    saturday: businessHoursSchema,
    sunday: businessHoursSchema,
  }),
  maxMessagesPerConversation: z
    .number()
    .int()
    .min(1, 'Must allow at least 1 message')
    .max(200, 'Maximum 200 messages per conversation'),
  aiResponseTimeout: z
    .number()
    .int()
    .min(5, 'Timeout must be at least 5 seconds')
    .max(120, 'Timeout must be at most 120 seconds'),
  enableQueueAlerts: z.boolean(),
  enableErrorAlerts: z.boolean(),
});

export type WhatsAppBotConfigInput = z.infer<typeof whatsappBotConfigSchema>;

// ============================================================================
// Function Tools Configuration Validator
// ============================================================================

const functionParameterSchema = z.object({
  type: z.string(),
  properties: z.record(z.string(), z.unknown()),
  required: z.array(z.string()),
});

const functionToolSchema = z.object({
  name: z
    .string()
    .min(1, 'Function name is required')
    .regex(
      /^[a-z_][a-z0-9_]*$/,
      'Function name must be snake_case (lowercase letters, numbers, underscores)'
    ),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
  enabled: z.boolean(),
  parameters: functionParameterSchema,
});

export const whatsappFunctionToolsConfigSchema = z.object({
  tools: z
    .array(functionToolSchema)
    .min(1, 'At least one function tool is required')
    .max(20, 'Maximum 20 function tools allowed'),
});

export type WhatsAppFunctionToolsConfigInput = z.infer<
  typeof whatsappFunctionToolsConfigSchema
>;

// ============================================================================
// AI Prompts Configuration Validator
// ============================================================================

export const aiPromptsConfigSchema = z.object({
  whatsappSystemPrompt: z
    .string()
    .min(100, 'System prompt must be at least 100 characters')
    .max(50000, 'System prompt must be at most 50000 characters'),
  productPrompt: z
    .string()
    .min(10, 'Product prompt must be at least 10 characters')
    .max(5000, 'Product prompt must be at most 5000 characters'),
  salesPrompt: z
    .string()
    .min(10, 'Sales prompt must be at least 10 characters')
    .max(5000, 'Sales prompt must be at most 5000 characters'),
  technicalPrompt: z
    .string()
    .min(10, 'Technical prompt must be at least 10 characters')
    .max(5000, 'Technical prompt must be at most 5000 characters'),
  faqPrompt: z
    .string()
    .min(10, 'FAQ prompt must be at least 10 characters')
    .max(5000, 'FAQ prompt must be at most 5000 characters'),
});

export type AIPromptsConfigInput = z.infer<typeof aiPromptsConfigSchema>;

// ============================================================================
// Services Configuration Validator
// ============================================================================

const serviceConfigSchema = z.object({
  id: z.string().min(1, 'Service ID is required'),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Service description is required'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(0, 'Price must be non-negative'),
  enabled: z.boolean(),
});

export const servicesConfigSchema = z.object({
  services: z.array(serviceConfigSchema),
  provinces: z.array(z.string()).min(1, 'At least one province is required'),
});

export type ServicesConfigInput = z.infer<typeof servicesConfigSchema>;

// ============================================================================
// Security Validators (Prompt Injection Detection)
// ============================================================================

/**
 * Detect potential prompt injection patterns
 */
export function detectPromptInjection(text: string): {
  safe: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Patterns that might indicate prompt injection
  const dangerousPatterns = [
    { pattern: /ignore\s+(previous|all)\s+instructions?/i, message: 'Contains "ignore instructions" pattern' },
    { pattern: /forget\s+(everything|all|previous)/i, message: 'Contains "forget" instruction pattern' },
    { pattern: /system\s*:\s*you\s+are/i, message: 'Attempts to redefine system role' },
    { pattern: /\[SYSTEM\]/i, message: 'Contains system tag injection' },
    { pattern: /\[INST\]/i, message: 'Contains instruction tag injection' },
    { pattern: /<\|system\|>/i, message: 'Contains system token' },
    { pattern: /new\s+instructions?/i, message: 'Contains "new instructions" pattern' },
    { pattern: /override\s+(mode|settings?|instructions?)/i, message: 'Contains override attempt' },
  ];

  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(text)) {
      warnings.push(message);
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * Sanitize prompt by removing potentially dangerous patterns
 */
export function sanitizePrompt(text: string): string {
  // For now, just return the text as-is
  // We'll detect issues and warn the user, but let them decide
  return text.trim();
}

/**
 * Validate JSON schema for function parameters
 */
export function validateFunctionSchema(schema: unknown): {
  valid: boolean;
  error?: string;
} {
  try {
    // Basic validation - must be an object with type and properties
    if (typeof schema !== 'object' || schema === null) {
      return { valid: false, error: 'Schema must be an object' };
    }

    const schemaObj = schema as Record<string, unknown>;

    if (schemaObj.type !== 'object') {
      return { valid: false, error: 'Schema type must be "object"' };
    }

    if (
      typeof schemaObj.properties !== 'object' ||
      schemaObj.properties === null
    ) {
      return { valid: false, error: 'Schema must have properties object' };
    }

    if (
      !Array.isArray(schemaObj.required) &&
      schemaObj.required !== undefined
    ) {
      return { valid: false, error: 'Schema required must be an array' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
