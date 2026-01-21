/**
 * API endpoints for WhatsApp function tools configuration
 * GET /api/admin/settings/ai/function-tools - Get function tools config
 * POST /api/admin/settings/ai/function-tools - Save function tools config
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import {
  getWhatsAppTools,
  setWhatsAppToolsConfig,
  clearConfigCache,
} from '@/lib/ai/config-service';
import {
  whatsappFunctionToolsConfigSchema,
  validateFunctionSchema,
} from '@/lib/ai/config-validators';
import { ConfigKey } from '@/lib/ai/config-types';

/**
 * GET /api/admin/settings/ai/function-tools
 * Get WhatsApp function tools configuration
 */
export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const config = await getWhatsAppTools();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[Function Tools Config] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/ai/function-tools
 * Save WhatsApp function tools configuration
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();

    // Validate with Zod
    const validation = whatsappFunctionToolsConfigSchema.safeParse(body);
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

    // Validate each function schema
    const schemaErrors: Array<{ name: string; error: string }> = [];
    for (const tool of validation.data.tools) {
      const schemaValidation = validateFunctionSchema(tool.parameters);
      if (!schemaValidation.valid) {
        schemaErrors.push({
          name: tool.name,
          error: schemaValidation.error || 'Invalid schema',
        });
      }
    }

    if (schemaErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Esquemas de funciones inválidos',
          details: schemaErrors,
        },
        { status: 400 }
      );
    }

    // Save configuration
    await setWhatsAppToolsConfig(validation.data, authResult.session.user?.email || 'admin');

    // Invalidate cache
    clearConfigCache(ConfigKey.WHATSAPP_TOOLS);

    return NextResponse.json({
      success: true,
      message: 'Configuración de funciones guardada correctamente',
    });
  } catch (error) {
    console.error('[Function Tools Config] POST Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
