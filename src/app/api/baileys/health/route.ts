import { NextResponse } from 'next/server'
import { checkServiceHealth } from '@/lib/baileys/client'

export async function GET() {
  try {
    const result = await checkServiceHealth()

    if (!result.success) {
      return NextResponse.json({
        success: false,
        service_status: 'offline',
        error: result.error,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      service_status: 'online',
      data: result.data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      service_status: 'offline',
      error: 'Service check failed',
      timestamp: new Date().toISOString()
    })
  }
}
