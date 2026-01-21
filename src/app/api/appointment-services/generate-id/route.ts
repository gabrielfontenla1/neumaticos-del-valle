import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all existing IDs to ensure uniqueness
    const { data: services, error } = await supabase
      .from('appointment_services')
      .select('id')

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 })
    }

    const existingIds = new Set(services?.map(s => s.id) || [])

    // Generate a unique ID similar to existing ones (service-1, service-2, etc.)
    let counter = 1
    let newId = `service-${counter}`

    while (existingIds.has(newId)) {
      counter++
      newId = `service-${counter}`
    }

    return NextResponse.json({ id: newId })
  } catch (error) {
    console.error('Error generating ID:', error)
    return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 })
  }
}
