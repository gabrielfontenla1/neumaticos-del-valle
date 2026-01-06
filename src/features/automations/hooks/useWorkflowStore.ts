import { create } from 'zustand'
import type {
  WorkflowDefinition,
  WorkflowExecution,
  NodeStatusMap,
  WorkflowEvent,
  NodeStatus
} from '../types'

interface WorkflowState {
  // Current selected workflow
  activeWorkflow: WorkflowDefinition | null

  // Status of each node (for visual highlighting)
  nodeStatuses: NodeStatusMap

  // Current execution ID (if running)
  currentExecutionId: string | null

  // Recent executions for timeline
  recentExecutions: WorkflowExecution[]

  // Connection status for SSE
  isConnected: boolean

  // Currently selected node ID (for details panel)
  selectedNodeId: string | null

  // Actions
  setActiveWorkflow: (workflow: WorkflowDefinition) => void
  setNodeStatus: (nodeId: string, status: NodeStatus) => void
  setAllNodesIdle: () => void
  processEvent: (event: WorkflowEvent) => void
  addExecution: (execution: WorkflowExecution) => void
  updateExecution: (executionId: string, updates: Partial<WorkflowExecution>) => void
  setConnected: (connected: boolean) => void
  selectNode: (nodeId: string) => void
  clearSelection: () => void
  reset: () => void
}

const initialState = {
  activeWorkflow: null,
  nodeStatuses: {},
  currentExecutionId: null,
  recentExecutions: [],
  isConnected: false,
  selectedNodeId: null,
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,

  setActiveWorkflow: (workflow) => {
    // Reset node statuses when changing workflow
    const statuses: NodeStatusMap = {}
    workflow.nodes.forEach(node => {
      statuses[node.id] = 'idle'
    })
    set({
      activeWorkflow: workflow,
      nodeStatuses: statuses,
      currentExecutionId: null
    })
  },

  setNodeStatus: (nodeId, status) => {
    set(state => ({
      nodeStatuses: {
        ...state.nodeStatuses,
        [nodeId]: status
      }
    }))
  },

  setAllNodesIdle: () => {
    set(state => {
      if (!state.activeWorkflow) return state
      const statuses: NodeStatusMap = {}
      state.activeWorkflow.nodes.forEach(node => {
        statuses[node.id] = 'idle'
      })
      return { nodeStatuses: statuses, currentExecutionId: null }
    })
  },

  processEvent: (event) => {
    const state = get()

    // Only process events for active workflow
    if (state.activeWorkflow?.id !== event.workflowId) return

    // Update current execution ID
    if (event.status === 'running' && !state.currentExecutionId) {
      set({ currentExecutionId: event.executionId })
    }

    // Update node status
    set(s => ({
      nodeStatuses: {
        ...s.nodeStatuses,
        [event.nodeId]: event.status
      }
    }))

    // If this is a success/error, schedule reset to idle after delay
    if (event.status === 'success' || event.status === 'error') {
      setTimeout(() => {
        const currentState = get()
        // Only reset if still on same execution
        if (currentState.currentExecutionId === event.executionId) {
          set(s => ({
            nodeStatuses: {
              ...s.nodeStatuses,
              [event.nodeId]: 'idle'
            }
          }))
        }
      }, 3000) // Keep highlighted for 3 seconds
    }
  },

  addExecution: (execution) => {
    set(state => ({
      recentExecutions: [execution, ...state.recentExecutions].slice(0, 20)
    }))
  },

  updateExecution: (executionId, updates) => {
    set(state => ({
      recentExecutions: state.recentExecutions.map(exec =>
        exec.id === executionId ? { ...exec, ...updates } : exec
      )
    }))
  },

  setConnected: (connected) => {
    set({ isConnected: connected })
  },

  selectNode: (nodeId) => {
    set({ selectedNodeId: nodeId })
  },

  clearSelection: () => {
    set({ selectedNodeId: null })
  },

  reset: () => {
    set(initialState)
  }
}))
