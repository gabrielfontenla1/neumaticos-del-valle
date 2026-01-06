'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import {
  Webhook,
  Shield,
  FileText,
  Database,
  Brain,
  Search,
  BookOpen,
  Sparkles,
  Save,
  Send,
  Check,
  X,
  Split,
  Play,
  HelpCircle,
  Building,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { useWorkflowStore } from '../hooks/useWorkflowStore'
import type { NodeType, NodeStatus } from '../types'

export interface AutomationNodeData {
  id: string
  label: string
  description?: string
  icon?: string
  nodeType: NodeType
  status: NodeStatus
  typeColor: string
  statusColor: string
}

interface AutomationNodeProps {
  data: AutomationNodeData
  selected?: boolean
}

const iconMap: Record<string, React.ElementType> = {
  webhook: Webhook,
  shield: Shield,
  extract: FileText,
  database: Database,
  brain: Brain,
  search: Search,
  book: BookOpen,
  sparkles: Sparkles,
  save: Save,
  send: Send,
  check: Check,
  x: X,
  split: Split,
  play: Play,
  help: HelpCircle,
  building: Building,
  calendar: Calendar,
  clock: Clock,
  'check-circle': CheckCircle,
}

function AutomationNodeComponent({ data }: AutomationNodeProps) {
  const { id, label, description, icon, nodeType, status, typeColor, statusColor } = data
  const selectedNodeId = useWorkflowStore(state => state.selectedNodeId)

  const IconComponent = icon ? iconMap[icon] : null
  const isRunning = status === 'running'
  const isSelected = selectedNodeId === id

  const borderColor = status === 'idle' ? typeColor : statusColor
  const glowStyle = status !== 'idle' ? {
    boxShadow: `0 0 12px 2px ${statusColor}40`,
  } : {}

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-[#d97757] ring-offset-2 ring-offset-[#1a1a18] rounded-lg' : ''
      }`}
      style={glowStyle}
    >
      <div
        className="rounded-lg border-2 bg-[#262624] px-3 py-2 w-[160px] transition-all duration-200"
        style={{ borderColor }}
      >
        {nodeType !== 'trigger' && (
          <Handle
            type="target"
            position={Position.Left}
            className="!w-3 !h-3 !bg-[#4b5563] !border-2 !border-[#262624]"
          />
        )}

        <div className="flex items-start gap-2">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${typeColor}20` }}
          >
            {isRunning ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                style={{ color: statusColor }}
              />
            ) : IconComponent ? (
              <IconComponent
                className="h-3.5 w-3.5"
                style={{ color: typeColor }}
              />
            ) : (
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: typeColor }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate leading-tight">
              {label}
            </p>
            {description && (
              <p className="text-[10px] text-gray-500 truncate leading-tight">
                {description}
              </p>
            )}
          </div>
        </div>

        {status !== 'idle' && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#262624]"
            style={{ backgroundColor: statusColor }}
          />
        )}

        {nodeType !== 'end' && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-[#4b5563] !border-2 !border-[#262624]"
          />
        )}
      </div>
    </div>
  )
}

export const AutomationNode = memo(AutomationNodeComponent)
