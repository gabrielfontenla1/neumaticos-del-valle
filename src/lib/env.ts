/**
 * Environment Configuration
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

  // Default to staging in production build
  return 'staging'
}

/**
 * Environment configuration object
 */
export const ENV_CONFIG = {
  environment: getEnvironment(),
  isProduction: getEnvironment() === 'production',
  isStaging: getEnvironment() === 'staging',
  isDevelopment: getEnvironment() === 'development',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const

/**
 * Log environment info (only in development)
 */
if (typeof window !== 'undefined' && ENV_CONFIG.isDevelopment) {
  console.log('🌍 Environment:', ENV_CONFIG.environment)
}
