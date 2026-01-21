/**
 * TypeScript types for AI configuration system
 * All configurations stored in app_settings table with JSONB structure
 */

// ============================================================================
// AI Models Configuration
// ============================================================================

export interface AIModelConfig {
  chatModel: string;
  fastModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export const DEFAULT_AI_MODELS_CONFIG: AIModelConfig = {
  chatModel: 'gpt-4o-mini',
  fastModel: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// ============================================================================
// WhatsApp Bot Configuration
// ============================================================================

export interface WhatsAppBotConfig {
  isActive: boolean;
  maintenanceMode: boolean;
  welcomeMessage: string;
  errorMessage: string;
  maintenanceMessage: string;
  respectBusinessHours: boolean;
  businessHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  maxMessagesPerConversation: number;
  aiResponseTimeout: number; // seconds
  enableQueueAlerts: boolean;
  enableErrorAlerts: boolean;
}

export const DEFAULT_WHATSAPP_BOT_CONFIG: WhatsAppBotConfig = {
  isActive: true,
  maintenanceMode: false,
  welcomeMessage: '¡Hola! Soy el asistente virtual de Neumáticos del Valle. ¿En qué puedo ayudarte?',
  errorMessage: 'Disculpa, hubo un error. Por favor, intenta nuevamente o contacta con un operador.',
  maintenanceMessage: 'El bot está en mantenimiento. Por favor, intenta más tarde.',
  respectBusinessHours: true,
  businessHours: {
    monday: { start: '08:00', end: '18:00', enabled: true },
    tuesday: { start: '08:00', end: '18:00', enabled: true },
    wednesday: { start: '08:00', end: '18:00', enabled: true },
    thursday: { start: '08:00', end: '18:00', enabled: true },
    friday: { start: '08:00', end: '18:00', enabled: true },
    saturday: { start: '08:00', end: '13:00', enabled: true },
    sunday: { start: '00:00', end: '00:00', enabled: false },
  },
  maxMessagesPerConversation: 50,
  aiResponseTimeout: 30,
  enableQueueAlerts: true,
  enableErrorAlerts: true,
};

// ============================================================================
// Function Calling Tools
// ============================================================================

export interface FunctionTool {
  name: string;
  description: string;
  enabled: boolean;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface WhatsAppFunctionToolsConfig {
  tools: FunctionTool[];
}

export const DEFAULT_WHATSAPP_FUNCTION_TOOLS: WhatsAppFunctionToolsConfig = {
  tools: [
    {
      name: 'book_appointment',
      description: 'Reservar un turno para el cliente',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Fecha del turno (YYYY-MM-DD)' },
          time: { type: 'string', description: 'Hora del turno (HH:MM)' },
          branch: { type: 'string', description: 'Sucursal' },
          service: { type: 'string', description: 'Tipo de servicio' },
        },
        required: ['date', 'time', 'branch', 'service'],
      },
    },
    {
      name: 'confirm_appointment',
      description: 'Confirmar un turno existente',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {
          appointmentId: { type: 'string', description: 'ID del turno' },
          confirmed: { type: 'boolean', description: 'Confirmación' },
        },
        required: ['appointmentId', 'confirmed'],
      },
    },
    {
      name: 'check_stock',
      description: 'Consultar disponibilidad de stock',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {
          product: { type: 'string', description: 'Producto a consultar' },
          branch: { type: 'string', description: 'Sucursal' },
        },
        required: ['product'],
      },
    },
    {
      name: 'cancel_operation',
      description: 'Cancelar la operación actual',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Motivo de cancelación' },
        },
        required: [],
      },
    },
    {
      name: 'go_back',
      description: 'Retroceder al paso anterior',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'show_help',
      description: 'Mostrar ayuda al usuario',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Tema de ayuda' },
        },
        required: [],
      },
    },
    {
      name: 'request_human',
      description: 'Solicitar asistencia de un operador humano',
      enabled: true,
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Motivo de la solicitud' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioridad' },
        },
        required: ['reason'],
      },
    },
  ],
};

// ============================================================================
// AI Prompts Configuration
// ============================================================================

export interface AIPromptsConfig {
  whatsappSystemPrompt: string;
  productPrompt: string;
  salesPrompt: string;
  technicalPrompt: string;
  faqPrompt: string;
}

export const DEFAULT_AI_PROMPTS_CONFIG: AIPromptsConfig = {
  whatsappSystemPrompt: `Sos un asistente virtual de Neumáticos del Valle, una empresa familiar con más de 30 años de experiencia en la venta de neumáticos y servicios de gomería en Mendoza, Argentina.

INFORMACIÓN DE LA EMPRESA:
- Sucursales: San Martín y Godoy Cruz
- Horarios: Lunes a Viernes 8:00-18:00, Sábados 8:00-13:00
- Servicios: Venta de neumáticos, alineación, balanceo, reparación de cubiertas
- Contacto oficial: +54 261 123-4567

PERSONALIDAD Y TONO:
- Cordial, profesional pero cercano
- Lenguaje claro y directo, evitando tecnicismos innecesarios
- Proactivo en ofrecer soluciones
- Paciente y empático con las consultas

CAPACIDADES:
1. Reservar turnos para servicios
2. Consultar stock de neumáticos
3. Responder preguntas frecuentes
4. Brindar información sobre servicios y precios
5. Derivar a operador humano cuando sea necesario

INSTRUCCIONES:
- Siempre confirma los datos antes de reservar un turno
- Si no estás seguro de algo, admítelo y ofrece derivar a un operador
- Mantén las respuestas concisas (max 2-3 oraciones)
- Usa emojis ocasionalmente para humanizar la conversación
- Recuerda el contexto de la conversación

VARIABLES DISPONIBLES:
{customer_name} - Nombre del cliente
{branch_name} - Nombre de la sucursal
{service_type} - Tipo de servicio solicitado`,

  productPrompt: `Experto en neumáticos con conocimiento técnico de marcas, medidas y aplicaciones.`,

  salesPrompt: `Enfocado en ventas consultivas, identificando necesidades y recomendando soluciones.`,

  technicalPrompt: `Especialista técnico en servicios de gomería, alineación y balanceo.`,

  faqPrompt: `Respondedor de preguntas frecuentes con información precisa y actualizada.`,
};

// ============================================================================
// Services Configuration
// ============================================================================

export interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  enabled: boolean;
}

export interface ServicesConfig {
  services: ServiceConfig[];
  provinces: string[];
}

export const DEFAULT_SERVICES_CONFIG: ServicesConfig = {
  services: [
    {
      id: 'alignment',
      name: 'Alineación',
      description: 'Alineación de tren delantero',
      duration: 45,
      price: 5000,
      enabled: true,
    },
    {
      id: 'balancing',
      name: 'Balanceo',
      description: 'Balanceo de 4 ruedas',
      duration: 30,
      price: 3000,
      enabled: true,
    },
    {
      id: 'tire-change',
      name: 'Cambio de Neumáticos',
      description: 'Cambio de neumáticos (incluye montaje y balanceo)',
      duration: 60,
      price: 8000,
      enabled: true,
    },
    {
      id: 'tire-repair',
      name: 'Reparación de Cubierta',
      description: 'Reparación de pinchaduras',
      duration: 30,
      price: 2000,
      enabled: true,
    },
  ],
  provinces: [
    'Buenos Aires',
    'Catamarca',
    'Chaco',
    'Chubut',
    'Córdoba',
    'Corrientes',
    'Entre Ríos',
    'Formosa',
    'Jujuy',
    'La Pampa',
    'La Rioja',
    'Mendoza',
    'Misiones',
    'Neuquén',
    'Río Negro',
    'Salta',
    'San Juan',
    'San Luis',
    'Santa Cruz',
    'Santa Fe',
    'Santiago del Estero',
    'Tierra del Fuego',
    'Tucumán',
  ],
};

// ============================================================================
// Cache Entry Types
// ============================================================================

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  ttl: number;
}

// ============================================================================
// Configuration Keys (for app_settings table)
// ============================================================================

export enum ConfigKey {
  AI_MODELS = 'ai_models_config',
  WHATSAPP_BOT = 'whatsapp_bot_config',
  WHATSAPP_PROMPT = 'whatsapp_system_prompt',
  WHATSAPP_TOOLS = 'whatsapp_function_tools',
  AI_PROMPTS = 'ai_prompts_config',
  SERVICES = 'services_config',
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface ConfigAuditLog {
  id: string;
  config_key: string;
  old_value: unknown;
  new_value: unknown;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
}

export interface ConfigBackup {
  id: string;
  config_key: string;
  value: unknown;
  created_at: string;
  created_by: string;
}
