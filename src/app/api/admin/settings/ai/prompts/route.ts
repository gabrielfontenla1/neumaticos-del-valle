/**
 * API endpoints for AI prompts configuration
 * GET /api/admin/settings/ai/prompts - Get prompts config
 * POST /api/admin/settings/ai/prompts - Save prompts config
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import {
  getAIPromptsConfig,
  setAIPromptsConfig,
  clearConfigCache,
} from '@/lib/ai/config-service';
import {
  aiPromptsConfigSchema,
  detectPromptInjection,
} from '@/lib/ai/config-validators';
import { ConfigKey } from '@/lib/ai/config-types';

/**
 * GET /api/admin/settings/ai/prompts
 * Get AI prompts configuration
 */
export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const config = await getAIPromptsConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[AI Prompts Config] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/ai/prompts
 * Save AI prompts configuration
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();

    // Validate with Zod
    const validation = aiPromptsConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Check for potential prompt injection in WhatsApp system prompt
    const injectionCheck = detectPromptInjection(
      validation.data.whatsappSystemPrompt
    );
    if (!injectionCheck.safe) {
      return NextResponse.json(
        {
          warning: 'Posible intento de inyección de prompt detectado',
          details: injectionCheck.warnings,
          // Allow saving but warn the user
        },
        { status: 200 }
      );
    }

    // Save configuration
    await setAIPromptsConfig(validation.data, authResult.session.user?.email || 'admin');

    // Invalidate cache
    clearConfigCache(ConfigKey.AI_PROMPTS);

    return NextResponse.json({
      success: true,
      message: 'Configuración de prompts guardada correctamente',
    });
  } catch (error) {
    console.error('[AI Prompts Config] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
