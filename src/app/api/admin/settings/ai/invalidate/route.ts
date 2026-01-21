/**
 * API endpoint for cache invalidation
 * POST /api/admin/settings/ai/invalidate - Invalidate configuration cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import { clearConfigCache } from '@/lib/ai/config-service';
import { ConfigKey } from '@/lib/ai/config-types';

/**
 * POST /api/admin/settings/ai/invalidate
 * Invalidate configuration cache (all or specific key)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const body = await request.json();
    const { key } = body;

    if (key) {
      // Validate that key is a valid ConfigKey
      if (!Object.values(ConfigKey).includes(key as ConfigKey)) {
        return NextResponse.json(
          { error: 'Clave de configuración inválida' },
          { status: 400 }
        );
      }

      // Invalidate specific key
      clearConfigCache(key as ConfigKey);

      return NextResponse.json({
        success: true,
        message: `Cache invalidado para: ${key}`,
      });
    }

    // Invalidate all cache
    clearConfigCache();

    return NextResponse.json({
      success: true,
      message: 'Cache completo invalidado',
    });
  } catch (error) {
    console.error('[Cache Invalidation] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
