import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

interface ExecutionSummary {
  id: string
  workflowId: string
  status: 'completed' | 'failed'
  startedAt: string
  completedAt: string
  duration: number
  intent?: string
}

interface MessageRow {
  id: string
  conversation_id: string
  role: string
  intent: string | null
  response_time_ms: number | null
  created_at: string
  provider: string | null
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const workflowId = searchParams.get('workflow')

    // Get recent messages to infer executions
    // Each user message followed by assistant message = 1 execution
    let query = supabaseAdmin
      .from('kommo_messages')
      .select(`
        id,
        conversation_id,
        role,
        intent,
        response_time_ms,
        created_at,
        provider
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 2) // Get more to pair user/assistant messages

    // Filter by workflow (provider)
    if (workflowId === 'kommo-webhook') {
      query = query.eq('provider', 'kommo')
    } else if (workflowId === 'twilio-webhook') {
      query = query.eq('provider', 'twilio')
    }

    const { data, error } = await query

    if (error) {
      console.error('[History] Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    // Cast to typed array
    const messages = (data || []) as MessageRow[]

    // Group messages into executions (user + assistant pairs)
    const executions: ExecutionSummary[] = []
    const processedIds = new Set<string>()

    for (const message of messages) {
      if (message.role === 'assistant' && !processedIds.has(message.conversation_id)) {
        // Find the corresponding user message
        const userMessage = messages.find(
          m => m.conversation_id === message.conversation_id &&
               m.role === 'user' &&
               new Date(m.created_at) < new Date(message.created_at)
        )

        if (userMessage) {
          const startTime = new Date(userMessage.created_at)
          const endTime = new Date(message.created_at)

          executions.push({
            id: `exec_${message.id}`,
            workflowId: message.provider === 'twilio' ? 'twilio-webhook' : 'kommo-webhook',
            status: 'completed',
            startedAt: startTime.toISOString(),
            completedAt: endTime.toISOString(),
            duration: message.response_time_ms || (endTime.getTime() - startTime.getTime()),
            intent: userMessage.intent || undefined
          })

          processedIds.add(message.conversation_id)
        }
      }

      if (executions.length >= limit) break
    }

    return NextResponse.json({
      executions,
      total: executions.length
    })

  } catch (error) {
    console.error('[History] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
