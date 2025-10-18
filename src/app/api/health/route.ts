import { NextResponse } from 'next/server'

export async function GET() {
  // Simplified health check for Railway
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'neumaticos-del-valle',
    environment: process.env.NODE_ENV || 'development'
  }, { status: 200 });
}

/**
 * HEAD method for lightweight health checks
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}