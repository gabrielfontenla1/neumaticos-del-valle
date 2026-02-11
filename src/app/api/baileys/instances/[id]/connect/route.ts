import { NextRequest, NextResponse } from 'next/server'
import { connectInstance } from '@/lib/baileys/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const result = await connectInstance(id)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[Baileys API] Error connecting instance:', error)
    return NextResponse.json({ success: false, error: 'Failed to connect' }, { status: 500 })
  }
}
