/**
 * API endpoints for WhatsApp context enrichment configuration
 * GET /api/admin/settings/ai/context-config - Get context config
 * POST /api/admin/settings/ai/context-config - Save context config
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import {
  getWhatsAppContextConfig,
  setWhatsAppContextConfig,
  clearConfigCache,
} from '@/lib/ai/config-service';
import { whatsappContextConfigSchema } from '@/lib/ai/config-validators';
import { ConfigKey } from '@/lib/ai/config-types';

/**
 * GET /api/admin/settings/ai/context-config
 * Get WhatsApp context enrichment configuration
 */
export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const config = await getWhatsAppContextConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[Context Config] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/ai/context-config
 * Save WhatsApp context enrichment configuration
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();

    // Validate with Zod
    const validation = whatsappContextConfigSchema.safeParse(body);
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
    await setWhatsAppContextConfig(validation.data, authResult.session.user?.email || 'admin');

    // Invalidate cache
    clearConfigCache(ConfigKey.WHATSAPP_CONTEXT);

    return NextResponse.json({
      success: true,
      message: 'Configuración de contexto guardada correctamente',
    });
  } catch (error) {
    console.error('[Context Config] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
