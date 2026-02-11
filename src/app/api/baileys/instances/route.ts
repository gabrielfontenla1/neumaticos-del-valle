import { NextRequest, NextResponse } from 'next/server'
import { getInstances, createInstance } from '@/lib/baileys/service'

export async function GET() {
  try {
    const instances = await getInstances()
    return NextResponse.json({ success: true, data: instances })
  } catch (error) {
    console.error('[Baileys API] Error listing instances:', error)
    return NextResponse.json({ success: false, error: 'Failed to list instances' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, settings } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      )
    }

    const instance = await createInstance({ name: name.trim(), settings })
    return NextResponse.json({ success: true, data: instance }, { status: 201 })
  } catch (error) {
    console.error('[Baileys API] Error creating instance:', error)
    return NextResponse.json({ success: false, error: 'Failed to create instance' }, { status: 500 })
  }
}
