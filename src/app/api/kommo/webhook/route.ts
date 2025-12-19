import { NextRequest, NextResponse } from 'next/server'

// Tipos base de Kommo
interface KommoLead {
  id: number
  name: string
  price?: number
  responsible_user_id?: number
  status_id?: number
  pipeline_id?: number
  created_at?: number
  updated_at?: number
  account_id?: number
}

interface KommoContact {
  id: number
  name?: string
  phone?: string
  email?: string
  created_at?: number
  updated_at?: number
}

// Tipos de eventos de Kommo según la documentación
interface KommoWebhook {
  leads?: {
    status?: Array<{
      id: number
      name: string
      price: number
      responsible_user_id: number
      status_id: number
      pipeline_id: number
      created_at: number
      updated_at: number
      account_id: number
    }>
    add?: Array<KommoLead>
    update?: Array<KommoLead>
    delete?: Array<{ id: number }>
  }
  contacts?: {
    add?: Array<KommoContact>
    update?: Array<KommoContact>
    delete?: Array<{ id: number }>
  }
  account?: {
    subdomain: string
    id: string
    _links: {
      self: string
    }
  }
  // Mensajes de chat (WhatsApp, Instagram, etc.)
  message?: {
    add?: Array<{
      id: string
      chat_id: string
      contact_id: number
      text: string
      created_at: number
      origin: string // 'whatsapp', 'instagram', etc.
      author?: {
        id: number
        name: string
        type: string // 'contact' o 'user'
      }
    }>
  }
  // Notas (incluye mensajes internos y de chat)
  notes?: {
    add?: Array<{
      id: number
      entity_id: number
      created_at: number
      updated_at: number
      responsible_user_id: number
      group_id: number
      note_type: string
      params?: {
        text?: string
        service?: string // 'whatsapp', 'instagram', etc.
        phone?: string
      }
    }>
    update?: Array<{
      id: number
      entity_id: number
      created_at: number
      updated_at: number
      responsible_user_id: number
      group_id: number
      note_type: string
      params?: {
        text?: string
        service?: string
        phone?: string
      }
    }>
  }
  // Eventos de chat
  chat?: {
    message?: Array<{
      timestamp: number
      msgid: string
      conversation_id: string
      sender: {
        id: string
        name: string
        phone?: string
      }
      message: {
        type: string // 'text', 'image', etc.
        text?: string
        caption?: string
      }
      receiver?: {
        id: string
        phone: string
      }
    }>
  }
}

// Webhook endpoint para recibir eventos de Kommo
export async function POST(request: NextRequest) {
  try {
    // Log para ver que llegó el webhook
    console.log('\n' + '='.repeat(60))
    console.log('🔔 WEBHOOK RECIBIDO DE KOMMO')
    console.log('Timestamp:', new Date().toISOString())
    console.log('='.repeat(60))

    // Obtener el body del request
    const body = await request.json() as KommoWebhook

    // Log del account info si está disponible
    if (body.account) {
      console.log('📍 Account Info:')
      console.log('  - Subdomain:', body.account.subdomain)
      console.log('  - Account ID:', body.account.id)
    }

    // Procesar eventos de LEADS
    if (body.leads) {
      console.log('\n📊 EVENTOS DE LEADS:')

      // Nuevos leads
      if (body.leads.add && body.leads.add.length > 0) {
        console.log(`  ✅ ${body.leads.add.length} nuevo(s) lead(s) agregado(s)`)
        body.leads.add.forEach((lead) => {
          console.log(`     - Lead ID: ${lead.id}, Nombre: ${lead.name}`)
        })
      }

      // Leads actualizados
      if (body.leads.update && body.leads.update.length > 0) {
        console.log(`  🔄 ${body.leads.update.length} lead(s) actualizado(s)`)
        body.leads.update.forEach((lead) => {
          console.log(`     - Lead ID: ${lead.id}, Nombre: ${lead.name}`)
        })
      }

      // Cambios de estado
      if (body.leads.status && body.leads.status.length > 0) {
        console.log(`  🎯 ${body.leads.status.length} cambio(s) de estado`)
        body.leads.status.forEach((lead) => {
          console.log(`     - Lead: ${lead.name}`)
          console.log(`       Precio: $${lead.price}`)
          console.log(`       Estado ID: ${lead.status_id}`)
          console.log(`       Pipeline ID: ${lead.pipeline_id}`)
        })
      }
    }

    // Procesar eventos de CONTACTOS
    if (body.contacts) {
      console.log('\n👥 EVENTOS DE CONTACTOS:')

      if (body.contacts.add && body.contacts.add.length > 0) {
        console.log(`  ✅ ${body.contacts.add.length} nuevo(s) contacto(s)`)
      }

      if (body.contacts.update && body.contacts.update.length > 0) {
        console.log(`  🔄 ${body.contacts.update.length} contacto(s) actualizado(s)`)
      }
    }

    // PROCESAR MENSAJES DE WHATSAPP
    if (body.message?.add && body.message.add.length > 0) {
      console.log('\n💬 MENSAJES DE CHAT:')
      for (const msg of body.message.add) {
        if (msg.origin === 'whatsapp') {
          console.log('  📱 WhatsApp mensaje recibido!')
          console.log(`     - De: ${msg.author?.name || 'Desconocido'}`)
          console.log(`     - Texto: "${msg.text}"`)
          console.log(`     - Chat ID: ${msg.chat_id}`)
          console.log(`     - Contact ID: ${msg.contact_id}`)

          // TODO: Aquí procesaremos el mensaje con IA
          console.log('\n  🤖 TODO: Procesar con IA y responder...')
        } else {
          console.log(`  📧 Mensaje de ${msg.origin}: ${msg.text}`)
        }
      }
    }

    // PROCESAR NOTAS (otro formato de mensajes)
    if (body.notes?.add && body.notes.add.length > 0) {
      console.log('\n📝 NOTAS/MENSAJES:')
      for (const note of body.notes.add) {
        if (note.params?.service === 'whatsapp') {
          console.log('  📱 WhatsApp (via notas):')
          console.log(`     - Texto: "${note.params.text}"`)
          console.log(`     - Teléfono: ${note.params.phone}`)
          console.log(`     - Entity ID: ${note.entity_id}`)
        }
      }
    }

    // PROCESAR EVENTOS DE CHAT (otro posible formato)
    if (body.chat?.message && body.chat.message.length > 0) {
      console.log('\n💬 EVENTOS DE CHAT:')
      for (const chat of body.chat.message) {
        console.log('  📱 Mensaje de chat:')
        console.log(`     - De: ${chat.sender.name} (${chat.sender.phone || 'Sin teléfono'})`)
        console.log(`     - Texto: "${chat.message.text}"`)
        console.log(`     - Conversation ID: ${chat.conversation_id}`)

        // TODO: Procesar con IA
        console.log('\n  🤖 TODO: Procesar con IA y responder...')
      }
    }

    // Log del payload completo para debugging
    console.log('\n📋 Payload completo (JSON):')
    console.log(JSON.stringify(body, null, 2))

    // TODO: Aquí procesaremos los eventos con IA
    // Por ejemplo, si es un nuevo lead o mensaje, consultar productos y responder

    // Respuesta exitosa
    const response = {
      status: 'success',
      message: 'Webhook procesado correctamente',
      timestamp: new Date().toISOString(),
      processed: {
        leads: body.leads ? Object.keys(body.leads).filter(k => {
          const value = body.leads?.[k as keyof typeof body.leads]
          return Array.isArray(value) && value.length > 0
        }) : [],
        contacts: body.contacts ? Object.keys(body.contacts).filter(k => {
          const value = body.contacts?.[k as keyof typeof body.contacts]
          return Array.isArray(value) && value.length > 0
        }) : []
      }
    }

    console.log('\n✅ Webhook procesado exitosamente')
    console.log('='.repeat(60) + '\n')

    // Responder con 200 OK para confirmar recepción
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('\n❌ ERROR PROCESANDO WEBHOOK:')
    console.error(error)
    console.error('='.repeat(60) + '\n')

    // Responder con 200 para evitar reintentos de Kommo
    return NextResponse.json(
      {
        status: 'error',
        message: 'Error procesando webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 } // Importante: siempre 200 para Kommo
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    service: 'Kommo Webhook Receiver',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}