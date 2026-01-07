import type { WorkflowDefinition } from '../types'

export const twilioWebhookFlow: WorkflowDefinition = {
  id: 'twilio-webhook',
  name: 'Twilio WhatsApp Bot',
  description: 'Procesa mensajes de WhatsApp via Twilio con respuestas de IA',
  trigger: 'trigger-webhook',
  nodes: [
    {
      id: 'trigger-webhook',
      type: 'trigger',
      label: 'Webhook Twilio',
      description: 'Recibe mensaje WhatsApp',
      icon: 'webhook',
      position: { x: 50, y: 150 },
      details: {
        longDescription: 'Punto de entrada del flujo. Recibe una solicitud HTTP POST desde Twilio cuando un cliente envía un mensaje de WhatsApp. Twilio envía los datos como FormData (application/x-www-form-urlencoded).',
        inputs: [
          { name: 'request', type: 'NextRequest', description: 'Solicitud HTTP entrante de Twilio', example: 'POST /api/twilio/webhook' },
          { name: 'headers', type: 'Headers', description: 'Headers HTTP incluyendo X-Twilio-Signature', example: 'X-Twilio-Signature: abc123...' },
          { name: 'body', type: 'FormData', description: 'Datos del mensaje en formato form-urlencoded', example: 'From=whatsapp:+5492994123456&Body=Hola' }
        ],
        outputs: [
          { name: 'formData', type: 'FormData', description: 'Datos parseados del formulario' },
          { name: 'signature', type: 'string', description: 'Firma del header para validación' }
        ],
        technology: { name: 'Next.js API Route', endpoint: '/api/twilio/webhook', method: 'POST' },
        typicalDuration: '5-20ms',
        errorCases: [
          { code: 'INVALID_FORM', description: 'FormData malformado', handling: 'Responde TwiML vacío' },
          { code: 'MISSING_FIELDS', description: 'Campos requeridos faltantes', handling: 'Log error, TwiML vacío' }
        ]
      }
    },
    {
      id: 'verify-signature',
      type: 'action',
      label: 'Verificar Firma',
      description: 'Valida Twilio signature',
      icon: 'shield',
      position: { x: 270, y: 150 },
      details: {
        longDescription: 'Valida la autenticidad del webhook usando el algoritmo de firma de Twilio. Combina la URL del webhook con los parámetros del form ordenados alfabéticamente, luego calcula HMAC-SHA1 con el Auth Token y compara con X-Twilio-Signature.',
        inputs: [
          { name: 'signature', type: 'string', description: 'Header X-Twilio-Signature', example: 'k8VOSg4bKj89Kz==' },
          { name: 'url', type: 'string', description: 'URL completa del webhook' },
          { name: 'params', type: 'object', description: 'Parámetros del form ordenados' },
          { name: 'authToken', type: 'string', description: 'TWILIO_AUTH_TOKEN del env' }
        ],
        outputs: [
          { name: 'isValid', type: 'boolean', description: 'Si la firma es válida', example: 'true' },
          { name: 'verifiedData', type: 'object', description: 'Datos verificados para continuar' }
        ],
        technology: { name: 'Twilio SDK', method: 'validateRequest HMAC-SHA1' },
        typicalDuration: '1-5ms',
        errorCases: [
          { code: 'INVALID_SIGNATURE', description: 'Firma no coincide', handling: 'Responde 403, log de seguridad' },
          { code: 'MISSING_TOKEN', description: 'Auth Token no configurado', handling: 'Error 500, alerta a devops' }
        ]
      }
    },
    {
      id: 'parse-form',
      type: 'action',
      label: 'Parse FormData',
      description: 'Extraer From, Body',
      icon: 'extract',
      position: { x: 490, y: 150 },
      details: {
        longDescription: 'Parsea el FormData de Twilio para extraer los campos relevantes. Twilio envía campos como From (whatsapp:+numero), Body (texto del mensaje), MessageSid (ID único), NumMedia (cantidad de archivos adjuntos), entre otros.',
        inputs: [
          { name: 'formData', type: 'FormData', description: 'Datos verificados del webhook' }
        ],
        outputs: [
          { name: 'from', type: 'string', description: 'Número del remitente', example: '"whatsapp:+5492994123456"' },
          { name: 'phoneNumber', type: 'string', description: 'Número limpio sin prefijo', example: '"+5492994123456"' },
          { name: 'body', type: 'string', description: 'Texto del mensaje', example: '"Hola, busco cubiertas"' },
          { name: 'messageSid', type: 'string', description: 'ID único del mensaje Twilio', example: '"SM1234567890abcdef"' },
          { name: 'numMedia', type: 'number', description: 'Cantidad de archivos adjuntos', example: '0' },
          { name: 'profileName', type: 'string', description: 'Nombre del perfil WhatsApp', example: '"Juan Perez"' }
        ],
        technology: { name: 'TypeScript', method: 'FormData parsing' },
        typicalDuration: '1-3ms',
        errorCases: [
          { code: 'MISSING_BODY', description: 'Mensaje sin texto ni media', handling: 'Ignora silenciosamente' },
          { code: 'INVALID_PHONE', description: 'Número en formato inválido', handling: 'Intenta normalizar, log warning' }
        ]
      }
    },
    {
      id: 'db-conversation',
      type: 'database',
      label: 'DB: Conversación',
      description: 'Buscar por phone',
      icon: 'database',
      position: { x: 710, y: 150 },
      details: {
        longDescription: 'Busca la conversación existente en Supabase usando el número de teléfono normalizado. Si no existe, crea una nueva entrada. También carga el historial de mensajes recientes y datos del cliente para dar contexto completo a la IA.',
        inputs: [
          { name: 'phoneNumber', type: 'string', description: 'Número normalizado del cliente' },
          { name: 'profileName', type: 'string', description: 'Nombre del perfil para crear cliente' }
        ],
        outputs: [
          { name: 'conversation', type: 'Conversation', description: 'Objeto de conversación', example: '{ id: "uuid", channel: "twilio" }' },
          { name: 'messageHistory', type: 'Message[]', description: 'Últimos 10 mensajes de la conversación' },
          { name: 'customerProfile', type: 'Customer | null', description: 'Perfil del cliente si existe' },
          { name: 'isNewConversation', type: 'boolean', description: 'Si se creó una nueva conversación' }
        ],
        technology: { name: 'Supabase', endpoint: 'twilio_conversations', method: 'SELECT + INSERT' },
        typicalDuration: '50-150ms',
        errorCases: [
          { code: 'DB_CONNECTION', description: 'Error de conexión a Supabase', handling: 'Retry 2x, respuesta genérica' },
          { code: 'RACE_CONDITION', description: 'Creación duplicada', handling: 'Catch unique constraint, SELECT' }
        ]
      }
    },
    {
      id: 'ai-intent',
      type: 'ai',
      label: 'Detectar Intención',
      description: 'Clasificar mensaje',
      icon: 'brain',
      position: { x: 930, y: 150 },
      details: {
        longDescription: 'Analiza el mensaje del usuario con GPT-4 para clasificar su intención. Determina si busca productos, tiene una pregunta general, quiere agendar turno, o necesita hablar con un humano. Considera el historial de conversación para contexto.',
        inputs: [
          { name: 'message', type: 'string', description: 'Texto del mensaje del usuario' },
          { name: 'history', type: 'Message[]', description: 'Historial de conversación' },
          { name: 'customerProfile', type: 'Customer | null', description: 'Información del cliente' }
        ],
        outputs: [
          { name: 'intent', type: 'string', description: 'Intención detectada', example: '"product_search" | "faq" | "appointment" | "escalate"' },
          { name: 'confidence', type: 'number', description: 'Confianza (0-1)', example: '0.89' },
          { name: 'entities', type: 'object', description: 'Entidades extraídas', example: '{ size: "195/65R15" }' },
          { name: 'sentiment', type: 'string', description: 'Sentimiento del mensaje', example: '"neutral"' }
        ],
        technology: { name: 'OpenAI GPT-4', endpoint: '/v1/chat/completions', method: 'POST' },
        typicalDuration: '800ms - 2s',
        errorCases: [
          { code: 'RATE_LIMIT', description: 'Límite de API OpenAI', handling: 'Retry con backoff exponencial' },
          { code: 'TIMEOUT', description: 'Sin respuesta en 10s', handling: 'Usa intención por defecto "faq"' }
        ]
      }
    },
    {
      id: 'ai-generate',
      type: 'ai',
      label: 'Generar Respuesta',
      description: 'GPT-4 + contexto',
      icon: 'sparkles',
      position: { x: 1150, y: 150 },
      details: {
        longDescription: 'Genera la respuesta del bot usando GPT-4. Integra búsqueda de productos (si aplica), FAQs relevantes, información del cliente y el historial de conversación. Produce respuestas naturales en español argentino adaptadas al contexto.',
        inputs: [
          { name: 'userMessage', type: 'string', description: 'Mensaje original del usuario' },
          { name: 'intent', type: 'string', description: 'Intención clasificada' },
          { name: 'entities', type: 'object', description: 'Entidades extraídas' },
          { name: 'history', type: 'Message[]', description: 'Historial de conversación' },
          { name: 'customerProfile', type: 'Customer | null', description: 'Datos del cliente' }
        ],
        outputs: [
          { name: 'responseText', type: 'string', description: 'Respuesta generada', example: '"Hola! Para cubiertas 195/65R15 tenemos..."' },
          { name: 'tokensUsed', type: 'number', description: 'Tokens consumidos', example: '380' },
          { name: 'suggestedProducts', type: 'Product[]', description: 'Productos sugeridos (si aplica)' }
        ],
        technology: { name: 'OpenAI GPT-4', endpoint: '/v1/chat/completions', method: 'POST' },
        typicalDuration: '1-3s',
        errorCases: [
          { code: 'CONTENT_FILTER', description: 'Contenido filtrado', handling: 'Respuesta segura alternativa' },
          { code: 'TOKEN_LIMIT', description: 'Contexto muy largo', handling: 'Truncar historial' }
        ]
      }
    },
    {
      id: 'db-save',
      type: 'database',
      label: 'Guardar Mensajes',
      description: 'User + Assistant',
      icon: 'save',
      position: { x: 1370, y: 150 },
      details: {
        longDescription: 'Guarda ambos mensajes en la base de datos: el mensaje del usuario y la respuesta del bot. Usa una transacción para asegurar consistencia. Incluye metadata como intención, tokens y productos mencionados para analytics.',
        inputs: [
          { name: 'conversationId', type: 'string', description: 'ID de la conversación' },
          { name: 'userMessage', type: 'string', description: 'Texto del mensaje del usuario' },
          { name: 'botResponse', type: 'string', description: 'Respuesta generada' },
          { name: 'intent', type: 'string', description: 'Intención detectada' },
          { name: 'tokensUsed', type: 'number', description: 'Tokens totales consumidos' },
          { name: 'metadata', type: 'object', description: 'Datos adicionales para analytics' }
        ],
        outputs: [
          { name: 'userMessageId', type: 'string', description: 'ID del mensaje de usuario', example: '"msg_user_123"' },
          { name: 'botMessageId', type: 'string', description: 'ID del mensaje del bot', example: '"msg_bot_456"' },
          { name: 'savedAt', type: 'Date', description: 'Timestamp de guardado' }
        ],
        technology: { name: 'Supabase', endpoint: 'twilio_messages', method: 'INSERT (batch)' },
        typicalDuration: '30-80ms',
        errorCases: [
          { code: 'DB_ERROR', description: 'Error en transacción', handling: 'Rollback, log error, continúa flujo' },
          { code: 'CONSTRAINT_ERROR', description: 'Violación de FK', handling: 'Log crítico, skip guardado' }
        ]
      }
    },
    {
      id: 'http-send',
      type: 'http',
      label: 'Enviar Twilio',
      description: 'POST Messages API',
      icon: 'send',
      position: { x: 1590, y: 150 },
      details: {
        longDescription: 'Envía la respuesta al cliente usando la API de Mensajes de Twilio. Hace POST al endpoint de messages con el número destino (prefijado con whatsapp:), el número origen de Twilio, y el texto de la respuesta.',
        inputs: [
          { name: 'to', type: 'string', description: 'Número destino con prefijo', example: '"whatsapp:+5492994123456"' },
          { name: 'from', type: 'string', description: 'Número Twilio configurado', example: '"whatsapp:+14155238886"' },
          { name: 'body', type: 'string', description: 'Texto de la respuesta' }
        ],
        outputs: [
          { name: 'messageSid', type: 'string', description: 'ID del mensaje enviado', example: '"SMabcdef1234567890"' },
          { name: 'status', type: 'string', description: 'Estado del mensaje', example: '"queued"' },
          { name: 'dateCreated', type: 'Date', description: 'Timestamp de creación' }
        ],
        technology: { name: 'Twilio Messages API', endpoint: '/2010-04-01/Accounts/{AccountSid}/Messages.json', method: 'POST' },
        typicalDuration: '200-500ms',
        errorCases: [
          { code: 'INVALID_NUMBER', description: 'Número no válido para WhatsApp', handling: 'Log error, no retry' },
          { code: 'RATE_LIMIT', description: 'Límite de mensajes Twilio', handling: 'Queue con delay' },
          { code: 'UNDELIVERED', description: 'Mensaje no entregable', handling: 'Log warning, notificar si recurrente' }
        ]
      }
    },
    {
      id: 'end',
      type: 'end',
      label: 'Fin',
      description: 'TwiML Response',
      icon: 'check',
      position: { x: 1810, y: 150 },
      details: {
        longDescription: 'Finaliza el flujo respondiendo con un TwiML vacío a Twilio. Twilio espera una respuesta TwiML (XML). Un TwiML vacío indica que el mensaje fue procesado sin necesidad de respuesta síncrona.',
        inputs: [
          { name: 'success', type: 'boolean', description: 'Si el flujo completó exitosamente' },
          { name: 'processingTime', type: 'number', description: 'Tiempo total de procesamiento en ms' }
        ],
        outputs: [
          { name: 'response', type: 'TwiML', description: 'Respuesta TwiML vacía', example: '<?xml version="1.0" encoding="UTF-8"?><Response></Response>' }
        ],
        technology: { name: 'TwiML Response', method: 'text/xml' },
        typicalDuration: '< 1ms',
        errorCases: []
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'trigger-webhook', target: 'verify-signature' },
    { id: 'e2', source: 'verify-signature', target: 'parse-form' },
    { id: 'e3', source: 'parse-form', target: 'db-conversation' },
    { id: 'e4', source: 'db-conversation', target: 'ai-intent' },
    { id: 'e5', source: 'ai-intent', target: 'ai-generate' },
    { id: 'e6', source: 'ai-generate', target: 'db-save' },
    { id: 'e7', source: 'db-save', target: 'http-send' },
    { id: 'e8', source: 'http-send', target: 'end' }
  ]
}
