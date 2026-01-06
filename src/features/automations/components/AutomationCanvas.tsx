'use client'

import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useWorkflowStore } from '../hooks/useWorkflowStore'
import { useWorkflowEvents } from '../hooks/useWorkflowEvents'
import { workflowList } from '../definitions'
import { WorkflowSelector } from './WorkflowSelector'
import { ExecutionTimeline } from './ExecutionTimeline'
import { AutomationNode } from './AutomationNode'
import { NodeDetailsPanel } from './NodeDetailsPanel'
import type { WorkflowNode, NodeStatus, NodeType } from '../types'

const nodeTypes: NodeTypes = {
  automation: AutomationNode,
} as NodeTypes

function getNodeStatusColor(status: NodeStatus): string {
  switch (status) {
    case 'running':
      return '#3b82f6'
    case 'success':
      return '#22c55e'
    case 'error':
      return '#ef4444'
    default:
      return '#6b7280'
  }
}

function getNodeTypeColor(type: NodeType): string {
  switch (type) {
    case 'trigger':
      return '#8b5cf6'
    case 'action':
      return '#3b82f6'
    case 'condition':
      return '#f59e0b'
    case 'database':
      return '#10b981'
    case 'ai':
      return '#ec4899'
    case 'http':
      return '#06b6d4'
    case 'end':
      return '#6b7280'
    default:
      return '#6b7280'
  }
}

export function AutomationCanvas() {
  const { activeWorkflow, nodeStatuses, setActiveWorkflow, selectNode } = useWorkflowStore()

  // Connect to SSE for real-time workflow events
  const { connect, disconnect } = useWorkflowEvents({ autoConnect: true })

  useEffect(() => {
    if (!activeWorkflow && workflowList.length > 0) {
      setActiveWorkflow(workflowList[0])
    }
  }, [activeWorkflow, setActiveWorkflow])

  const { nodes, edges } = useMemo(() => {
    if (!activeWorkflow) {
      return { nodes: [], edges: [] }
    }

    const flowNodes: Node[] = activeWorkflow.nodes.map((node: WorkflowNode) => {
      const status = nodeStatuses[node.id] || 'idle'
      return {
        id: node.id,
        type: 'automation',
        position: node.position,
        data: {
          id: node.id,
          label: node.label,
          description: node.description,
          icon: node.icon,
          nodeType: node.type,
          status,
          typeColor: getNodeTypeColor(node.type),
          statusColor: getNodeStatusColor(status),
        },
        draggable: false,
      }
    })

    const flowEdges: Edge[] = activeWorkflow.edges.map((edge) => {
      const sourceStatus = nodeStatuses[edge.source]
      const isAnimated = sourceStatus === 'running' || sourceStatus === 'success'

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: isAnimated,
        style: {
          stroke: isAnimated ? '#22c55e' : '#4b5563',
          strokeWidth: 2,
        },
        labelStyle: {
          fill: '#9ca3af',
          fontSize: 11,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: '#1f2937',
          fillOpacity: 0.9,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      }
    })

    return { nodes: flowNodes, edges: flowEdges }
  }, [activeWorkflow, nodeStatuses])

  const onNodesChange = useCallback(() => {}, [])
  const onEdgesChange = useCallback(() => {}, [])
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    selectNode(node.id)
  }, [selectNode])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex min-h-0">
        <WorkflowSelector />

        <div className="flex-1 bg-[#1a1a18] relative">
          {activeWorkflow ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{
                padding: 0.2,
                minZoom: 0.5,
                maxZoom: 1.5,
              }}
              panOnDrag
              zoomOnScroll
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              proOptions={{ hideAttribution: true }}
              className="bg-[#1a1a18]"
            >
              <Controls
                className="!bg-[#262624] !border-[#3a3a37] !rounded-lg !shadow-lg"
                showInteractive={false}
              />
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="#3a3a37"
              />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Selecciona un workflow para visualizar</p>
            </div>
          )}
          <NodeDetailsPanel />
        </div>
      </div>

      <ExecutionTimeline />
    </div>
  )
}
