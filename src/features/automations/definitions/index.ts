import { kommoWebhookFlow } from './kommo-webhook-flow'
import { twilioWebhookFlow } from './twilio-webhook-flow'
import { appointmentFlow } from './appointment-flow'
import type { WorkflowDefinition } from '../types'

export const workflows: Record<string, WorkflowDefinition> = {
  'kommo-webhook': kommoWebhookFlow,
  'twilio-webhook': twilioWebhookFlow,
  'appointment-flow': appointmentFlow,
}

export const workflowList = Object.values(workflows)

export { kommoWebhookFlow, twilioWebhookFlow, appointmentFlow }
