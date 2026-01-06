'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  Zap,
  Play,
  HelpCircle,
  Database,
  Brain,
  Globe,
  Square,
  Check,
  X,
  type LucideIcon
} from 'lucide-react'
import type { NodeStatus, NodeType } from '../types'
import { NodeStatusBadge } from './NodeStatusBadge'

// Node data structure passed from React Flow
export interface WorkflowNodeData {
  label: string
  description?: string
  icon?: string
  nodeType: NodeType
  status: NodeStatus
}

// Props for the component (React Flow v12 passes data directly)
interface WorkflowNodeProps {
  data: WorkflowNodeData
  selected?: boolean
}

// Icon mapping for each node type
const nodeTypeIcons: Record<NodeType, LucideIcon> = {
  trigger: Zap,
  action: Play,
  condition: HelpCircle,
  database: Database,
  ai: Brain,
  http: Globe,
  end: Square
}

// Color scheme for each node type
const nodeTypeColors: Record<NodeType, { bg: string; border: string; iconBg: string }> = {
  trigger: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
  },
  action: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-300 dark:border-blue-700',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
  },
  condition: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-300 dark:border-purple-700',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
  },
  database: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
  },
  ai: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-300 dark:border-pink-700',
    iconBg: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400'
  },
  http: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-300 dark:border-cyan-700',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400'
  },
  end: {
    bg: 'bg-gray-50 dark:bg-gray-950/30',
    border: 'border-gray-300 dark:border-gray-700',
    iconBg: 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400'
  }
}

// Status-based border and glow effects
const statusStyles: Record<NodeStatus, string> = {
  idle: '',
  running: 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900 animate-pulse-ring',
  success: 'ring-2 ring-green-400 ring-offset-2 dark:ring-offset-gray-900',
  error: 'ring-2 ring-red-400 ring-offset-2 dark:ring-offset-gray-900'
}

function WorkflowNodeComponent({ data }: WorkflowNodeProps) {
  const { label, description, nodeType, status } = data
  const Icon = nodeTypeIcons[nodeType]
  const colors = nodeTypeColors[nodeType]

  const isTrigger = nodeType === 'trigger'
  const isEnd = nodeType === 'end'

  return (
    <>
      {/* Input handle - not shown for trigger nodes */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-gray-400 dark:!bg-gray-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}

      {/* Main node container */}
      <div
        className={`
          relative min-w-[180px] max-w-[220px] rounded-lg border-2 shadow-md
          transition-all duration-200 ease-in-out
          ${colors.bg} ${colors.border}
          ${statusStyles[status]}
          hover:shadow-lg hover:scale-[1.02]
        `}
      >
        {/* Status badge - top right corner */}
        {status !== 'idle' && (
          <div className="absolute -top-2 -right-2 z-10">
            <NodeStatusBadge status={status} />
          </div>
        )}

        {/* Status overlay icons for success/error */}
        {status === 'success' && (
          <div className="absolute -top-1 -right-1 z-20 bg-green-500 rounded-full p-0.5 animate-bounce-once">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute -top-1 -right-1 z-20 bg-red-500 rounded-full p-0.5 animate-shake">
            <X className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Node content */}
        <div className="p-3">
          <div className="flex items-start gap-3">
            {/* Icon container */}
            <div className={`flex-shrink-0 p-2 rounded-lg ${colors.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {label}
              </h3>
              {description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Running indicator bar at bottom */}
        {status === 'running' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-200 dark:bg-blue-900 rounded-b-lg overflow-hidden">
            <div className="h-full bg-blue-500 animate-progress" />
          </div>
        )}
      </div>

      {/* Output handle - not shown for end nodes */}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-gray-400 dark:!bg-gray-500 !border-2 !border-white dark:!border-gray-800"
        />
      )}

      {/* Inline styles for custom animations */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
            width: 50%;
          }
          50% {
            width: 30%;
          }
          100% {
            transform: translateX(250%);
            width: 50%;
          }
        }

        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }

        .animate-pulse-ring {
          animation: pulse-ring 1.5s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .animate-bounce-once {
          animation: bounce-once 0.3s ease-in-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </>
  )
}

// Memoize to prevent unnecessary re-renders
export const WorkflowNode = memo(WorkflowNodeComponent)

// Export node types for React Flow registration
export const nodeTypes = {
  workflowNode: WorkflowNode
}
