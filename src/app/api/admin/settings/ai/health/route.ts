/**
 * API endpoint for configuration system health check
 * GET /api/admin/settings/ai/health - Health check
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-check';
import { performHealthCheck } from '@/lib/ai/config-service';

/**
 * GET /api/admin/settings/ai/health
 * Perform health check on configuration system
 */
export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (!authResult.authorized) {
      return authResult.response;
    }

    const healthCheck = await performHealthCheck();

    const statusCode =
      healthCheck.status === 'healthy'
        ? 200
        : healthCheck.status === 'degraded'
          ? 207
          : 503;

    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
