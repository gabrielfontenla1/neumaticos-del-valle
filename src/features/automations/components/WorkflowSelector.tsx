'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Webhook,
  Phone,
  CalendarClock,
  CircleDot,
} from 'lucide-react'
import { useWorkflowStore } from '../hooks/useWorkflowStore'
import { workflowList } from '../definitions'
import type { WorkflowDefinition } from '../types'

const workflowIcons: Record<string, React.ElementType> = {
  'kommo-webhook': Webhook,
  'twilio-webhook': Phone,
  'appointment-flow': CalendarClock,
}

export function WorkflowSelector() {
  const { activeWorkflow, setActiveWorkflow, isConnected } = useWorkflowStore()

  const handleSelect = (workflow: WorkflowDefinition) => {
    setActiveWorkflow(workflow)
  }

  return (
    <div className="w-52 bg-[#262624] border-r border-[#3a3a37] flex flex-col">
      <div className="p-3 border-b border-[#3a3a37]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-[#d97757]" />
            Workflows
          </h2>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-500'
              }`}
            />
            <span className="text-[10px] text-gray-500">
              {isConnected ? 'Live' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {workflowList.map((workflow) => {
            const Icon = workflowIcons[workflow.id] || Webhook
            const isActive = activeWorkflow?.id === workflow.id
            const nodeCount = workflow.nodes.length

            return (
              <button
                key={workflow.id}
                onClick={() => handleSelect(workflow)}
                className={`w-full p-2 rounded-lg text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-[#d97757]/20 border border-[#d97757]/50'
                    : 'hover:bg-[#2a2a28] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-[#d97757]/30'
                        : 'bg-[#3a3a37]'
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive ? 'text-[#d97757]' : 'text-gray-400'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        isActive ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {workflow.name}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      isActive
                        ? 'border-[#d97757]/50 text-[#d97757]'
                        : 'border-[#3a3a37] text-gray-500'
                    }`}
                  >
                    {nodeCount}
                  </Badge>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-[#3a3a37] text-[10px] text-gray-500 text-center">
        {workflowList.length} flujos
      </div>
    </div>
  )
}
