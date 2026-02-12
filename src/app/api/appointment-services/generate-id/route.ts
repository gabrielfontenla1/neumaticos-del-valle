import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: services, error } = await supabase
      .from('appointment_services')
      .select('id')

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 })
    }

    const existingIds = new Set(services?.map(s => s.id) || [])
    let slug = slugify(name)

    if (!slug) {
      return NextResponse.json({ error: 'Could not generate valid ID from name' }, { status: 400 })
    }

    // Ensure uniqueness
    let finalSlug = slug
    if (existingIds.has(finalSlug)) {
      let counter = 2
      while (existingIds.has(`${slug}-${counter}`)) {
        counter++
      }
      finalSlug = `${slug}-${counter}`
    }

    return NextResponse.json({ id: finalSlug })
  } catch (error) {
    console.error('Error generating ID:', error)
    return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 })
  }
}
