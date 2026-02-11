import { NextRequest, NextResponse } from 'next/server'
import { getInstance, deleteInstance } from '@/lib/baileys/service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const instance = await getInstance(id)

    if (!instance) {
      return NextResponse.json({ success: false, error: 'Instance not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: instance })
  } catch (error) {
    console.error('[Baileys API] Error getting instance:', error)
    return NextResponse.json({ success: false, error: 'Failed to get instance' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteInstance(id)
    return NextResponse.json({ success: true, message: 'Instance deleted' })
  } catch (error) {
    console.error('[Baileys API] Error deleting instance:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete instance' }, { status: 500 })
  }
}
