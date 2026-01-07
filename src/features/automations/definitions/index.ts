import { twilioWebhookFlow } from './twilio-webhook-flow'
import { appointmentFlow } from './appointment-flow'
import type { WorkflowDefinition } from '../types'

export const workflows: Record<string, WorkflowDefinition> = {
  'twilio-webhook': twilioWebhookFlow,
  'appointment-flow': appointmentFlow,
}

export const workflowList = Object.values(workflows)

export { twilioWebhookFlow, appointmentFlow }
