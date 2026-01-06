import type { WorkflowDefinition } from '../types'

export const kommoWebhookFlow: WorkflowDefinition = {
  id: 'kommo-webhook',
  name: 'Kommo WhatsApp Bot',
  description: 'Procesa mensajes de WhatsApp via Kommo CRM con respuestas de IA',
  trigger: 'trigger-webhook',
  nodes: [
    {
      id: 'trigger-webhook',
      type: 'trigger',
      label: 'Webhook Kommo',
      description: 'Recibe mensaje WhatsApp',
      icon: 'webhook',
      position: { x: 50, y: 150 },
      details: {
        longDescription: 'Punto de entrada del flujo. Recibe una solicitud HTTP POST desde Kommo CRM cuando un cliente envía un mensaje de WhatsApp. El webhook contiene el payload JSON con los datos del mensaje, remitente y metadatos de la conversación.',
        inputs: [
          { name: 'request', type: 'NextRequest', description: 'Solicitud HTTP entrante de Kommo', example: 'POST /api/kommo/webhook' },
          { name: 'headers', type: 'Headers', description: 'Headers HTTP incluyendo X-Signature', example: 'X-Signature: sha256=abc123...' },
          { name: 'body', type: 'JSON', description: 'Payload con mensaje y metadata', example: '{ "message": {...}, "account_id": "..." }' }
        ],
        outputs: [
          { name: 'rawPayload', type: 'object', description: 'Payload JSON parseado', example: '{ message: { text: "Hola" } }' },
          { name: 'signature', type: 'string', description: 'Firma del header para validación' }
        ],
        technology: { name: 'Next.js API Route', endpoint: '/api/kommo/webhook', method: 'POST' },
        typicalDuration: '5-20ms',
        errorCases: [
          { code: 'INVALID_JSON', description: 'Payload no es JSON válido', handling: 'Responde 400 Bad Request' },
          { code: 'MISSING_HEADERS', description: 'Faltan headers requeridos', handling: 'Responde 400 con error específico' }
        ]
      }
    },
    {
      id: 'verify-signature',
      type: 'action',
      label: 'Verificar Firma',
      description: 'Valida X-Signature',
      icon: 'shield',
      position: { x: 270, y: 150 },
      details: {
        longDescription: 'Valida la autenticidad del webhook verificando el header X-Signature contra el secreto configurado. Usa HMAC-SHA256 para comparar la firma enviada con la calculada del payload, previniendo solicitudes falsificadas.',
        inputs: [
          { name: 'signature', type: 'string', description: 'Firma del header X-Signature', example: 'sha256=5d41402abc4b2a76b9719d911017c592' },
          { name: 'payload', type: 'string', description: 'Cuerpo raw de la solicitud' },
          { name: 'secret', type: 'string', description: 'KOMMO_WEBHOOK_SECRET del env' }
        ],
        outputs: [
          { name: 'isValid', type: 'boolean', description: 'Si la firma es válida', example: 'true' },
          { name: 'verifiedPayload', type: 'object', description: 'Payload verificado para continuar' }
        ],
        technology: { name: 'Node.js Crypto', method: 'HMAC-SHA256' },
        typicalDuration: '1-5ms',
        errorCases: [
          { code: 'INVALID_SIGNATURE', description: 'Firma no coincide', handling: 'Responde 401 Unauthorized, log de seguridad' },
          { code: 'MISSING_SECRET', description: 'No hay secret configurado', handling: 'Error 500, alerta a devops' }
        ]
      }
    },
    {
      id: 'extract-message',
      type: 'action',
      label: 'Extraer Mensaje',
      description: 'Parse del payload',
      icon: 'extract',
      position: { x: 490, y: 150 },
      details: {
        longDescription: 'Extrae y normaliza los datos del mensaje del payload de Kommo. Obtiene el texto del mensaje, número de teléfono del remitente, ID de conversación, timestamp y cualquier metadata adicional como archivos adjuntos o ubicación.',
        inputs: [
          { name: 'payload', type: 'KommoPayload', description: 'Payload verificado del webhook' }
        ],
        outputs: [
          { name: 'messageText', type: 'string', description: 'Texto del mensaje del usuario', example: '"Hola, busco cubiertas 205/55R16"' },
          { name: 'phoneNumber', type: 'string', description: 'Número WhatsApp del cliente', example: '"+5492994123456"' },
          { name: 'conversationId', type: 'string', description: 'ID de la conversación en Kommo', example: '"conv_12345"' },
          { name: 'timestamp', type: 'Date', description: 'Momento del mensaje' },
          { name: 'metadata', type: 'object', description: 'Datos adicionales (media, location)', example: '{ hasMedia: false }' }
        ],
        technology: { name: 'TypeScript', method: 'JSON parsing + validation' },
        typicalDuration: '1-3ms',
        errorCases: [
          { code: 'MISSING_MESSAGE', description: 'Payload sin campo message', handling: 'Log warning, responde 200 (evita retry)' },
          { code: 'UNSUPPORTED_TYPE', description: 'Tipo de mensaje no soportado', handling: 'Ignora silenciosamente, log info' }
        ]
      }
    },
    {
      id: 'db-conversation',
      type: 'database',
      label: 'DB: Conversación',
      description: 'Obtener/crear conv',
      icon: 'database',
      position: { x: 710, y: 150 },
      details: {
        longDescription: 'Busca la conversación existente en Supabase usando el número de teléfono o ID de Kommo. Si no existe, crea una nueva entrada. También carga el historial de mensajes recientes para dar contexto a la IA.',
        inputs: [
          { name: 'phoneNumber', type: 'string', description: 'Número del cliente' },
          { name: 'conversationId', type: 'string', description: 'ID de conversación Kommo' }
        ],
        outputs: [
          { name: 'conversation', type: 'Conversation', description: 'Objeto de conversación', example: '{ id: "uuid", status: "active" }' },
          { name: 'messageHistory', type: 'Message[]', description: 'Últimos 10 mensajes de la conversación' },
          { name: 'customerProfile', type: 'Customer | null', description: 'Perfil del cliente si existe' },
          { name: 'appointmentState', type: 'AppointmentState | null', description: 'Estado del flujo de turnos si está activo' }
        ],
        technology: { name: 'Supabase', endpoint: 'kommo_conversations', method: 'SELECT + INSERT' },
        typicalDuration: '50-150ms',
        errorCases: [
          { code: 'DB_CONNECTION', description: 'Error de conexión a Supabase', handling: 'Retry 2x, luego respuesta genérica' },
          { code: 'DUPLICATE_KEY', description: 'Condición de carrera en creación', handling: 'Retry con SELECT' }
        ]
      }
    },
    {
      id: 'ai-intent',
      type: 'ai',
      label: 'Detectar Intención',
      description: 'OpenAI clasifica',
      icon: 'brain',
      position: { x: 930, y: 150 },
      details: {
        longDescription: 'Analiza el mensaje del usuario utilizando GPT-4 para clasificar su intención. Determina si el usuario quiere consultar productos, hacer preguntas generales, agendar un turno, hablar con un humano, o continuar un flujo existente como el de turnos.',
        inputs: [
          { name: 'message', type: 'string', description: 'Mensaje del usuario', example: '"Hola, busco cubiertas 205/55R16"' },
          { name: 'history', type: 'Message[]', description: 'Historial de conversación para contexto' },
          { name: 'appointmentState', type: 'AppointmentState | null', description: 'Estado del flujo de turnos si está activo' }
        ],
        outputs: [
          { name: 'intent', type: 'string', description: 'Intención detectada', example: '"product_search" | "faq" | "appointment" | "escalate" | "continue_appointment"' },
          { name: 'confidence', type: 'number', description: 'Confianza de la clasificación (0-1)', example: '0.92' },
          { name: 'entities', type: 'object', description: 'Entidades extraídas del mensaje', example: '{ size: "205/55R16", brand: null }' }
        ],
        technology: { name: 'OpenAI GPT-4', endpoint: '/v1/chat/completions', method: 'POST' },
        typicalDuration: '800ms - 2s',
        errorCases: [
          { code: 'RATE_LIMIT', description: 'Límite de API de OpenAI', handling: 'Retry con backoff exponencial' },
          { code: 'TIMEOUT', description: 'Sin respuesta en 10s', handling: 'Respuesta genérica, log error' },
          { code: 'CONTEXT_TOO_LONG', description: 'Historial excede tokens', handling: 'Truncar historial antiguo' }
        ]
      }
    },
    {
      id: 'db-save-user',
      type: 'database',
      label: 'Guardar Mensaje',
      description: 'Insert kommo_msg',
      icon: 'save',
      position: { x: 1150, y: 150 },
      details: {
        longDescription: 'Persiste el mensaje del usuario en la tabla kommo_messages de Supabase. Guarda el texto, intención detectada, entidades extraídas, timestamp y metadata. Esto alimenta el historial para futuras interacciones y analytics.',
        inputs: [
          { name: 'conversationId', type: 'string', description: 'ID de la conversación' },
          { name: 'messageText', type: 'string', description: 'Texto del mensaje' },
          { name: 'intent', type: 'string', description: 'Intención clasificada' },
          { name: 'entities', type: 'object', description: 'Entidades extraídas' },
          { name: 'metadata', type: 'object', description: 'Datos adicionales' }
        ],
        outputs: [
          { name: 'messageId', type: 'string', description: 'UUID del mensaje guardado', example: '"msg_abc123"' },
          { name: 'savedAt', type: 'Date', description: 'Timestamp de guardado' }
        ],
        technology: { name: 'Supabase', endpoint: 'kommo_messages', method: 'INSERT' },
        typicalDuration: '20-50ms',
        errorCases: [
          { code: 'CONSTRAINT_VIOLATION', description: 'FK a conversación inválida', handling: 'Error crítico, log y skip' },
          { code: 'DB_TIMEOUT', description: 'Timeout de inserción', handling: 'Continúa flujo, reintentar async' }
        ]
      }
    },
    {
      id: 'condition-appointment',
      type: 'condition',
      label: '¿Turno?',
      description: '¿Es flujo de turno?',
      icon: 'split',
      position: { x: 1370, y: 150 },
      details: {
        longDescription: 'Evalúa si el mensaje debe ser procesado por el flujo de turnos. Verifica si la intención detectada es "appointment" o si hay un flujo de turno activo (appointmentState != null). Esto bifurca el flujo hacia la state machine de turnos o continúa con búsqueda de productos/FAQs.',
        inputs: [
          { name: 'intent', type: 'string', description: 'Intención detectada', example: '"appointment"' },
          { name: 'appointmentState', type: 'AppointmentState | null', description: 'Estado del flujo de turnos' },
          { name: 'message', type: 'string', description: 'Mensaje para continuar flujo de turnos' }
        ],
        outputs: [
          { name: 'isAppointmentFlow', type: 'boolean', description: 'Si debe ir al flujo de turnos', example: 'true' },
          { name: 'branch', type: 'string', description: 'Rama a seguir: "appointment" o "general"' }
        ],
        typicalDuration: '< 1ms',
        errorCases: []
      }
    },
    {
      id: 'ai-search-products',
      type: 'ai',
      label: 'Buscar Productos',
      description: 'Búsqueda semántica',
      icon: 'search',
      position: { x: 1590, y: 80 },
      details: {
        longDescription: 'Realiza búsqueda semántica de productos usando embeddings de OpenAI. Convierte la consulta del usuario a un vector y busca los productos más similares en la base de datos usando pgvector. Filtra por stock disponible y relevancia.',
        inputs: [
          { name: 'query', type: 'string', description: 'Consulta de búsqueda', example: '"cubiertas 205/55R16 para Corolla"' },
          { name: 'entities', type: 'object', description: 'Entidades extraídas (medida, marca, etc.)' },
          { name: 'limit', type: 'number', description: 'Máximo de resultados', example: '5' }
        ],
        outputs: [
          { name: 'products', type: 'Product[]', description: 'Productos encontrados con precio y stock', example: '[{ name: "Bridgestone Turanza", price: 85000, stock: 4 }]' },
          { name: 'similarity', type: 'number[]', description: 'Score de similitud por producto', example: '[0.89, 0.82, 0.76]' }
        ],
        technology: { name: 'OpenAI Embeddings + pgvector', endpoint: 'match_products RPC', method: 'FUNCTION CALL' },
        typicalDuration: '200-500ms',
        errorCases: [
          { code: 'NO_RESULTS', description: 'Sin productos coincidentes', handling: 'Sugiere productos similares o contacto' },
          { code: 'EMBEDDING_ERROR', description: 'Error generando embedding', handling: 'Fallback a búsqueda de texto' }
        ]
      }
    },
    {
      id: 'ai-search-faqs',
      type: 'ai',
      label: 'Buscar FAQs',
      description: 'Knowledge base',
      icon: 'book',
      position: { x: 1590, y: 220 },
      details: {
        longDescription: 'Busca en la base de conocimientos (FAQs, políticas, horarios, ubicaciones) usando búsqueda semántica. Encuentra las respuestas más relevantes a preguntas frecuentes como horarios, formas de pago, garantías, etc.',
        inputs: [
          { name: 'query', type: 'string', description: 'Pregunta del usuario', example: '"Cuál es el horario de atención?"' },
          { name: 'intent', type: 'string', description: 'Intención para filtrar categoría' }
        ],
        outputs: [
          { name: 'faqs', type: 'FAQ[]', description: 'FAQs relevantes encontradas', example: '[{ question: "Horarios", answer: "Lun-Vie 8-18hs..." }]' },
          { name: 'confidence', type: 'number', description: 'Confianza de la respuesta', example: '0.95' }
        ],
        technology: { name: 'OpenAI Embeddings + pgvector', endpoint: 'match_faqs RPC', method: 'FUNCTION CALL' },
        typicalDuration: '150-400ms',
        errorCases: [
          { code: 'NO_MATCH', description: 'Sin FAQ relevante', handling: 'Respuesta genérica + opción de contacto humano' }
        ]
      }
    },
    {
      id: 'ai-generate',
      type: 'ai',
      label: 'Generar Respuesta',
      description: 'GPT-4 genera',
      icon: 'sparkles',
      position: { x: 1810, y: 150 },
      details: {
        longDescription: 'Genera la respuesta final del bot usando GPT-4. Combina los resultados de búsqueda de productos y FAQs con el contexto de la conversación para crear una respuesta natural, amigable y útil en español argentino.',
        inputs: [
          { name: 'userMessage', type: 'string', description: 'Mensaje original del usuario' },
          { name: 'intent', type: 'string', description: 'Intención detectada' },
          { name: 'products', type: 'Product[]', description: 'Productos encontrados' },
          { name: 'faqs', type: 'FAQ[]', description: 'FAQs relevantes' },
          { name: 'history', type: 'Message[]', description: 'Historial de conversación' },
          { name: 'systemPrompt', type: 'string', description: 'Prompt del sistema con personalidad' }
        ],
        outputs: [
          { name: 'responseText', type: 'string', description: 'Respuesta generada para el usuario', example: '"Hola! Tenemos varias opciones en 205/55R16..."' },
          { name: 'tokensUsed', type: 'number', description: 'Tokens consumidos', example: '450' }
        ],
        technology: { name: 'OpenAI GPT-4', endpoint: '/v1/chat/completions', method: 'POST' },
        typicalDuration: '1-3s',
        errorCases: [
          { code: 'CONTENT_FILTER', description: 'Respuesta filtrada por políticas', handling: 'Respuesta alternativa segura' },
          { code: 'RATE_LIMIT', description: 'Límite de API', handling: 'Retry con backoff, queue si persiste' }
        ]
      }
    },
    {
      id: 'db-save-response',
      type: 'database',
      label: 'Guardar Respuesta',
      description: 'Insert msg bot',
      icon: 'save',
      position: { x: 2030, y: 150 },
      details: {
        longDescription: 'Persiste la respuesta del bot en la tabla kommo_messages. Guarda el texto generado, rol "assistant", tokens consumidos, productos mencionados y cualquier metadata relevante para analytics y mejora continua.',
        inputs: [
          { name: 'conversationId', type: 'string', description: 'ID de la conversación' },
          { name: 'responseText', type: 'string', description: 'Texto de la respuesta' },
          { name: 'tokensUsed', type: 'number', description: 'Tokens consumidos' },
          { name: 'productsReturned', type: 'string[]', description: 'IDs de productos mencionados' }
        ],
        outputs: [
          { name: 'messageId', type: 'string', description: 'UUID del mensaje guardado', example: '"msg_xyz789"' }
        ],
        technology: { name: 'Supabase', endpoint: 'kommo_messages', method: 'INSERT' },
        typicalDuration: '20-50ms',
        errorCases: [
          { code: 'DB_ERROR', description: 'Error de inserción', handling: 'Log error, continúa envío (mensaje no se pierde)' }
        ]
      }
    },
    {
      id: 'http-send',
      type: 'http',
      label: 'Enviar a Kommo',
      description: 'POST mensaje API',
      icon: 'send',
      position: { x: 2250, y: 150 },
      details: {
        longDescription: 'Envía la respuesta generada de vuelta al cliente a través de la API de Kommo. Hace POST al endpoint de mensajes de Kommo con el texto, ID de conversación y credenciales de autenticación.',
        inputs: [
          { name: 'responseText', type: 'string', description: 'Texto a enviar al cliente' },
          { name: 'conversationId', type: 'string', description: 'ID de conversación Kommo' },
          { name: 'accountId', type: 'string', description: 'ID de cuenta Kommo' }
        ],
        outputs: [
          { name: 'success', type: 'boolean', description: 'Si el mensaje fue enviado', example: 'true' },
          { name: 'messageId', type: 'string', description: 'ID del mensaje en Kommo' },
          { name: 'deliveredAt', type: 'Date', description: 'Timestamp de entrega' }
        ],
        technology: { name: 'Kommo API', endpoint: '/api/v4/leads/{id}/notes', method: 'POST' },
        typicalDuration: '200-500ms',
        errorCases: [
          { code: 'AUTH_ERROR', description: 'Token expirado o inválido', handling: 'Refresh token, retry' },
          { code: 'RATE_LIMIT', description: 'Límite de Kommo API', handling: 'Queue con delay' },
          { code: 'NETWORK_ERROR', description: 'Error de conexión', handling: 'Retry 3x con backoff' }
        ]
      }
    },
    {
      id: 'end',
      type: 'end',
      label: 'Fin',
      description: 'Response 200 OK',
      icon: 'check',
      position: { x: 2470, y: 150 },
      details: {
        longDescription: 'Finaliza el flujo respondiendo 200 OK al webhook de Kommo. Esto confirma que el mensaje fue procesado correctamente y evita reintentos. Incluye métricas de tiempo de procesamiento en los headers de respuesta.',
        inputs: [
          { name: 'success', type: 'boolean', description: 'Si el flujo completó exitosamente' },
          { name: 'processingTime', type: 'number', description: 'Tiempo total en ms' }
        ],
        outputs: [
          { name: 'response', type: 'NextResponse', description: 'Respuesta HTTP 200', example: '{ status: 200, body: { ok: true } }' }
        ],
        technology: { name: 'Next.js Response', method: 'HTTP 200 OK' },
        typicalDuration: '< 1ms',
        errorCases: []
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'trigger-webhook', target: 'verify-signature' },
    { id: 'e2', source: 'verify-signature', target: 'extract-message' },
    { id: 'e3', source: 'extract-message', target: 'db-conversation' },
    { id: 'e4', source: 'db-conversation', target: 'ai-intent' },
    { id: 'e5', source: 'ai-intent', target: 'db-save-user' },
    { id: 'e6', source: 'db-save-user', target: 'condition-appointment' },
    { id: 'e7', source: 'condition-appointment', target: 'ai-search-products', label: 'No' },
    { id: 'e8', source: 'condition-appointment', target: 'ai-search-faqs', label: 'No' },
    { id: 'e9', source: 'ai-search-products', target: 'ai-generate' },
    { id: 'e10', source: 'ai-search-faqs', target: 'ai-generate' },
    { id: 'e11', source: 'ai-generate', target: 'db-save-response' },
    { id: 'e12', source: 'db-save-response', target: 'http-send' },
    { id: 'e13', source: 'http-send', target: 'end' }
  ]
}
