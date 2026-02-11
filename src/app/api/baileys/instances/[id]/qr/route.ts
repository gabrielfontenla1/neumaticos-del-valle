import { NextRequest, NextResponse } from 'next/server'
import { getQRCode } from '@/lib/baileys/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await getQRCode(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[Baileys API] Error getting QR code:', error)
    return NextResponse.json({ success: false, error: 'Failed to get QR code' }, { status: 500 })
  }
}
