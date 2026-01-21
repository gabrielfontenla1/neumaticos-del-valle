/**
 * API endpoints for AI models configuration
 * GET /api/admin/settings/ai/models - Get models config
 * POST /api/admin/settings/ai/models - Save models config
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import {
  getAIModelsConfig,
  setAIModelsConfig,
  clearConfigCache,
} from '@/lib/ai/config-service';
import { aiModelConfigSchema } from '@/lib/ai/config-validators';
import { ConfigKey } from '@/lib/ai/config-types';

/**
 * GET /api/admin/settings/ai/models
 * Get AI models configuration
 */
export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const config = await getAIModelsConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[AI Models Config] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/ai/models
 * Save AI models configuration
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();

    // Validate with Zod
    const validation = aiModelConfigSchema.safeParse(body);
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

    // Save configuration
    await setAIModelsConfig(validation.data, authResult.session.user?.email || 'admin');

    // Invalidate cache
    clearConfigCache(ConfigKey.AI_MODELS);

    return NextResponse.json({
      success: true,
      message: 'Configuración de modelos guardada correctamente',
    });
  } catch (error) {
    console.error('[AI Models Config] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
