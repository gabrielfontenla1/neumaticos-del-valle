'use client'

import type { NodeStatus } from '../types'

interface NodeStatusBadgeProps {
  status: NodeStatus
  className?: string
}

const statusConfig: Record<NodeStatus, { label: string; bgColor: string; textColor: string }> = {
  idle: {
    label: 'Idle',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-500 dark:text-gray-400'
  },
  running: {
    label: 'Running',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  success: {
    label: 'Success',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    textColor: 'text-green-600 dark:text-green-400'
  },
  error: {
    label: 'Error',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    textColor: 'text-red-600 dark:text-red-400'
  }
}

export function NodeStatusBadge({ status, className = '' }: NodeStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`
        inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium
        ${config.bgColor} ${config.textColor}
        ${status === 'running' ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {status === 'running' && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
      )}
      {config.label}
    </span>
  )
}
