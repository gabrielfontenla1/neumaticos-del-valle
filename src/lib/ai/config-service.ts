/**
 * AI Configuration Service
 * Manages AI configurations with multi-level fallback chain:
 * 1. L1 Cache (memory) → 2. Database → 3. Last Known Good → 4. Default hardcoded
 */

import { createClient } from '@supabase/supabase-js';
import { configCache, TTL } from '@/lib/config/cache';
import {
  ConfigKey,
  AIModelConfig,
  WhatsAppBotConfig,
  WhatsAppFunctionToolsConfig,
  AIPromptsConfig,
  ServicesConfig,
  DEFAULT_AI_MODELS_CONFIG,
  DEFAULT_WHATSAPP_BOT_CONFIG,
  DEFAULT_WHATSAPP_FUNCTION_TOOLS,
  DEFAULT_AI_PROMPTS_CONFIG,
  DEFAULT_SERVICES_CONFIG,
} from '@/lib/ai/config-types';

// Create Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(supabaseUrl, supabaseServiceKey);
};

/**
 * Generic configuration loader with fallback chain
 */
async function getConfig<T>(
  key: ConfigKey,
  defaultValue: T,
  ttl: number
): Promise<T> {
  // 1. Try L1 cache
  const cached = configCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  try {
    // 2. Try database
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) throw error;

    if (data && data.value) {
      const value = data.value as T;
      configCache.set(key, value, ttl);
      return value;
    }

    // No data found, use default
    configCache.set(key, defaultValue, ttl);
    return defaultValue;
  } catch (error) {
    configCache.recordError();
    console.error(`[ConfigService] Error loading ${key}:`, error);

    // 3. Try last known good
    const lastKnownGood = configCache.getLastKnownGood<T>(key);
    if (lastKnownGood !== null) {
      console.warn(`[ConfigService] Using last known good for ${key}`);
      return lastKnownGood;
    }

    // 4. Fallback to default
    console.warn(`[ConfigService] Using default value for ${key}`);
    return defaultValue;
  }
}

/**
 * Save configuration to database and invalidate cache
 */
async function setConfig<T>(
  key: ConfigKey,
  value: T,
  userId?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  // Get old value for audit log
  const { data: oldData } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single();

  // Upsert new value (conflict on unique 'key' column, not the UUID primary key)
  const { error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key,
        value: value as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) throw error;

  // Invalidate cache
  configCache.invalidate(key);

  // Create audit log if we have userId
  if (userId && oldData) {
    try {
      await supabase.from('config_audit_log').insert({
        config_key: key,
        old_value: oldData.value,
        new_value: value,
        changed_by: userId,
        changed_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('[ConfigService] Error creating audit log:', auditError);
      // Don't fail the main operation if audit logging fails
    }
  }
}

// ============================================================================
// Specific Configuration Getters
// ============================================================================

/**
 * Get AI models configuration
 */
export async function getAIModelsConfig(): Promise<AIModelConfig> {
  return getConfig(
    ConfigKey.AI_MODELS,
    DEFAULT_AI_MODELS_CONFIG,
    TTL.MODELS_CONFIG
  );
}

/**
 * Get WhatsApp bot configuration
 */
export async function getWhatsAppBotConfig(): Promise<WhatsAppBotConfig> {
  return getConfig(
    ConfigKey.WHATSAPP_BOT,
    DEFAULT_WHATSAPP_BOT_CONFIG,
    TTL.BOT_CONFIG
  );
}

/**
 * Get WhatsApp system prompt
 */
export async function getWhatsAppSystemPrompt(): Promise<string> {
  const prompts = await getConfig(
    ConfigKey.AI_PROMPTS,
    DEFAULT_AI_PROMPTS_CONFIG,
    TTL.AI_PROMPTS
  );
  return prompts.whatsappSystemPrompt;
}

/**
 * Get WhatsApp function calling tools
 */
export async function getWhatsAppTools(): Promise<WhatsAppFunctionToolsConfig> {
  return getConfig(
    ConfigKey.WHATSAPP_TOOLS,
    DEFAULT_WHATSAPP_FUNCTION_TOOLS,
    TTL.FUNCTION_TOOLS
  );
}

/**
 * Get all AI prompts configuration
 */
export async function getAIPromptsConfig(): Promise<AIPromptsConfig> {
  return getConfig(
    ConfigKey.AI_PROMPTS,
    DEFAULT_AI_PROMPTS_CONFIG,
    TTL.AI_PROMPTS
  );
}

/**
 * Get services configuration
 */
export async function getServicesConfig(): Promise<ServicesConfig> {
  return getConfig(
    ConfigKey.SERVICES,
    DEFAULT_SERVICES_CONFIG,
    TTL.SERVICES_CONFIG
  );
}

// ============================================================================
// Specific Configuration Setters
// ============================================================================

/**
 * Save AI models configuration
 */
export async function setAIModelsConfig(
  config: AIModelConfig,
  userId?: string
): Promise<void> {
  return setConfig(ConfigKey.AI_MODELS, config, userId);
}

/**
 * Save WhatsApp bot configuration
 */
export async function setWhatsAppBotConfig(
  config: WhatsAppBotConfig,
  userId?: string
): Promise<void> {
  return setConfig(ConfigKey.WHATSAPP_BOT, config, userId);
}

/**
 * Save AI prompts configuration
 */
export async function setAIPromptsConfig(
  config: AIPromptsConfig,
  userId?: string
): Promise<void> {
  return setConfig(ConfigKey.AI_PROMPTS, config, userId);
}

/**
 * Save WhatsApp function tools configuration
 */
export async function setWhatsAppToolsConfig(
  config: WhatsAppFunctionToolsConfig,
  userId?: string
): Promise<void> {
  return setConfig(ConfigKey.WHATSAPP_TOOLS, config, userId);
}

/**
 * Save services configuration
 */
export async function setServicesConfig(
  config: ServicesConfig,
  userId?: string
): Promise<void> {
  return setConfig(ConfigKey.SERVICES, config, userId);
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear specific configuration from cache
 */
export function clearConfigCache(key?: ConfigKey): void {
  if (key) {
    configCache.invalidate(key);
  } else {
    configCache.clear();
  }
}

/**
 * Get cache metrics
 */
export function getCacheMetrics() {
  return configCache.getMetrics();
}

/**
 * Get all active cache keys
 */
export function getActiveCacheKeys(): string[] {
  return configCache.getKeys();
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  cache: {
    status: 'ok' | 'error';
    metrics: ReturnType<typeof configCache.getMetrics>;
  };
  database: {
    status: 'ok' | 'error';
    message?: string;
  };
  configs: {
    [key: string]: {
      status: 'ok' | 'fallback' | 'default';
      source: 'cache' | 'database' | 'lastKnownGood' | 'default';
    };
  };
}

/**
 * Perform health check on configuration system
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    cache: {
      status: 'ok',
      metrics: configCache.getMetrics(),
    },
    database: {
      status: 'ok',
    },
    configs: {},
  };

  // Check database connectivity
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('app_settings')
      .select('key')
      .limit(1);

    if (error) {
      result.database.status = 'error';
      result.database.message = error.message;
      result.status = 'degraded';
    }
  } catch (error) {
    result.database.status = 'error';
    result.database.message =
      error instanceof Error ? error.message : 'Unknown error';
    result.status = 'unhealthy';
  }

  // Check each configuration
  const configChecks = [
    { key: ConfigKey.AI_MODELS, name: 'AI Models' },
    { key: ConfigKey.WHATSAPP_BOT, name: 'WhatsApp Bot' },
    { key: ConfigKey.AI_PROMPTS, name: 'AI Prompts' },
    { key: ConfigKey.WHATSAPP_TOOLS, name: 'WhatsApp Tools' },
    { key: ConfigKey.SERVICES, name: 'Services' },
  ];

  for (const check of configChecks) {
    const cached = configCache.get(check.key);
    if (cached !== null) {
      result.configs[check.name] = { status: 'ok', source: 'cache' };
    } else {
      const lastKnown = configCache.getLastKnownGood(check.key);
      if (lastKnown !== null) {
        result.configs[check.name] = {
          status: 'fallback',
          source: 'lastKnownGood',
        };
        result.status = 'degraded';
      } else {
        result.configs[check.name] = { status: 'default', source: 'default' };
      }
    }
  }

  // Check cache error rate
  const metrics = configCache.getMetrics();
  if (metrics.errors > 10) {
    result.status = 'degraded';
  }

  return result;
}
