import { useEffect, useCallback, useRef } from 'react'
import { useWorkflowStore } from './useWorkflowStore'
import type { WorkflowEvent } from '../types'

interface UseWorkflowEventsOptions {
  autoConnect?: boolean
}

export function useWorkflowEvents(options: UseWorkflowEventsOptions = {}) {
  const { autoConnect = true } = options

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    processEvent,
    setConnected,
    isConnected
  } = useWorkflowStore()

  const connect = useCallback(() => {
    // Will be implemented in Wave 4 - connection to SSE endpoint
    if (typeof window === 'undefined') return

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource('/api/automations/events')
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('[AutomationEvents] Connected to SSE')
        setConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WorkflowEvent
          processEvent(data)
        } catch (error) {
          console.error('[AutomationEvents] Failed to parse event:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[AutomationEvents] Connection error:', error)
        setConnected(false)
        eventSource.close()

        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[AutomationEvents] Attempting reconnection...')
          connect()
        }, 5000)
      }
    } catch (error) {
      console.error('[AutomationEvents] Failed to connect:', error)
      setConnected(false)
    }
  }, [processEvent, setConnected])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
  }, [setConnected])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    connect,
    disconnect
  }
}
