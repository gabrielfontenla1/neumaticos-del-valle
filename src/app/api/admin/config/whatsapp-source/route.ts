import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role to bypass RLS
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const CONFIG_KEY = 'whatsapp_sources'

export interface WhatsAppSourceConfig {
  twilio_enabled: boolean
  baileys_enabled: boolean
  updated_at?: string
}

const DEFAULT_CONFIG: WhatsAppSourceConfig = {
  twilio_enabled: true,
  baileys_enabled: false
}

/**
 * GET /api/admin/config/whatsapp-source
 * Get the current WhatsApp source configuration
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching whatsapp source config:', error)
      return NextResponse.json(DEFAULT_CONFIG)
    }

    // Handle legacy format (single source string)
    if (data?.value && typeof data.value === 'string') {
      return NextResponse.json({
        twilio_enabled: data.value === 'twilio',
        baileys_enabled: data.value === 'baileys'
      })
    }

    // New format: object with enabled flags
    const config = data?.value as WhatsAppSourceConfig | null
    return NextResponse.json({
      twilio_enabled: config?.twilio_enabled ?? true,
      baileys_enabled: config?.baileys_enabled ?? false,
      updated_at: config?.updated_at
    })
  } catch (error) {
    console.error('Error in GET /api/admin/config/whatsapp-source:', error)
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

/**
 * POST /api/admin/config/whatsapp-source
 * Save the WhatsApp source configuration
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Support both legacy format (source: string) and new format (enabled flags)
    let config: WhatsAppSourceConfig

    if (body.source) {
      // Legacy format - convert to new format
      config = {
        twilio_enabled: body.source === 'twilio',
        baileys_enabled: body.source === 'baileys'
      }
    } else {
      // New format
      config = {
        twilio_enabled: body.twilio_enabled ?? false,
        baileys_enabled: body.baileys_enabled ?? false
      }
    }

    // Validate at least one is enabled
    if (!config.twilio_enabled && !config.baileys_enabled) {
      return NextResponse.json(
        { error: 'Al menos un proveedor debe estar habilitado' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Upsert the configuration
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        {
          key: CONFIG_KEY,
          value: {
            ...config,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Error saving whatsapp source config:', error)
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...config
    })
  } catch (error) {
    console.error('Error in POST /api/admin/config/whatsapp-source:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
