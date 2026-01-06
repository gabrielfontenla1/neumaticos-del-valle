/**
 * Types for automation canvas visualization
 */

// Node status in the canvas
export type NodeStatus = 'idle' | 'running' | 'success' | 'error'

// Node types for visual differentiation
export type NodeType = 'trigger' | 'action' | 'condition' | 'database' | 'ai' | 'http' | 'end'

// Position in canvas
export interface Position {
  x: number
  y: number
}

// Detailed information about a node for the details panel
export interface NodeDetails {
  /** Descripción detallada de qué hace el nodo */
  longDescription: string

  /** Datos que recibe el nodo */
  inputs: {
    name: string
    type: string
    description: string
    example?: string
  }[]

  /** Datos que produce el nodo */
  outputs: {
    name: string
    type: string
    description: string
    example?: string
  }[]

  /** Tecnología/API utilizada */
  technology?: {
    name: string
    endpoint?: string
    method?: string
  }

  /** Duración típica de ejecución */
  typicalDuration?: string

  /** Posibles errores y cómo se manejan */
  errorCases?: {
    code: string
    description: string
    handling: string
  }[]
}

// Single node in a workflow
export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  description?: string
  icon?: string
  position: Position
  details?: NodeDetails
}

// Edge connecting two nodes
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
}

// Complete workflow definition
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: string // ID of the trigger node
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

// Real-time event emitted during execution
export interface WorkflowEvent {
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

// Execution record for history
export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  nodeEvents: WorkflowEvent[]
}

// Map of node statuses for the canvas
export type NodeStatusMap = Record<string, NodeStatus>
