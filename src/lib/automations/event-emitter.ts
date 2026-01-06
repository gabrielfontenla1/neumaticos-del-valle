/**
 * Singleton Event Emitter for Automation Events
 * Allows emitting events from webhooks and subscribing from SSE endpoint
 */

export type NodeStatus = 'idle' | 'running' | 'success' | 'error'

export interface AutomationEvent {
  workflowId: string
  nodeId: string
  executionId: string
  status: NodeStatus
  timestamp: Date
  data?: {
    input?: unknown
    output?: unknown
    duration?: number
    error?: string
  }
}

type EventHandler = (event: AutomationEvent) => void

class AutomationEventEmitter {
  private subscribers: Set<EventHandler> = new Set()
  private eventBuffer: AutomationEvent[] = []
  private maxBufferSize = 100

  /**
   * Emit an automation event to all subscribers
   */
  emit(event: AutomationEvent): void {
    // Add to buffer for replay
    this.eventBuffer.push(event)
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift()
    }

    // Notify all subscribers
    this.subscribers.forEach(handler => {
      try {
        handler(event)
      } catch (error) {
        console.error('[AutomationEvents] Handler error:', error)
      }
    })
  }

  /**
   * Subscribe to automation events
   * Returns unsubscribe function
   */
  subscribe(handler: EventHandler): () => void {
    this.subscribers.add(handler)
    return () => {
      this.subscribers.delete(handler)
    }
  }

  /**
   * Get recent events (for replay on connect)
   */
  getRecentEvents(count: number = 20): AutomationEvent[] {
    return this.eventBuffer.slice(-count)
  }

  /**
   * Get subscriber count (for debugging)
   */
  getSubscriberCount(): number {
    return this.subscribers.size
  }

  /**
   * Clear event buffer
   */
  clearBuffer(): void {
    this.eventBuffer = []
  }
}

// Singleton instance using globalThis to persist across API routes in Next.js
// This is necessary because Next.js/Turbopack may create separate module instances
const globalForEvents = globalThis as unknown as {
  __automationEvents: AutomationEventEmitter | undefined
}

if (!globalForEvents.__automationEvents) {
  globalForEvents.__automationEvents = new AutomationEventEmitter()
}

export const automationEvents = globalForEvents.__automationEvents

/**
 * Helper function to emit workflow events with consistent structure
 */
export function emitWorkflowEvent(
  workflowId: string,
  nodeId: string,
  status: NodeStatus,
  executionId: string,
  data?: AutomationEvent['data']
): void {
  automationEvents.emit({
    workflowId,
    nodeId,
    executionId,
    status,
    timestamp: new Date(),
    data
  })
}

/**
 * Helper to create execution ID
 */
export function createExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
