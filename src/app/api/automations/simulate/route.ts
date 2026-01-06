import { NextRequest, NextResponse } from 'next/server'
import { emitWorkflowEvent, createExecutionId } from '@/lib/automations/event-emitter'

// Node sequence for Kommo workflow
const kommoNodes = [
  'trigger-webhook',
  'verify-signature',
  'extract-message',
  'db-conversation',
  'ai-intent',
  'db-save-user',
  'condition-appointment',
  'ai-search-products',
  'ai-generate',
  'db-save-response',
  'http-send',
  'end'
]

// Node sequence for Twilio workflow
const twilioNodes = [
  'trigger-webhook',
  'verify-signature',
  'parse-form',
  'db-conversation',
  'ai-intent',
  'ai-generate',
  'db-save',
  'http-send',
  'end'
]

const workflows: Record<string, string[]> = {
  'kommo-webhook': kommoNodes,
  'twilio-webhook': twilioNodes,
}

/**
 * POST /api/automations/simulate
 * Simulates a workflow execution by emitting events for each node
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflowId = 'kommo-webhook', delayMs = 500 } = body

    const nodes = workflows[workflowId]
    if (!nodes) {
      return NextResponse.json(
        { error: `Unknown workflow: ${workflowId}` },
        { status: 400 }
      )
    }

    const executionId = createExecutionId()

    console.log(`[Simulate] Starting workflow ${workflowId} (${executionId})`)

    // Run simulation in background
    simulateWorkflow(workflowId, nodes, executionId, delayMs)

    return NextResponse.json({
      success: true,
      executionId,
      workflowId,
      nodeCount: nodes.length,
      estimatedDuration: `${nodes.length * delayMs}ms`
    })
  } catch (error) {
    console.error('[Simulate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to start simulation' },
      { status: 500 }
    )
  }
}

async function simulateWorkflow(
  workflowId: string,
  nodes: string[],
  executionId: string,
  delayMs: number
) {
  for (let i = 0; i < nodes.length; i++) {
    const nodeId = nodes[i]

    // Emit running status
    emitWorkflowEvent(workflowId, nodeId, 'running', executionId, {
      input: { step: i + 1, total: nodes.length }
    })

    console.log(`[Simulate] Node ${nodeId} running...`)

    // Wait for simulated processing
    await sleep(delayMs)

    // Emit success status
    emitWorkflowEvent(workflowId, nodeId, 'success', executionId, {
      output: { completed: true },
      duration: delayMs
    })

    console.log(`[Simulate] Node ${nodeId} completed`)
  }

  console.log(`[Simulate] Workflow ${workflowId} completed (${executionId})`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
