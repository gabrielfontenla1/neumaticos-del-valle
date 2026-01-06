import type { WorkflowDefinition } from '../types'

export const appointmentFlow: WorkflowDefinition = {
  id: 'appointment-flow',
  name: 'Flujo de Turnos',
  description: 'State machine para agendar turnos via WhatsApp',
  trigger: 'state-idle',
  nodes: [
    {
      id: 'state-idle',
      type: 'trigger',
      label: 'Inicio',
      description: 'Usuario pide turno',
      icon: 'play',
      position: { x: 50, y: 150 },
      details: {
        longDescription: 'Estado inicial del flujo de turnos. Se activa cuando el sistema detecta que el usuario quiere agendar un turno, ya sea por intención explícita ("quiero sacar turno") o por palabras clave relacionadas con servicios del taller.',
        inputs: [
          { name: 'conversationId', type: 'string', description: 'ID de la conversación activa' },
          { name: 'phoneNumber', type: 'string', description: 'Número del cliente', example: '"+5492994123456"' },
          { name: 'userMessage', type: 'string', description: 'Mensaje que disparó el flujo', example: '"Quiero sacar turno para alineación"' },
          { name: 'customerProfile', type: 'Customer | null', description: 'Perfil del cliente si existe' }
        ],
        outputs: [
          { name: 'appointmentState', type: 'AppointmentState', description: 'Estado inicial del flujo', example: '{ step: "asking_service", data: {} }' },
          { name: 'isReturningCustomer', type: 'boolean', description: 'Si el cliente ya tiene turnos previos' }
        ],
        technology: { name: 'State Machine', method: 'XState / Custom FSM' },
        typicalDuration: '< 1ms',
        errorCases: []
      }
    },
    {
      id: 'ask-service',
      type: 'action',
      label: 'Preguntar Servicio',
      description: '¿Qué servicio?',
      icon: 'help',
      position: { x: 270, y: 150 },
      details: {
        longDescription: 'Genera un mensaje preguntando al usuario qué servicio necesita. Presenta las opciones disponibles de forma amigable, incluyendo alineación y balanceo, cambio de cubiertas, rotación, reparación de pinchazos, etc.',
        inputs: [
          { name: 'services', type: 'Service[]', description: 'Lista de servicios disponibles' },
          { name: 'userMessage', type: 'string', description: 'Mensaje original (puede tener servicio implícito)' }
        ],
        outputs: [
          { name: 'responseMessage', type: 'string', description: 'Mensaje con opciones de servicio', example: '"¿Qué servicio necesitás? 1) Alineación 2) Balanceo..."' },
          { name: 'extractedService', type: 'Service | null', description: 'Servicio si fue mencionado en el mensaje' }
        ],
        technology: { name: 'GPT-4 / Template', method: 'Message generation' },
        typicalDuration: '100-500ms',
        errorCases: [
          { code: 'NO_SERVICES', description: 'Sin servicios configurados', handling: 'Error de configuración, notificar admin' }
        ]
      }
    },
    {
      id: 'db-services',
      type: 'database',
      label: 'Cargar Servicios',
      description: 'appointment_services',
      icon: 'database',
      position: { x: 490, y: 150 },
      details: {
        longDescription: 'Carga la lista de servicios disponibles desde la tabla appointment_services de Supabase. Incluye nombre, descripción, duración estimada, precio y si requiere turno previo o permite walk-in.',
        inputs: [
          { name: 'storeId', type: 'string', description: 'ID de la sucursal (opcional)', example: '"store_1"' },
          { name: 'activeOnly', type: 'boolean', description: 'Filtrar solo servicios activos', example: 'true' }
        ],
        outputs: [
          { name: 'services', type: 'Service[]', description: 'Lista de servicios', example: '[{ id: "1", name: "Alineación", duration: 60, price: 15000 }]' },
          { name: 'categories', type: 'string[]', description: 'Categorías de servicios disponibles' }
        ],
        technology: { name: 'Supabase', endpoint: 'appointment_services', method: 'SELECT' },
        typicalDuration: '30-80ms',
        errorCases: [
          { code: 'DB_ERROR', description: 'Error de conexión', handling: 'Retry, luego mensaje de error amigable' },
          { code: 'EMPTY_RESULT', description: 'Sin servicios configurados', handling: 'Alerta admin, mensaje de disculpas' }
        ]
      }
    },
    {
      id: 'ask-branch',
      type: 'action',
      label: 'Preguntar Sucursal',
      description: '¿En qué sucursal?',
      icon: 'building',
      position: { x: 710, y: 150 },
      details: {
        longDescription: 'Pregunta al usuario en qué sucursal prefiere atenderse. Muestra las opciones con nombre, dirección y horarios. Si solo hay una sucursal, la selecciona automáticamente e informa al usuario.',
        inputs: [
          { name: 'branches', type: 'Branch[]', description: 'Lista de sucursales disponibles' },
          { name: 'selectedService', type: 'Service', description: 'Servicio ya seleccionado' },
          { name: 'userLocation', type: 'Location | null', description: 'Ubicación del usuario si compartió' }
        ],
        outputs: [
          { name: 'responseMessage', type: 'string', description: 'Mensaje con opciones de sucursal', example: '"¿En qué sucursal preferís? 1) Casa Central 2) Plottier"' },
          { name: 'autoSelected', type: 'Branch | null', description: 'Sucursal auto-seleccionada si es única' }
        ],
        technology: { name: 'GPT-4 / Template', method: 'Message generation' },
        typicalDuration: '100-300ms',
        errorCases: [
          { code: 'NO_BRANCHES', description: 'Sin sucursales configuradas', handling: 'Error crítico, notificar admin' }
        ]
      }
    },
    {
      id: 'db-branches',
      type: 'database',
      label: 'Cargar Sucursales',
      description: 'stores/branches',
      icon: 'database',
      position: { x: 930, y: 150 },
      details: {
        longDescription: 'Carga las sucursales disponibles desde Supabase. Filtra por sucursales que ofrecen el servicio seleccionado y que tienen horarios de atención configurados. Incluye dirección, teléfono y horarios.',
        inputs: [
          { name: 'serviceId', type: 'string', description: 'ID del servicio seleccionado' },
          { name: 'activeOnly', type: 'boolean', description: 'Solo sucursales activas' }
        ],
        outputs: [
          { name: 'branches', type: 'Branch[]', description: 'Sucursales disponibles', example: '[{ id: "1", name: "Casa Central", address: "..." }]' },
          { name: 'serviceAvailability', type: 'object', description: 'Disponibilidad del servicio por sucursal' }
        ],
        technology: { name: 'Supabase', endpoint: 'stores', method: 'SELECT + JOIN' },
        typicalDuration: '40-100ms',
        errorCases: [
          { code: 'NO_AVAILABILITY', description: 'Servicio no disponible en ninguna sucursal', handling: 'Mensaje explicativo, sugerir alternativas' }
        ]
      }
    },
    {
      id: 'ask-date',
      type: 'action',
      label: 'Preguntar Fecha',
      description: '¿Qué día preferís?',
      icon: 'calendar',
      position: { x: 1150, y: 150 },
      details: {
        longDescription: 'Pregunta al usuario qué día prefiere para el turno. Acepta respuestas naturales como "mañana", "el lunes", "la semana que viene". Muestra los próximos días disponibles considerando feriados y días no laborables.',
        inputs: [
          { name: 'selectedBranch', type: 'Branch', description: 'Sucursal seleccionada' },
          { name: 'selectedService', type: 'Service', description: 'Servicio seleccionado' },
          { name: 'workingDays', type: 'string[]', description: 'Días laborables de la sucursal' }
        ],
        outputs: [
          { name: 'responseMessage', type: 'string', description: 'Mensaje preguntando fecha', example: '"¿Qué día te viene bien? Tenemos disponibilidad de lunes a viernes."' },
          { name: 'suggestedDates', type: 'Date[]', description: 'Fechas sugeridas con disponibilidad' }
        ],
        technology: { name: 'GPT-4 / Template', method: 'Message generation' },
        typicalDuration: '100-300ms',
        errorCases: []
      }
    },
    {
      id: 'ai-parse-date',
      type: 'ai',
      label: 'Parsear Fecha',
      description: '"mañana" → fecha',
      icon: 'brain',
      position: { x: 1370, y: 150 },
      details: {
        longDescription: 'Usa IA para interpretar la respuesta del usuario y convertirla en una fecha concreta. Entiende expresiones como "mañana", "el martes", "la semana que viene", "el 15", "en 3 días", adaptándose al español argentino.',
        inputs: [
          { name: 'userInput', type: 'string', description: 'Respuesta del usuario', example: '"el martes que viene"' },
          { name: 'referenceDate', type: 'Date', description: 'Fecha actual para referencia' },
          { name: 'workingDays', type: 'string[]', description: 'Días laborables válidos' }
        ],
        outputs: [
          { name: 'parsedDate', type: 'Date', description: 'Fecha interpretada', example: '2024-01-16' },
          { name: 'confidence', type: 'number', description: 'Confianza del parsing', example: '0.95' },
          { name: 'isValid', type: 'boolean', description: 'Si la fecha es válida y laborable' },
          { name: 'clarificationNeeded', type: 'boolean', description: 'Si necesita confirmación del usuario' }
        ],
        technology: { name: 'OpenAI GPT-4', endpoint: '/v1/chat/completions', method: 'POST' },
        typicalDuration: '500ms - 1.5s',
        errorCases: [
          { code: 'AMBIGUOUS_DATE', description: 'Fecha ambigua', handling: 'Pedir aclaración al usuario' },
          { code: 'PAST_DATE', description: 'Fecha en el pasado', handling: 'Informar y pedir otra fecha' },
          { code: 'NON_WORKING', description: 'Día no laborable', handling: 'Sugerir día alternativo' }
        ]
      }
    },
    {
      id: 'ask-time',
      type: 'action',
      label: 'Preguntar Horario',
      description: 'Mostrar slots',
      icon: 'clock',
      position: { x: 1590, y: 150 },
      details: {
        longDescription: 'Muestra los horarios disponibles para la fecha seleccionada. Presenta los slots libres de forma clara, agrupados por mañana/tarde si hay muchos. Considera la duración del servicio para no ofrecer slots que no alcancen.',
        inputs: [
          { name: 'parsedDate', type: 'Date', description: 'Fecha seleccionada' },
          { name: 'availableSlots', type: 'TimeSlot[]', description: 'Slots disponibles' },
          { name: 'serviceDuration', type: 'number', description: 'Duración del servicio en minutos' }
        ],
        outputs: [
          { name: 'responseMessage', type: 'string', description: 'Mensaje con horarios', example: '"Para el martes 16 tengo: 9:00, 10:30, 14:00, 15:30"' },
          { name: 'formattedSlots', type: 'string[]', description: 'Horarios formateados para mostrar' }
        ],
        technology: { name: 'Template Engine', method: 'String formatting' },
        typicalDuration: '50-150ms',
        errorCases: [
          { code: 'NO_SLOTS', description: 'Sin horarios disponibles', handling: 'Sugerir otro día, mostrar alternativas' }
        ]
      }
    },
    {
      id: 'db-slots',
      type: 'database',
      label: 'Verificar Slots',
      description: 'get_available_slots',
      icon: 'database',
      position: { x: 1810, y: 150 },
      details: {
        longDescription: 'Consulta los slots disponibles para la fecha y sucursal seleccionadas. Usa una función RPC de Supabase que calcula disponibilidad considerando turnos existentes, horarios de trabajo, y la duración del servicio.',
        inputs: [
          { name: 'branchId', type: 'string', description: 'ID de la sucursal' },
          { name: 'serviceId', type: 'string', description: 'ID del servicio' },
          { name: 'date', type: 'Date', description: 'Fecha a consultar' }
        ],
        outputs: [
          { name: 'slots', type: 'TimeSlot[]', description: 'Slots disponibles', example: '[{ time: "09:00", available: true }, { time: "10:30", available: true }]' },
          { name: 'nextAvailableDate', type: 'Date | null', description: 'Próxima fecha con disponibilidad si no hay slots' }
        ],
        technology: { name: 'Supabase RPC', endpoint: 'get_available_slots', method: 'FUNCTION CALL' },
        typicalDuration: '50-120ms',
        errorCases: [
          { code: 'DB_ERROR', description: 'Error en consulta', handling: 'Retry, mensaje de error' },
          { code: 'SLOT_TAKEN', description: 'Slot tomado durante selección', handling: 'Actualizar y mostrar nuevos slots' }
        ]
      }
    },
    {
      id: 'ask-confirm',
      type: 'condition',
      label: 'Confirmar Turno',
      description: '¿Confirmás?',
      icon: 'check-circle',
      position: { x: 2030, y: 150 },
      details: {
        longDescription: 'Muestra un resumen completo del turno y pide confirmación al usuario. Incluye servicio, sucursal, fecha, horario y cualquier información adicional relevante. Espera una respuesta afirmativa o negativa.',
        inputs: [
          { name: 'selectedService', type: 'Service', description: 'Servicio seleccionado' },
          { name: 'selectedBranch', type: 'Branch', description: 'Sucursal seleccionada' },
          { name: 'selectedDate', type: 'Date', description: 'Fecha seleccionada' },
          { name: 'selectedTime', type: 'string', description: 'Horario seleccionado', example: '"10:30"' },
          { name: 'customerName', type: 'string', description: 'Nombre del cliente' }
        ],
        outputs: [
          { name: 'summaryMessage', type: 'string', description: 'Resumen del turno', example: '"Confirmame: Alineación en Casa Central, martes 16 a las 10:30. ¿Confirmo?"' },
          { name: 'confirmed', type: 'boolean', description: 'Si el usuario confirmó' },
          { name: 'userResponse', type: 'string', description: 'Respuesta del usuario' }
        ],
        technology: { name: 'GPT-4 / Template', method: 'Intent detection' },
        typicalDuration: '200-600ms',
        errorCases: [
          { code: 'UNCLEAR_RESPONSE', description: 'Respuesta ambigua', handling: 'Pedir confirmación clara sí/no' }
        ]
      }
    },
    {
      id: 'db-create',
      type: 'database',
      label: 'Crear Turno',
      description: 'INSERT appointments',
      icon: 'save',
      position: { x: 2250, y: 80 },
      details: {
        longDescription: 'Crea el turno en la tabla appointments de Supabase. Usa una transacción para verificar disponibilidad, crear el turno y actualizar slots en una operación atómica. Genera un código de confirmación único.',
        inputs: [
          { name: 'serviceId', type: 'string', description: 'ID del servicio' },
          { name: 'branchId', type: 'string', description: 'ID de la sucursal' },
          { name: 'customerId', type: 'string', description: 'ID del cliente' },
          { name: 'dateTime', type: 'Date', description: 'Fecha y hora del turno' },
          { name: 'phoneNumber', type: 'string', description: 'Teléfono de contacto' },
          { name: 'notes', type: 'string', description: 'Notas adicionales' }
        ],
        outputs: [
          { name: 'appointmentId', type: 'string', description: 'ID del turno creado', example: '"apt_123abc"' },
          { name: 'confirmationCode', type: 'string', description: 'Código de confirmación', example: '"NDV-4521"' },
          { name: 'createdAt', type: 'Date', description: 'Timestamp de creación' }
        ],
        technology: { name: 'Supabase', endpoint: 'appointments', method: 'INSERT (transaction)' },
        typicalDuration: '80-200ms',
        errorCases: [
          { code: 'SLOT_UNAVAILABLE', description: 'Slot ya no disponible', handling: 'Informar y ofrecer alternativas' },
          { code: 'DUPLICATE', description: 'Cliente ya tiene turno ese día', handling: 'Informar turno existente' },
          { code: 'DB_ERROR', description: 'Error de base de datos', handling: 'Retry, mensaje de error' }
        ]
      }
    },
    {
      id: 'send-confirm',
      type: 'http',
      label: 'Enviar Confirm',
      description: 'Turno agendado',
      icon: 'send',
      position: { x: 2470, y: 80 },
      details: {
        longDescription: 'Envía el mensaje de confirmación al cliente con todos los detalles del turno. Incluye código de confirmación, fecha, hora, sucursal, dirección y opción para cancelar o reprogramar.',
        inputs: [
          { name: 'appointmentDetails', type: 'Appointment', description: 'Detalles completos del turno' },
          { name: 'confirmationCode', type: 'string', description: 'Código de confirmación' },
          { name: 'conversationId', type: 'string', description: 'ID de conversación para envío' }
        ],
        outputs: [
          { name: 'messageSent', type: 'boolean', description: 'Si el mensaje fue enviado', example: 'true' },
          { name: 'messageId', type: 'string', description: 'ID del mensaje enviado' }
        ],
        technology: { name: 'Kommo/Twilio API', endpoint: 'messages', method: 'POST' },
        typicalDuration: '200-500ms',
        errorCases: [
          { code: 'SEND_FAILED', description: 'Error al enviar mensaje', handling: 'Retry, el turno sigue creado' }
        ]
      }
    },
    {
      id: 'end-success',
      type: 'end',
      label: 'Éxito',
      description: 'Turno creado',
      icon: 'check',
      position: { x: 2690, y: 80 },
      details: {
        longDescription: 'Estado final exitoso del flujo. El turno fue creado y confirmado. Limpia el estado de la conversación, registra métricas del flujo, y marca la sesión de turno como completada.',
        inputs: [
          { name: 'appointmentId', type: 'string', description: 'ID del turno creado' },
          { name: 'confirmationCode', type: 'string', description: 'Código de confirmación' },
          { name: 'flowDuration', type: 'number', description: 'Duración total del flujo en ms' }
        ],
        outputs: [
          { name: 'appointmentState', type: 'null', description: 'Estado limpiado de la conversación' },
          { name: 'metrics', type: 'object', description: 'Métricas del flujo', example: '{ steps: 8, duration: 45000, success: true }' }
        ],
        technology: { name: 'State Machine', method: 'State cleanup' },
        typicalDuration: '< 1ms',
        errorCases: []
      }
    },
    {
      id: 'end-cancel',
      type: 'end',
      label: 'Cancelado',
      description: 'Usuario canceló',
      icon: 'x',
      position: { x: 2250, y: 220 },
      details: {
        longDescription: 'Estado final cuando el usuario cancela el proceso de turno. Puede ocurrir en cualquier paso si el usuario dice "cancelar" o "no quiero". Envía un mensaje amigable y limpia el estado de la conversación.',
        inputs: [
          { name: 'cancelReason', type: 'string', description: 'Motivo de cancelación si se indicó' },
          { name: 'stepCancelled', type: 'string', description: 'Paso en el que se canceló' },
          { name: 'conversationId', type: 'string', description: 'ID de la conversación' }
        ],
        outputs: [
          { name: 'appointmentState', type: 'null', description: 'Estado limpiado' },
          { name: 'cancellationMessage', type: 'string', description: 'Mensaje de despedida', example: '"Entendido, cancelamos el turno. Cuando quieras, escribime."' }
        ],
        technology: { name: 'State Machine', method: 'State cleanup' },
        typicalDuration: '50-100ms',
        errorCases: []
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'state-idle', target: 'ask-service' },
    { id: 'e2', source: 'ask-service', target: 'db-services' },
    { id: 'e3', source: 'db-services', target: 'ask-branch' },
    { id: 'e4', source: 'ask-branch', target: 'db-branches' },
    { id: 'e5', source: 'db-branches', target: 'ask-date' },
    { id: 'e6', source: 'ask-date', target: 'ai-parse-date' },
    { id: 'e7', source: 'ai-parse-date', target: 'ask-time' },
    { id: 'e8', source: 'ask-time', target: 'db-slots' },
    { id: 'e9', source: 'db-slots', target: 'ask-confirm' },
    { id: 'e10', source: 'ask-confirm', target: 'db-create', label: 'Sí' },
    { id: 'e11', source: 'ask-confirm', target: 'end-cancel', label: 'No' },
    { id: 'e12', source: 'db-create', target: 'send-confirm' },
    { id: 'e13', source: 'send-confirm', target: 'end-success' }
  ]
}
