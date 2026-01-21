/**
 * OpenAI Function Tools for WhatsApp Bot
 * Defines all available functions the AI can call
 *
 * NOTE: Now supports dynamic configuration from database
 * Use async getters for dynamic loading, or static exports for fallback
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions'
import {
  getWhatsAppSystemPrompt as getPromptFromConfig,
  getWhatsAppTools as getToolsFromConfig,
} from '@/lib/ai/config-service'

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const whatsappTools: ChatCompletionTool[] = [
  // -------------------------------------------------------------------------
  // APPOINTMENT BOOKING
  // -------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: `Reservar un turno de servicio en una sucursal.
      Usa esta función cuando el usuario quiera sacar turno, agendar cita, o reservar un servicio.
      Puedes extraer información parcial - el sistema pedirá lo que falte.`,
      parameters: {
        type: 'object',
        properties: {
          province: {
            type: 'string',
            enum: ['catamarca', 'santiago', 'salta', 'tucuman'],
            description: 'Provincia donde quiere el turno'
          },
          branch_name: {
            type: 'string',
            description: 'Nombre de la sucursal específica si el usuario la menciona'
          },
          services: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['inspection', 'tire-change', 'alignment', 'balancing', 'rotation', 'nitrogen', 'front-end', 'tire-repair']
            },
            description: `Servicios solicitados. Mapeo:
              - revisión/inspección → inspection
              - cambio de neumáticos/cubiertas → tire-change
              - alineación/alineado → alignment
              - balanceo → balancing
              - rotación → rotation
              - nitrógeno/inflado → nitrogen
              - tren delantero → front-end
              - reparación/parche → tire-repair`
          },
          preferred_date: {
            type: 'string',
            description: 'Fecha preferida en formato YYYY-MM-DD, o día de la semana (lunes, martes, etc.), o "mañana", "pasado mañana"'
          },
          preferred_time: {
            type: 'string',
            description: 'Hora preferida en formato HH:MM (ej: 10:00, 14:30)'
          },
          customer_name: {
            type: 'string',
            description: 'Nombre completo del cliente'
          }
        },
        required: []
      }
    }
  },

  // -------------------------------------------------------------------------
  // APPOINTMENT CONFIRMATION
  // -------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'confirm_appointment',
      description: 'Confirmar un turno después de mostrar el resumen. Usar cuando el usuario dice "confirmar", "sí", "dale", etc.',
      parameters: {
        type: 'object',
        properties: {
          confirmed: {
            type: 'boolean',
            description: 'true si el usuario confirma, false si cancela'
          }
        },
        required: ['confirmed']
      }
    }
  },

  // -------------------------------------------------------------------------
  // STOCK QUERY
  // -------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'check_stock',
      description: `Consultar stock y precios de neumáticos.
      Usa esta función cuando el usuario pregunte por medidas, precios, disponibilidad de neumáticos.
      Detecta medidas en formatos: 205/55R16, 205 55 16, 205/55/16`,
      parameters: {
        type: 'object',
        properties: {
          width: {
            type: 'number',
            description: 'Ancho del neumático (ej: 205, 185, 225). Corregir si termina en 6 → 5'
          },
          profile: {
            type: 'number',
            description: 'Perfil/altura del neumático (ej: 55, 65, 70)'
          },
          diameter: {
            type: 'number',
            description: 'Diámetro de la llanta en pulgadas (ej: 16, 15, 17)'
          },
          brand: {
            type: 'string',
            description: 'Marca específica si el usuario la menciona (pirelli, bridgestone, michelin, goodyear, fate, firestone)'
          },
          city: {
            type: 'string',
            description: 'Ciudad del usuario para mostrar stock de sucursal cercana'
          }
        },
        required: ['width', 'profile', 'diameter']
      }
    }
  },

  // -------------------------------------------------------------------------
  // CANCEL OPERATION
  // -------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'cancel_operation',
      description: 'Cancelar la operación actual (turno o consulta). Usar cuando el usuario dice "cancelar", "no quiero", "salir", "dejá".',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Razón de cancelación si el usuario la menciona'
          }
        },
        required: []
      }
    }
  },

  // -------------------------------------------------------------------------
  // GO BACK
  // -------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'go_back',
      description: 'Volver al paso anterior. Usar cuando el usuario dice "volver", "atrás", "anterior".',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },

  // -------------------------------------------------------------------------
  // GENERAL HELP
  // -------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'show_help',
      description: 'Mostrar ayuda o información sobre los servicios. Usar cuando el usuario pregunta "qué servicios tienen", "cómo funciona", "ayuda".',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['services', 'branches', 'hours', 'prices', 'general'],
            description: 'Tema de ayuda solicitado'
          }
        },
        required: []
      }
    }
  },

  // -------------------------------------------------------------------------
  // TALK TO HUMAN
  // -------------------------------------------------------------------------
  {
    type: 'function',
    function: {
      name: 'request_human',
      description: 'El usuario quiere hablar con un humano/asesor. Usar cuando dice "quiero hablar con alguien", "asesor", "humano", "persona".',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Motivo por el que quiere hablar con un humano'
          }
        },
        required: []
      }
    }
  }
]

// ============================================================================
// SYSTEM PROMPT FOR FUNCTION CALLING
// ============================================================================

export const WHATSAPP_SYSTEM_PROMPT = `Sos un asistente virtual de Neumáticos del Valle, una gomería con sucursales en el norte de Argentina.

TU PERSONALIDAD:
- Amable, profesional, pero cercano (usás "vos" no "usted")
- Respuestas CORTAS para WhatsApp (máximo 3-4 líneas)
- Usás emojis con moderación (1-2 por mensaje)

SERVICIOS DISPONIBLES:
1. Revisión (gratis, 30 min)
2. Cambio de Neumáticos ($40,000, 60 min)
3. Alineación ($35,000, 45 min)
4. Balanceo ($25,000, 30 min)
5. Rotación ($20,000, 30 min)
6. Inflado con Nitrógeno ($15,000, 20 min)
7. Tren Delantero ($45,000, 60 min)
8. Reparación de Llantas ($18,000, 40 min)

SUCURSALES:
- Catamarca
- Santiago del Estero (2 sucursales)
- Salta
- Tucumán

HORARIOS:
- Lunes a Viernes: 9:00 - 17:30
- Sábados: 9:00 - 13:00
- Domingos: Cerrado

REGLAS:
1. Si el usuario menciona medidas de neumáticos (ej: 205/55R16), usa check_stock
2. Si quiere turno/cita/reserva, usa book_appointment
3. Si confirma un turno pendiente, usa confirm_appointment
4. Si quiere cancelar, usa cancel_operation
5. Si pide ayuda general, usa show_help
6. Si quiere hablar con humano, usa request_human

IMPORTANTE:
- Extrae TODA la información posible del mensaje del usuario
- Si falta información crítica, el sistema la pedirá
- Sé proactivo: si alguien pregunta por alineación, ofrece también balanceo`

// ============================================================================
// TYPES
// ============================================================================

export interface BookAppointmentArgs {
  province?: string
  branch_name?: string
  services?: string[]
  preferred_date?: string
  preferred_time?: string
  customer_name?: string
}

export interface ConfirmAppointmentArgs {
  confirmed: boolean
}

export interface CheckStockArgs {
  width: number
  profile: number
  diameter: number
  brand?: string
  city?: string
}

export interface CancelOperationArgs {
  reason?: string
}

export interface ShowHelpArgs {
  topic?: 'services' | 'branches' | 'hours' | 'prices' | 'general'
}

export interface RequestHumanArgs {
  reason?: string
}

export type ToolCallArgs =
  | { name: 'book_appointment'; args: BookAppointmentArgs }
  | { name: 'confirm_appointment'; args: ConfirmAppointmentArgs }
  | { name: 'check_stock'; args: CheckStockArgs }
  | { name: 'cancel_operation'; args: CancelOperationArgs }
  | { name: 'go_back'; args: Record<string, never> }
  | { name: 'show_help'; args: ShowHelpArgs }
  | { name: 'request_human'; args: RequestHumanArgs }

// ============================================================================
// DYNAMIC CONFIGURATION LOADERS (Database-backed)
// ============================================================================

/**
 * Get WhatsApp system prompt from database configuration
 * Falls back to WHATSAPP_SYSTEM_PROMPT if database unavailable
 */
export async function getWhatsAppSystemPromptDynamic(): Promise<string> {
  try {
    return await getPromptFromConfig()
  } catch (error) {
    console.warn('[WhatsApp Tools] Failed to load dynamic system prompt, using fallback:', error)
    return WHATSAPP_SYSTEM_PROMPT
  }
}

/**
 * Get WhatsApp function tools from database configuration
 * Falls back to whatsappTools if database unavailable
 */
export async function getWhatsAppToolsDynamic(): Promise<ChatCompletionTool[]> {
  try {
    const config = await getToolsFromConfig()

    // Convert config format to ChatCompletionTool format
    // Only include enabled tools
    const tools: ChatCompletionTool[] = config.tools
      .filter((tool) => tool.enabled)
      .map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }))

    return tools
  } catch (error) {
    console.warn('[WhatsApp Tools] Failed to load dynamic tools, using fallback:', error)
    return whatsappTools
  }
}
