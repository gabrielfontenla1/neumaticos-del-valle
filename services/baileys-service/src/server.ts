// ===========================================
// Baileys Service - Express Server
// ===========================================

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { logger } from './utils/logger'
import { phoneToJid } from './utils/phone-format'
import {
  connectInstance,
  disconnectInstance,
  sendMessage,
  getConnectionStatus,
  getActiveConnections,
} from './connection-manager'
import { getInstance, getRecentLogs } from './session-store'

const app = express()

app.use(cors())
app.use(express.json())

function param(req: Request, name: string): string {
  const v = req.params[name]
  return Array.isArray(v) ? v[0] : v
}

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.debug({ method: req.method, path: req.path }, 'Request received')
  next()
})

// API Key authentication
const API_KEY = process.env.BAILEYS_API_KEY
if (!API_KEY) {
  logger.warn('No BAILEYS_API_KEY set - API authentication disabled')
}

function authenticate(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY) return next()

  const key = req.headers['x-api-key'] || req.headers['x-baileys-api-key']
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ===========================================
// Health Check
// ===========================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    active_connections: getActiveConnections().length,
  })
})

// ===========================================
// Instance Routes
// ===========================================

app.get('/instances/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const instance = await getInstance(param(req, 'id'))
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' })
    }

    const connectionStatus = getConnectionStatus(param(req, 'id'))

    res.json({
      ...instance,
      session_data: undefined,
      real_time_status: connectionStatus,
    })
  } catch (error) {
    logger.error({ error }, 'Error getting instance')
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/instances/:id/connect', authenticate, async (req: Request, res: Response) => {
  try {
    const instanceId = param(req, 'id')

    connectInstance(instanceId).catch((error) => {
      logger.error({ error, instanceId }, 'Connection failed')
    })

    res.json({ message: 'Connection started', instance_id: instanceId })
  } catch (error) {
    logger.error({ error }, 'Error starting connection')
    res.status(500).json({ error: 'Failed to start connection' })
  }
})

app.post('/instances/:id/disconnect', authenticate, async (req: Request, res: Response) => {
  try {
    await disconnectInstance(param(req, 'id'))
    res.json({ message: 'Disconnected successfully' })
  } catch (error) {
    logger.error({ error }, 'Error disconnecting')
    res.status(500).json({ error: 'Failed to disconnect' })
  }
})

app.get('/instances/:id/qr', authenticate, async (req: Request, res: Response) => {
  try {
    const instance = await getInstance(param(req, 'id'))
    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' })
    }

    res.json({
      instance_id: instance.id,
      status: instance.status,
      qr_code: instance.qr_code,
      expires_at: instance.qr_expires_at,
    })
  } catch (error) {
    logger.error({ error }, 'Error getting QR')
    res.status(500).json({ error: 'Failed to get QR code' })
  }
})

app.post('/instances/:id/send', authenticate, async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing "to" or "message" field' })
    }

    const jid = phoneToJid(to)
    const result = await sendMessage(param(req, 'id'), jid, message)

    if (result.success) {
      res.json({ success: true, message_id: result.messageId })
    } else {
      res.status(400).json({ success: false, error: result.error })
    }
  } catch (error) {
    logger.error({ error }, 'Error sending message')
    res.status(500).json({ error: 'Failed to send message' })
  }
})

app.get('/instances/:id/logs', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const logs = await getRecentLogs(param(req, 'id'), limit)
    res.json({ logs })
  } catch (error) {
    logger.error({ error }, 'Error getting logs')
    res.status(500).json({ error: 'Failed to get logs' })
  }
})

// Admin: list active connections
app.get('/admin/connections', authenticate, (_req: Request, res: Response) => {
  const connections = getActiveConnections()
  res.json({ count: connections.length, instances: connections })
})

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ error: err }, 'Unhandled error')
  res.status(500).json({ error: 'Internal server error' })
})

export { app }
