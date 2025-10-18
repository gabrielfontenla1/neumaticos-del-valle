/**
 * Environment Configuration
 * Controls which version of the site to show based on environment
 */

export type Environment = 'development' | 'staging' | 'production'

/**
 * Get current environment
 */
export function getEnvironment(): Environment {
  // Check explicit environment variable first
  const envVar = process.env.NEXT_PUBLIC_ENVIRONMENT
  if (envVar === 'staging' || envVar === 'production') {
    return envVar
  }

  // Default to development for local
  if (process.env.NODE_ENV === 'development') {
    return 'development'
  }

  // In production, check if we should show under construction
  const showUnderConstruction = process.env.NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION === 'true'
  return showUnderConstruction ? 'production' : 'staging'
}

/**
 * Check if we should show the Under Construction page
 */
export function shouldShowUnderConstruction(): boolean {
  const env = getEnvironment()
  return env === 'production'
}

/**
 * Environment configuration object
 */
export const ENV_CONFIG = {
  environment: getEnvironment(),
  isProduction: getEnvironment() === 'production',
  isStaging: getEnvironment() === 'staging',
  isDevelopment: getEnvironment() === 'development',
  showUnderConstruction: shouldShowUnderConstruction(),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const

/**
 * Log environment info (only in development)
 */
if (typeof window !== 'undefined' && ENV_CONFIG.isDevelopment) {
  console.log('🌍 Environment:', ENV_CONFIG.environment)
  console.log('🏗️ Show Under Construction:', ENV_CONFIG.showUnderConstruction)
}
