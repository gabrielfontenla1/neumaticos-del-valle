import { automationEvents } from '@/lib/automations/event-emitter'
import type { AutomationEvent } from '@/lib/automations/event-emitter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let heartbeatInterval: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`)
      )

      // Send recent events for replay
      const recentEvents = automationEvents.getRecentEvents(10)
      recentEvents.forEach(event => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        )
      })

      // Subscribe to new events
      unsubscribe = automationEvents.subscribe((event: AutomationEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          )
        } catch (error) {
          // Stream might be closed
          console.error('[SSE] Failed to send event:', error)
        }
      })

      // Heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`)
          )
        } catch (error) {
          // Stream closed, cleanup will happen in cancel
        }
      }, 30000)
    },

    cancel() {
      // Cleanup on client disconnect
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
      console.log('[SSE] Client disconnected')
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
