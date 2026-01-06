'use client'

import { useEffect, useRef } from 'react'
import { X, Clock, Zap, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Cpu } from 'lucide-react'
import { useWorkflowStore } from '../hooks/useWorkflowStore'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { NodeType } from '../types'

function getNodeTypeLabel(type: NodeType): string {
  switch (type) {
    case 'trigger': return 'Trigger'
    case 'action': return 'Accion'
    case 'condition': return 'Condicion'
    case 'database': return 'Base de Datos'
    case 'ai': return 'IA'
    case 'http': return 'HTTP'
    case 'end': return 'Fin'
    default: return type
  }
}

function getNodeTypeColor(type: NodeType): string {
  switch (type) {
    case 'trigger': return '#8b5cf6'
    case 'action': return '#3b82f6'
    case 'condition': return '#f59e0b'
    case 'database': return '#10b981'
    case 'ai': return '#ec4899'
    case 'http': return '#06b6d4'
    case 'end': return '#6b7280'
    default: return '#6b7280'
  }
}

export function NodeDetailsPanel() {
  const { activeWorkflow, selectedNodeId, clearSelection } = useWorkflowStore()
  const panelRef = useRef<HTMLDivElement>(null)

  const isOpen = !!(selectedNodeId && activeWorkflow)
  const node = isOpen ? activeWorkflow.nodes.find(n => n.id === selectedNodeId) : null

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        clearSelection()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, clearSelection])

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return

      const target = event.target as HTMLElement

      // Don't close if clicking inside the panel
      if (panelRef.current && panelRef.current.contains(target)) {
        return
      }

      // Don't close if clicking on a node (data-node-id attribute or inside .react-flow__node)
      if (target.closest('.react-flow__node') || target.closest('[data-node-id]')) {
        return
      }

      clearSelection()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, clearSelection])

  const details = node?.details
  const typeColor = node ? getNodeTypeColor(node.type) : '#6b7280'

  return (
    <div
      ref={panelRef}
      className={`absolute right-0 top-0 bottom-0 w-80 bg-[#262624] border-l border-[#3a3a37] shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out ${
        isOpen && node ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {node && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-[#3a3a37]">
            <div className="flex-1 min-w-0 mr-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {node.label}
              </h3>
              <Badge
                className="mt-1 text-[10px] px-2 py-0.5"
                style={{
                  backgroundColor: `${typeColor}20`,
                  color: typeColor,
                  borderColor: typeColor,
                }}
              >
                {getNodeTypeLabel(node.type)}
              </Badge>
            </div>
            <button
              onClick={clearSelection}
              className="flex-shrink-0 p-1 rounded hover:bg-[#3a3a37] transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Description */}
              {details?.longDescription && (
                <div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {details.longDescription}
                  </p>
                </div>
              )}

              {/* Technology */}
              {details?.technology && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Cpu className="h-3 w-3" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Tecnologia</span>
                  </div>
                  <div className="bg-[#1a1a18] rounded-md p-2.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className="text-[10px] px-2 py-0.5 bg-[#d97757]/20 text-[#d97757] border-[#d97757]"
                      >
                        {details.technology.name}
                      </Badge>
                      {details.technology.method && (
                        <Badge
                          className="text-[10px] px-2 py-0.5 bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]"
                        >
                          {details.technology.method}
                        </Badge>
                      )}
                    </div>
                    {details.technology.endpoint && (
                      <p className="text-[10px] text-gray-500 font-mono truncate">
                        {details.technology.endpoint}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Duration */}
              {details?.typicalDuration && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">Duracion:</span>
                  <span className="text-xs text-gray-300">{details.typicalDuration}</span>
                </div>
              )}

              {/* Accordion for Inputs, Outputs, Errors */}
              <Accordion type="multiple" className="space-y-1" defaultValue={['inputs', 'outputs']}>
                {/* Inputs */}
                {details?.inputs && details.inputs.length > 0 && (
                  <AccordionItem value="inputs" className="border-[#3a3a37]">
                    <AccordionTrigger className="py-2 text-xs hover:no-underline">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <ArrowDownToLine className="h-3 w-3 text-green-500" />
                        <span className="font-medium">Entradas ({details.inputs.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-2">
                        {details.inputs.map((input, idx) => (
                          <div key={idx} className="bg-[#1a1a18] rounded-md p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white">{input.name}</span>
                              <Badge
                                className="text-[9px] px-1.5 py-0 bg-[#3a3a37] text-gray-400 border-[#4a4a47]"
                              >
                                {input.type}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-gray-500">{input.description}</p>
                            {input.example && (
                              <p className="text-[10px] text-gray-600 font-mono truncate">
                                ej: {input.example}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Outputs */}
                {details?.outputs && details.outputs.length > 0 && (
                  <AccordionItem value="outputs" className="border-[#3a3a37]">
                    <AccordionTrigger className="py-2 text-xs hover:no-underline">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <ArrowUpFromLine className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">Salidas ({details.outputs.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-2">
                        {details.outputs.map((output, idx) => (
                          <div key={idx} className="bg-[#1a1a18] rounded-md p-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-white">{output.name}</span>
                              <Badge
                                className="text-[9px] px-1.5 py-0 bg-[#3a3a37] text-gray-400 border-[#4a4a47]"
                              >
                                {output.type}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-gray-500">{output.description}</p>
                            {output.example && (
                              <p className="text-[10px] text-gray-600 font-mono truncate">
                                ej: {output.example}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Error Cases */}
                {details?.errorCases && details.errorCases.length > 0 && (
                  <AccordionItem value="errors" className="border-[#3a3a37]">
                    <AccordionTrigger className="py-2 text-xs hover:no-underline">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium">Errores ({details.errorCases.length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-2">
                        {details.errorCases.map((error, idx) => (
                          <div key={idx} className="bg-[#1a1a18] rounded-md p-2.5 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                className="text-[9px] px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/50"
                              >
                                {error.code}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-gray-500">{error.description}</p>
                            <div className="flex items-start gap-1 mt-1">
                              <Zap className="h-2.5 w-2.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] text-yellow-500/80">{error.handling}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {/* No details message */}
              {!details && (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-500">
                    No hay detalles disponibles para este nodo.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
