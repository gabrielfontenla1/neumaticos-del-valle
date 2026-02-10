/**
 * API endpoints for WhatsApp bot configuration
 * GET /api/admin/settings/ai/whatsapp-bot - Get bot config
 * POST /api/admin/settings/ai/whatsapp-bot - Save bot config
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import {
  getWhatsAppBotConfig,
  setWhatsAppBotConfig,
  clearConfigCache,
} from '@/lib/ai/config-service';
import { whatsappBotConfigSchema } from '@/lib/ai/config-validators';
import { ConfigKey } from '@/lib/ai/config-types';

/**
 * GET /api/admin/settings/ai/whatsapp-bot
 * Get WhatsApp bot configuration
 */
export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const config = await getWhatsAppBotConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[WhatsApp Bot Config] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/ai/whatsapp-bot
 * Save WhatsApp bot configuration
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();

    // Validate with Zod
    const validation = whatsappBotConfigSchema.safeParse(body);
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
    await setWhatsAppBotConfig(validation.data, authResult.session.user?.email || 'admin');

    // Invalidate cache
    clearConfigCache(ConfigKey.WHATSAPP_BOT);

    return NextResponse.json({
      success: true,
      message: 'Configuración del bot guardada correctamente',
    });
  } catch (error) {
    console.error('[WhatsApp Bot Config] POST Error:', error);
    const message = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'message' in error)
        ? String((error as { message: unknown }).message)
        : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
