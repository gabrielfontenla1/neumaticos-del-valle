import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Branch } from '@/types/branch'

/**
 * GET /api/branches
 * List all active branches (stores) for public display
 * No authentication required
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch only active branches ordered by is_main and name
    const { data: branches, error } = await supabase
      .from('stores')
      .select('*')
      .eq('active', true)
      .order('is_main', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching branches:', error)
      return NextResponse.json(
        {
          success: false,
          branches: [],
          error: 'Failed to fetch branches',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        branches: (branches || []) as Branch[],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/branches:', error)
    return NextResponse.json(
      {
        success: false,
        branches: [],
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
