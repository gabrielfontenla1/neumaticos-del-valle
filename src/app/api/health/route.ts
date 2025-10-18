import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const checks = {
    server: true,
    database: false,
    environment: false
  };

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'neumaticos-del-valle',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: checks
  };

  try {
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    if (missingEnvVars.length === 0) {
      checks.environment = true;
    } else {
      console.warn('Missing environment variables:', missingEnvVars);
    }

    // Check database connection
    if (checks.environment) {
      const { error } = await supabase.from('products').select('count').single()

      if (!error || error.code === 'PGRST116') {
        // PGRST116 is "no rows returned" which is ok for health check
        checks.database = true;
      } else {
        console.error('Database check failed:', error.message);
      }
    }

    // Determine overall health status
    const allChecksPass = Object.values(checks).every(check => check === true);

    if (!allChecksPass) {
      healthData.status = checks.server ? 'degraded' : 'unhealthy';
    }

    // Return appropriate status code
    const statusCode = healthData.status === 'healthy' ? 200 :
                      healthData.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthData, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      ...healthData,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: checks
    }, { status: 503 })
  }
}

/**
 * HEAD method for lightweight health checks
 */
export async function HEAD() {
  return new Response(null, { status: 200 });
}