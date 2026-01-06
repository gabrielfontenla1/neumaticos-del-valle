'use client'

import { useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react'
import { useWorkflowStore } from '../hooks/useWorkflowStore'
import type { NodeStatus } from '../types'

function getStatusBadge(status: NodeStatus) {
  switch (status) {
    case 'running':
      return {
        icon: Loader2,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        label: 'Ejecutando',
        animate: true,
      }
    case 'success':
      return {
        icon: CheckCircle,
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        label: 'Exito',
        animate: false,
      }
    case 'error':
      return {
        icon: XCircle,
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        label: 'Error',
        animate: false,
      }
    default:
      return {
        icon: Clock,
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        label: 'Idle',
        animate: false,
      }
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function ExecutionTimeline() {
  const { recentExecutions, activeWorkflow } = useWorkflowStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  const allEvents = recentExecutions
    .filter((exec) => !activeWorkflow || exec.workflowId === activeWorkflow.id)
    .flatMap((exec) => exec.nodeEvents)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)

  useEffect(() => {
    if (scrollRef.current && allEvents.length > 0) {
      scrollRef.current.scrollLeft = 0
    }
  }, [allEvents.length])

  return (
    <div className="h-20 bg-[#262624] border-t border-[#3a3a37] flex flex-col">
      <div className="px-3 py-1.5 border-b border-[#3a3a37] flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-[#d97757]" />
        <span className="text-xs font-medium text-white">
          Eventos
        </span>
        <Badge
          variant="outline"
          className="ml-auto text-[10px] px-1.5 py-0 h-4 border-[#3a3a37] text-gray-500"
        >
          {allEvents.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        {allEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <Clock className="h-4 w-4 mr-2" />
            Sin eventos recientes
          </div>
        ) : (
          <div className="flex gap-2 p-3">
            {allEvents.map((event, index) => {
              const badge = getStatusBadge(event.status)
              const Icon = badge.icon
              const timestamp = new Date(event.timestamp)

              return (
                <div
                  key={`${event.executionId}-${event.nodeId}-${index}`}
                  className="flex-shrink-0 bg-[#1a1a18] rounded border border-[#3a3a37] px-2 py-1.5 min-w-[120px]"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`h-3 w-3 ${badge.animate ? 'animate-spin' : ''}`}
                      style={{
                        color: event.status === 'running'
                          ? '#3b82f6'
                          : event.status === 'success'
                          ? '#22c55e'
                          : event.status === 'error'
                          ? '#ef4444'
                          : '#6b7280',
                      }}
                    />
                    <p className="text-[10px] font-medium text-white truncate flex-1">
                      {event.nodeId}
                    </p>
                    <span className="text-[9px] text-gray-500">
                      {formatTime(timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
