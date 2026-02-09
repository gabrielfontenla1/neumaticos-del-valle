/**
 * OpenAI Function Handler for WhatsApp Bot
 * Processes function calls and executes appropriate actions
 */

import { openai, models, temperatures } from '@/lib/ai/openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import {
  whatsappTools,
  WHATSAPP_SYSTEM_PROMPT,
  getWhatsAppSystemPromptDynamic,
  getWhatsAppToolsDynamic,
  type BookAppointmentArgs,
  type ConfirmAppointmentArgs,
  type CheckStockArgs,
  type CancelOperationArgs,
  type ShowHelpArgs,
  type RequestHumanArgs
} from './tools'
import type { WhatsAppConversation, PendingAppointment } from '../types'
import { updateConversation } from '../repository'
import { pauseConversation } from '../repository'
import {
  PROVINCES,
  getBranchesByProvince,
  getServices,
  getServiceById,
  getAvailableDates,
  getAvailableSlots,
  createWhatsAppAppointment,
  formatPrice,
  type AvailableDate
} from '../services/appointment-service'
import {
  searchProductsWithStock,
  findBranchesWithStock,
  groupProductsByAvailability
} from '../services/stock-service'
import { findEquivalentsWithStock } from '../services/equivalence-service'
import {
  getBranchCodeFromCity,
  getBranchByCode
} from '../services/location-service'
import * as stockTemplates from '../templates/stock-responses'
import type { Branch } from '@/features/appointments/types'

// ============================================================================
// TYPES
// ============================================================================

export interface FunctionCallResult {
  handled: boolean
  response: string
  functionName?: string
  updatedPending?: PendingAppointment | null
  newState?: string
}

export interface WebPurchaseItem {
  sku: string
  name: string
  size: string
  quantity: number
  unitPrice: string
}

export interface WebPurchase {
  type: 'COMPRA_WEB' | 'CONSULTA_WEB'
  items: WebPurchaseItem[]
  total: string
  branchName?: string
}

// ============================================================================
// WEB PURCHASE PARSER
// ============================================================================

/**
 * Parse web purchase message with [BOT:COMPRA_WEB] or [BOT:CONSULTA_WEB] tags
 * These messages come from the cart checkout flow and contain pre-verified stock
 */
export function parseWebPurchaseMessage(text: string): WebPurchase | null {
  // Check for bot instruction tags
  const isCompra = text.includes('[BOT:COMPRA_WEB]')
  const isConsulta = text.includes('[BOT:CONSULTA_WEB]')

  if (!isCompra && !isConsulta) {
    return null
  }

  const items: WebPurchaseItem[] = []

  // Extract product details from message lines
  const lines = text.split('\n')

  // Extract branch name from "Sucursal:" line
  let branchName: string | undefined
  for (const line of lines) {
    const branchMatch = line.match(/^Sucursal:\s*(.+)$/i)
    if (branchMatch) {
      branchName = branchMatch[1].trim()
      break
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Find lines with SKU
    if (line.toLowerCase().includes('sku:')) {
      const skuMatch = line.match(/SKU:\s*([^\s\n|]+)/i)
      const sku = skuMatch ? skuMatch[1].trim() : ''

      // Get product name from next line (indented with spaces)
      const nameLine = lines[i + 1]?.trim() || ''
      const name = nameLine.startsWith('#') ? '' : nameLine

      // Get size from "Medida:" line
      const sizeLine = lines[i + 2]?.trim() || ''
      const sizeMatch = sizeLine.match(/Medida:\s*([^\n]+)/i)
      const size = sizeMatch ? sizeMatch[1].trim() : ''

      // Get quantity and price from "Cantidad:" line
      const qtyLine = lines[i + 3]?.trim() || ''
      const qtyMatch = qtyLine.match(/Cantidad:\s*(\d+)/i)
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1

      const priceMatch = qtyLine.match(/\$[\d.,]+/i)
      const unitPrice = priceMatch ? priceMatch[0] : ''

      if (sku) {
        items.push({ sku, name, size, quantity, unitPrice })
      }
    }
  }

  // Extract total (handle *TOTAL: $xxx* format with bold asterisks)
  const totalMatch = text.match(/\*?TOTAL:\s*(\$[\d.,]+)\*?/i)
  const total = totalMatch ? totalMatch[1] : ''

  return {
    type: isCompra ? 'COMPRA_WEB' : 'CONSULTA_WEB',
    items,
    total,
    branchName
  }
}

/**
 * Handle web purchase flow - skip stock check, use branch from message if provided
 */
export async function handleWebPurchase(
  purchase: WebPurchase,
  conversation: WhatsAppConversation
): Promise<FunctionCallResult> {
  // Format items for display
  const itemsList = purchase.items.map(item => {
    const sizeDisplay = item.size && item.size !== 'N/A' ? ` (${item.size})` : ''
    const priceDisplay = item.unitPrice ? ` (${item.unitPrice} c/u)` : ''
    return `• ${item.quantity}x ${item.name || item.sku}${sizeDisplay}${priceDisplay}`
  }).join('\n')

  // If branch is provided in the message (from CheckoutModal), use it directly
  if (purchase.branchName) {
    const totalDisplay = purchase.total || 'A confirmar'
    return {
      response: `¡Hola! Recibí tu pedido para *${purchase.branchName}*:

${itemsList}

💰 *Total: ${totalDisplay}*

Un asesor te contactará en breve para coordinar el pago y la entrega.

¿Hay algo más en lo que pueda ayudarte?`,
      handled: true
    }
  }

  const totalDisplay = purchase.total || 'A confirmar'

  // Legacy fallback: If we already know the user's city, we can proceed
  if (conversation.user_city) {
    const branchCode = getBranchCodeFromCity(conversation.user_city)
    if (branchCode) {
      const branch = await getBranchByCode(branchCode)
      const branchName = branch?.name || conversation.user_city

      return {
        response: `¡Hola! Recibí tu pedido web:

${itemsList}

💰 *Total: ${totalDisplay}*

📍 Te atiende nuestra sucursal de *${branchName}*

¿Confirmamos el pedido? Un asesor te contactará para coordinar pago y entrega.`,
        handled: true
      }
    }
  }

  // Ask for location - the message history will contain the purchase details
  // so we don't need to store it separately
  await updateConversation(conversation.id, {
    conversation_state: 'awaiting_location'
  })

  return {
    response: `¡Hola! Recibí tu pedido web:

${itemsList}

💰 *Total: ${totalDisplay}*

¿Desde qué ciudad nos escribís? 📍`,
    handled: true
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Process a message using OpenAI function calling
 */
export async function processWithFunctionCalling(
  conversation: WhatsAppConversation,
  messageText: string,
  phoneNumber: string,
  messageHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<FunctionCallResult> {
  try {
    // Check for web purchase format first (from cart checkout)
    const webPurchase = parseWebPurchaseMessage(messageText)
    if (webPurchase) {
      console.log('[FunctionHandler] Detected web purchase:', webPurchase.type, webPurchase.items.length, 'items')
      return handleWebPurchase(webPurchase, conversation)
    }

    // Load dynamic configuration
    const systemPrompt = await buildSystemPromptDynamic(conversation)
    const tools = await getWhatsAppToolsDynamic()

    // Build messages array with context
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messageHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user', content: messageText }
    ]

    // Call OpenAI with function tools
    const response = await openai.chat.completions.create({
      model: models.chat,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: temperatures.balanced,
      max_tokens: 500
    })

    const choice = response.choices[0]
    const message = choice.message

    // Check if AI wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0]

      // Type guard for function tool calls
      if (toolCall.type === 'function') {
        const functionName = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments || '{}')

        console.log('[FunctionHandler] Function call:', functionName, args)

        // Execute the function
        const result = await executeFunction(
          functionName,
          args,
          conversation,
          phoneNumber
        )

        return {
          ...result,
          functionName
        }
      }
    }

    // No function call - return AI's text response
    const textResponse = message.content || 'Disculpá, no entendí. ¿Podés repetir?'
    return {
      response: cleanWhatsAppMessage(textResponse),
      handled: true
    }

  } catch (error) {
    console.error('[FunctionHandler] Error:', error)
    return {
      response: 'Hubo un error procesando tu mensaje. ¿Podés intentar de nuevo?',
      handled: true
    }
  }
}

/**
 * Build system prompt with current context (async, loads from config)
 */
async function buildSystemPromptDynamic(conversation: WhatsAppConversation): Promise<string> {
  // Load base prompt from configuration
  let prompt = await getWhatsAppSystemPromptDynamic()

  // Add pending appointment context if exists
  if (conversation.pending_appointment) {
    const pending = conversation.pending_appointment
    prompt += `\n\nCONTEXTO ACTUAL - TURNO EN PROGRESO:`

    if (pending.province) {
      prompt += `\n- Provincia: ${pending.province}`
    }
    if (pending.branch_name) {
      prompt += `\n- Sucursal: ${pending.branch_name}`
    }
    if (pending.selected_services.length > 0) {
      const serviceNames = pending.selected_services.map(id => {
        const s = getServiceById(id)
        return s?.name || id
      }).join(', ')
      prompt += `\n- Servicios: ${serviceNames}`
    }
    if (pending.preferred_date) {
      prompt += `\n- Fecha: ${pending.preferred_date}`
    }
    if (pending.preferred_time) {
      prompt += `\n- Hora: ${pending.preferred_time}`
    }
    if (pending.customer_name) {
      prompt += `\n- Nombre: ${pending.customer_name}`
    }

    // Determine what's missing
    const missing: string[] = []
    if (!pending.province) missing.push('provincia')
    if (!pending.branch_id) missing.push('sucursal')
    if (pending.selected_services.length === 0) missing.push('servicios')
    if (!pending.preferred_date) missing.push('fecha')
    if (!pending.preferred_time) missing.push('hora')
    if (!pending.customer_name) missing.push('nombre')

    if (missing.length > 0) {
      prompt += `\n\nFALTA: ${missing.join(', ')}`
      prompt += `\nPreguntá por lo que falta de forma natural.`
    } else {
      prompt += `\n\nTODO COMPLETO - Mostrá el resumen y pedí confirmación con confirm_appointment`
    }
  }

  // Add location context
  if (conversation.user_city) {
    prompt += `\n\nUbicación del usuario: ${conversation.user_city}`
  }

  return prompt
}

/**
 * Build system prompt with current context (legacy sync version, deprecated)
 * @deprecated Use buildSystemPromptDynamic instead
 */
function buildSystemPrompt(conversation: WhatsAppConversation): string {
  let prompt = WHATSAPP_SYSTEM_PROMPT

  // Add pending appointment context if exists
  if (conversation.pending_appointment) {
    const pending = conversation.pending_appointment
    prompt += `\n\nCONTEXTO ACTUAL - TURNO EN PROGRESO:`

    if (pending.province) {
      prompt += `\n- Provincia: ${pending.province}`
    }
    if (pending.branch_name) {
      prompt += `\n- Sucursal: ${pending.branch_name}`
    }
    if (pending.selected_services.length > 0) {
      const serviceNames = pending.selected_services.map(id => {
        const s = getServiceById(id)
        return s?.name || id
      }).join(', ')
      prompt += `\n- Servicios: ${serviceNames}`
    }
    if (pending.preferred_date) {
      prompt += `\n- Fecha: ${pending.preferred_date}`
    }
    if (pending.preferred_time) {
      prompt += `\n- Hora: ${pending.preferred_time}`
    }
    if (pending.customer_name) {
      prompt += `\n- Nombre: ${pending.customer_name}`
    }

    // Determine what's missing
    const missing: string[] = []
    if (!pending.province) missing.push('provincia')
    if (!pending.branch_id) missing.push('sucursal')
    if (pending.selected_services.length === 0) missing.push('servicios')
    if (!pending.preferred_date) missing.push('fecha')
    if (!pending.preferred_time) missing.push('hora')
    if (!pending.customer_name) missing.push('nombre')

    if (missing.length > 0) {
      prompt += `\n\nFALTA: ${missing.join(', ')}`
      prompt += `\nPreguntá por lo que falta de forma natural.`
    } else {
      prompt += `\n\nTODO COMPLETO - Mostrá el resumen y pedí confirmación con confirm_appointment`
    }
  }

  // Add location context
  if (conversation.user_city) {
    prompt += `\n\nUbicación del usuario: ${conversation.user_city}`
  }

  return prompt
}

// ============================================================================
// FUNCTION EXECUTORS
// ============================================================================

async function executeFunction(
  functionName: string,
  args: Record<string, unknown>,
  conversation: WhatsAppConversation,
  phoneNumber: string
): Promise<FunctionCallResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedArgs = args as any

  switch (functionName) {
    case 'book_appointment':
      return handleBookAppointment(typedArgs as BookAppointmentArgs, conversation, phoneNumber)

    case 'confirm_appointment':
      return handleConfirmAppointment(typedArgs as ConfirmAppointmentArgs, conversation, phoneNumber)

    case 'check_stock':
      return handleCheckStock(typedArgs as CheckStockArgs, conversation)

    case 'cancel_operation':
      return handleCancelOperation(typedArgs as CancelOperationArgs, conversation)

    case 'go_back':
      return handleGoBack(conversation)

    case 'show_help':
      return handleShowHelp(typedArgs as ShowHelpArgs)

    case 'request_human':
      return handleRequestHuman(typedArgs as RequestHumanArgs, conversation)

    default:
      return {
        response: 'No entendí qué necesitás. ¿Podés explicarme de otra forma?',
        handled: true
      }
  }
}

// ============================================================================
// BOOK APPOINTMENT HANDLER
// ============================================================================

export async function handleBookAppointment(
  args: BookAppointmentArgs,
  conversation: WhatsAppConversation,
  phoneNumber: string
): Promise<FunctionCallResult> {
  // Get or create pending appointment
  let pending: PendingAppointment = conversation.pending_appointment || {
    selected_services: [],
    customer_phone: phoneNumber,
    started_at: new Date().toISOString()
  }

  let response = ''
  let needsMoreInfo = false

  // Process province
  if (args.province && !pending.province) {
    pending.province = args.province
  }

  // Process branch
  if (args.branch_name && pending.province && !pending.branch_id) {
    const branches = await getBranchesByProvince(pending.province)
    const branch = branches.find(b =>
      b.name.toLowerCase().includes(args.branch_name!.toLowerCase())
    )
    if (branch) {
      pending.branch_id = branch.id
      pending.branch_name = branch.name
    }
  }

  // Process services
  if (args.services && args.services.length > 0) {
    for (const serviceId of args.services) {
      if (!pending.selected_services.includes(serviceId)) {
        pending.selected_services.push(serviceId)
      }
    }
  }

  // Process date
  if (args.preferred_date && !pending.preferred_date) {
    const parsedDate = parseNaturalDate(args.preferred_date)
    if (parsedDate) {
      pending.preferred_date = parsedDate
    }
  }

  // Process time
  if (args.preferred_time && !pending.preferred_time) {
    pending.preferred_time = args.preferred_time
  }

  // Process name
  if (args.customer_name && !pending.customer_name) {
    pending.customer_name = args.customer_name
  }

  // Determine what's missing and build response
  if (!pending.province) {
    needsMoreInfo = true
    response = `*Reservar Turno* 📅

¿En qué provincia te queda más cómodo?

${PROVINCES.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}`
  } else if (!pending.branch_id) {
    needsMoreInfo = true
    const branches = await getBranchesByProvince(pending.province)
    if (branches.length === 1) {
      // Auto-select if only one branch
      pending.branch_id = branches[0].id
      pending.branch_name = branches[0].name
    } else if (branches.length > 1) {
      response = `Sucursales en *${getProvinceName(pending.province)}*:

${branches.map((b, i) => `${i + 1}. ${b.name} - ${b.address}`).join('\n')}

¿Cuál te queda mejor?`
    } else {
      response = `No encontré sucursales en esa provincia. ¿Podés elegir otra?`
    }
  }

  if (!needsMoreInfo && pending.selected_services.length === 0) {
    needsMoreInfo = true
    const services = getServices()
    response = `¿Qué servicio necesitás?

${services.map((s, i) => `${i + 1}. *${s.name}* - ${formatPrice(s.price)}`).join('\n')}

_Podés elegir varios_`
  }

  if (!needsMoreInfo && !pending.preferred_date) {
    needsMoreInfo = true
    const dates = getAvailableDates()
    response = `¿Qué día te viene bien?

${dates.map((d, i) => `${i + 1}. ${d.dayName}`).join('\n')}`
  }

  if (!needsMoreInfo && !pending.preferred_time) {
    needsMoreInfo = true
    const slots = await getAvailableSlots(pending.branch_id!, pending.preferred_date!)

    if (slots.length === 0) {
      response = `No hay horarios disponibles para esa fecha. ¿Querés elegir otro día?`
      pending.preferred_date = undefined
    } else {
      const dateInfo = getAvailableDates().find(d => d.date === pending.preferred_date)
      response = `Horarios disponibles para ${dateInfo?.dayName}:

${formatTimeSlots(slots)}

¿A qué hora?`
    }
  }

  if (!needsMoreInfo && !pending.customer_name) {
    needsMoreInfo = true
    response = `Perfecto, casi listo.

¿A nombre de quién agendo el turno?`
  }

  // Save updated pending
  await updateConversation(conversation.id, {
    pending_appointment: pending,
    conversation_state: 'apt_confirm'
  })

  // If we have everything, show summary
  if (!needsMoreInfo) {
    response = buildAppointmentSummary(pending)
  }

  return {
    response,
    handled: true,
    updatedPending: pending
  }
}

// ============================================================================
// CONFIRM APPOINTMENT HANDLER
// ============================================================================

export async function handleConfirmAppointment(
  args: ConfirmAppointmentArgs,
  conversation: WhatsAppConversation,
  phoneNumber: string
): Promise<FunctionCallResult> {
  if (!args.confirmed) {
    await updateConversation(conversation.id, {
      pending_appointment: null,
      conversation_state: 'idle'
    })

    return {
      response: 'Turno cancelado. Si necesitás algo más, escribime.',
      handled: true,
      updatedPending: null
    }
  }

  const pending = conversation.pending_appointment
  if (!pending) {
    return {
      response: 'No hay un turno pendiente para confirmar. ¿Querés sacar uno nuevo?',
      handled: true
    }
  }

  // Create the appointment
  const result = await createWhatsAppAppointment(pending, phoneNumber)

  if (!result.success) {
    return {
      response: `Hubo un problema: ${result.error}\n\n¿Querés intentar de nuevo?`,
      handled: true
    }
  }

  // Clear pending and reset state
  await updateConversation(conversation.id, {
    pending_appointment: null,
    conversation_state: 'idle'
  })

  const [year, month, day] = (pending.preferred_date || '').split('-')
  const dateFormatted = `${day}/${month}/${year}`

  return {
    response: `*TURNO CONFIRMADO* ✅

Sucursal: *${pending.branch_name}*
Fecha: *${dateFormatted}*
Hora: *${pending.preferred_time}*

Te esperamos! Llegá 5 min antes.

Si necesitás cancelar o cambiar, escribime.`,
    handled: true,
    updatedPending: null
  }
}

// ============================================================================
// CHECK STOCK HANDLER
// ============================================================================

export async function handleCheckStock(
  args: CheckStockArgs,
  conversation: WhatsAppConversation
): Promise<FunctionCallResult> {
  const { width, profile, diameter, brand, city } = args

  // Validate that we have a complete tire size
  if (!width || !profile || !diameter) {
    console.log('[FunctionHandler] Incomplete tire size:', { width, profile, diameter })
    return {
      response: `Para buscar stock necesito la medida completa del neumático.

Por ejemplo: *205/55R16* o *185/65R15*

¿Cuál es la medida que necesitás?`,
      handled: true
    }
  }

  const sizeDisplay = `${width}/${profile}R${diameter}`

  console.log('[FunctionHandler] Stock check:', sizeDisplay, brand, city)

  // Determine branch
  let branchCode: string | undefined
  let branchId: string | undefined

  if (city) {
    branchCode = getBranchCodeFromCity(city) || undefined
    if (branchCode) {
      const branch = await getBranchByCode(branchCode)
      branchId = branch?.id
    }
  } else if (conversation.user_city) {
    branchCode = getBranchCodeFromCity(conversation.user_city) || undefined
    if (branchCode) {
      const branch = await getBranchByCode(branchCode)
      branchId = branch?.id
    }
  }

  // If no city, ask for it
  if (!branchCode) {
    // Save pending search
    await updateConversation(conversation.id, {
      conversation_state: 'awaiting_location',
      pending_tire_search: {
        width,
        profile,
        diameter,
        originalMessage: `${sizeDisplay}${brand ? ` ${brand}` : ''}`
      }
    })

    return {
      response: stockTemplates.askLocation(),
      handled: true
    }
  }

  // Search products
  const size = { width, profile, diameter }
  const products = await searchProductsWithStock(size, branchCode)
  const groups = groupProductsByAvailability(products)

  let response: string

  if (groups.available.length > 0) {
    response = stockTemplates.availableProducts(groups.available, branchCode, sizeDisplay)
  } else if (groups.lastUnits.length > 0) {
    response = stockTemplates.lastUnitsProducts(groups.lastUnits, branchCode, sizeDisplay)
  } else if (groups.singleUnit.length > 0) {
    const product = groups.singleUnit[0]
    const equivalents = await findEquivalentsWithStock(size, branchCode)
    const productIds = products.map(p => p.product_id)
    const otherBranches = await findBranchesWithStock(productIds, 2)
    response = stockTemplates.singleUnitWarning(product, branchCode, equivalents, otherBranches)
  } else {
    // Check equivalents
    const equivalents = await findEquivalentsWithStock(size, branchCode)
    if (equivalents.length > 0) {
      response = stockTemplates.noStockWithEquivalents(sizeDisplay, branchCode, equivalents)
    } else {
      // Check other branches
      const allProducts = await searchProductsWithStock(size)
      const productIds = allProducts.map(p => p.product_id)
      const otherBranches = await findBranchesWithStock(productIds, 2)

      if (otherBranches.length > 0) {
        response = stockTemplates.availableInOtherBranch(sizeDisplay, branchCode, otherBranches)
      } else {
        response = stockTemplates.noStockAnywhere(sizeDisplay)
      }
    }
  }

  return {
    response,
    handled: true
  }
}

// ============================================================================
// CANCEL OPERATION HANDLER
// ============================================================================

export async function handleCancelOperation(
  args: CancelOperationArgs,
  conversation: WhatsAppConversation
): Promise<FunctionCallResult> {
  await updateConversation(conversation.id, {
    pending_appointment: null,
    pending_tire_search: null,
    conversation_state: 'idle'
  })

  return {
    response: 'Listo, cancelado. ¿En qué más te puedo ayudar?',
    handled: true,
    updatedPending: null
  }
}

// ============================================================================
// GO BACK HANDLER
// ============================================================================

export async function handleGoBack(
  conversation: WhatsAppConversation
): Promise<FunctionCallResult> {
  const pending = conversation.pending_appointment

  if (!pending) {
    return {
      response: 'No hay nada para volver atrás. ¿En qué te puedo ayudar?',
      handled: true
    }
  }

  // Clear the last filled field
  let response = ''

  if (pending.customer_name) {
    pending.customer_name = undefined
    const dateInfo = getAvailableDates().find(d => d.date === pending.preferred_date)
    response = `OK. ¿A nombre de quién agendo?`
  } else if (pending.preferred_time) {
    pending.preferred_time = undefined
    const slots = await getAvailableSlots(pending.branch_id!, pending.preferred_date!)
    response = `OK. ¿A qué hora preferís?\n\n${formatTimeSlots(slots)}`
  } else if (pending.preferred_date) {
    pending.preferred_date = undefined
    const dates = getAvailableDates()
    response = `OK. ¿Qué día te viene bien?\n\n${dates.map((d, i) => `${i + 1}. ${d.dayName}`).join('\n')}`
  } else if (pending.selected_services.length > 0) {
    pending.selected_services = []
    const services = getServices()
    response = `OK. ¿Qué servicio necesitás?\n\n${services.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}`
  } else if (pending.branch_id) {
    pending.branch_id = undefined
    pending.branch_name = undefined
    const branches = await getBranchesByProvince(pending.province!)
    response = `OK. ¿Qué sucursal te queda mejor?\n\n${branches.map((b, i) => `${i + 1}. ${b.name}`).join('\n')}`
  } else if (pending.province) {
    pending.province = undefined
    response = `OK. ¿En qué provincia?\n\n${PROVINCES.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}`
  } else {
    await updateConversation(conversation.id, {
      pending_appointment: null,
      conversation_state: 'idle'
    })
    return {
      response: 'Reserva cancelada. ¿En qué más te puedo ayudar?',
      handled: true,
      updatedPending: null
    }
  }

  await updateConversation(conversation.id, {
    pending_appointment: pending
  })

  return {
    response,
    handled: true,
    updatedPending: pending
  }
}

// ============================================================================
// SHOW HELP HANDLER
// ============================================================================

export async function handleShowHelp(
  args: ShowHelpArgs
): Promise<FunctionCallResult> {
  let response: string

  switch (args.topic) {
    case 'services':
      const services = getServices()
      response = `*Nuestros Servicios:*

${services.map(s => `• *${s.name}* - ${formatPrice(s.price)} (${s.duration} min)`).join('\n')}

¿Te interesa alguno?`
      break

    case 'branches':
      response = `*Sucursales:*

📍 Catamarca
📍 Santiago del Estero (2 locales)
📍 Salta
📍 Tucumán

¿Querés saber la dirección de alguna?`
      break

    case 'hours':
      response = `*Horarios:*

Lunes a Viernes: 9:00 - 17:30
Sábados: 9:00 - 13:00
Domingos: Cerrado

¿Querés sacar turno?`
      break

    case 'prices':
      response = `Para precios de neumáticos, decime la medida (ej: 205/55R16).

Para servicios, escribí "servicios" y te muestro la lista con precios.`
      break

    default:
      response = `¡Hola! Soy el asistente de *Neumáticos del Valle*

Puedo ayudarte con:
• 🔍 Consultar stock y precios de neumáticos
• 📅 Sacar turno para servicios
• ℹ️ Info de sucursales y horarios

¿Qué necesitás?`
  }

  return {
    response,
    handled: true
  }
}

// ============================================================================
// REQUEST HUMAN HANDLER
// ============================================================================

async function handleRequestHuman(
  args: RequestHumanArgs,
  conversation: WhatsAppConversation
): Promise<FunctionCallResult> {
  // Pause the conversation for human takeover
  await pauseConversation(conversation.id, {
    pausedBy: 'system',
    reason: args.reason || 'Usuario solicitó hablar con un humano'
  })

  return {
    response: `Te paso con un asesor. Te va a responder en breve.

Mientras tanto, si querés dejar tu consulta, escribila acá.`,
    handled: true
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getProvinceName(provinceId: string): string {
  const province = PROVINCES.find(p => p.id === provinceId)
  return province?.name || provinceId
}

export function parseNaturalDate(input: string): string | null {
  const normalized = input.toLowerCase().trim()
  const today = new Date()

  // Handle relative dates
  if (normalized === 'hoy') {
    return formatDateISO(today)
  }

  if (normalized === 'mañana' || normalized === 'manana') {
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    return formatDateISO(tomorrow)
  }

  if (normalized === 'pasado mañana' || normalized === 'pasado manana') {
    const dayAfter = new Date(today)
    dayAfter.setDate(today.getDate() + 2)
    return formatDateISO(dayAfter)
  }

  // Handle day names
  const dayNames: Record<string, number> = {
    'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
  }

  for (const [dayName, dayNum] of Object.entries(dayNames)) {
    if (normalized.includes(dayName)) {
      const date = getNextDayOfWeek(dayNum)
      return formatDateISO(date)
    }
  }

  // Try YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized
  }

  // Try DD/MM format
  const ddmmMatch = normalized.match(/(\d{1,2})\/(\d{1,2})/)
  if (ddmmMatch) {
    const day = parseInt(ddmmMatch[1])
    const month = parseInt(ddmmMatch[2]) - 1
    const date = new Date(today.getFullYear(), month, day)
    if (date < today) {
      date.setFullYear(date.getFullYear() + 1)
    }
    return formatDateISO(date)
  }

  return null
}

export function getNextDayOfWeek(dayOfWeek: number): Date {
  const today = new Date()
  const currentDay = today.getDay()
  let daysToAdd = dayOfWeek - currentDay

  if (daysToAdd <= 0) {
    daysToAdd += 7
  }

  const result = new Date(today)
  result.setDate(today.getDate() + daysToAdd)
  return result
}

export function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimeSlots(slots: string[]): string {
  const rows: string[] = []
  for (let i = 0; i < slots.length; i += 4) {
    const row = slots.slice(i, i + 4).join(' | ')
    rows.push(row)
  }
  return rows.join('\n')
}

function buildAppointmentSummary(pending: PendingAppointment): string {
  const serviceList = pending.selected_services.map(id => {
    const s = getServiceById(id)
    return s ? `• ${s.name} - ${formatPrice(s.price)}` : null
  }).filter(Boolean).join('\n')

  const total = pending.selected_services.reduce((sum, id) => {
    const s = getServiceById(id)
    return sum + (s?.price || 0)
  }, 0)

  const [year, month, day] = (pending.preferred_date || '').split('-')
  const dateFormatted = `${day}/${month}/${year}`

  return `*Resumen de tu turno:*

📍 Sucursal: *${pending.branch_name}*
📅 Fecha: *${dateFormatted}*
🕐 Hora: *${pending.preferred_time}*
👤 Nombre: *${pending.customer_name}*

*Servicios:*
${serviceList}

💰 *Total estimado: ${formatPrice(total)}*

¿Confirmamos? Escribí *CONFIRMAR* o *cancelar*`
}

function cleanWhatsAppMessage(text: string): string {
  // Remove markdown that doesn't work well in WhatsApp
  let cleaned = text
    .replace(/#{1,6}\s*/g, '')  // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '*$1*')  // Convert bold to single asterisk

  // Truncate if too long
  if (cleaned.length > 1500) {
    cleaned = cleaned.slice(0, 1497) + '...'
  }

  return cleaned.trim()
}
