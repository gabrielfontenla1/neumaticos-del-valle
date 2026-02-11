// ===========================================
// Baileys Service - Entry Point
// ===========================================

import 'dotenv/config'
import { app } from './server'
import { logger } from './utils/logger'
import { getActiveInstances } from './session-store'
import { connectInstance } from './connection-manager'

const PORT = parseInt(process.env.PORT || '6002', 10)

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

async function startServer() {
  // Start Express server
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Baileys service started')
    logger.info(`Health check: http://localhost:${PORT}/health`)
  })

  // Reconnect active instances
  try {
    const activeInstances = await getActiveInstances()
    if (activeInstances.length > 0) {
      logger.info({ count: activeInstances.length }, 'Reconnecting active instances')
      for (const instance of activeInstances) {
        connectInstance(instance.id).catch((error) => {
          logger.error({ error, instanceId: instance.id }, 'Failed to reconnect instance')
        })
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Error checking active instances on startup')
  }
}

startServer().catch((error) => {
  logger.error({ error }, 'Failed to start server')
  process.exit(1)
})
