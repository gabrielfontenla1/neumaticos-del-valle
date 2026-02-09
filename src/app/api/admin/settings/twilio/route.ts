import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = createClient<any>(supabaseUrl, supabaseServiceKey)

const SETTINGS_KEY = 'twilio_config'

interface TwilioSettings {
  accountSid: string
  authToken: string
  whatsappNumber: string
  enabled: boolean
  updatedAt: string
}

/**
 * GET /api/admin/settings/twilio
 * Get Twilio configuration (masked by default, reveal=true for actual values)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    // Check if reveal parameter is set
    const { searchParams } = new URL(request.url)
    const reveal = searchParams.get('reveal') === 'true'

    const { data, error } = await db
      .from('app_settings')
      .select('value')
      .eq('key', SETTINGS_KEY)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Twilio Settings] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({
        configured: false,
        settings: null
      })
    }

    const settings = data.value as TwilioSettings

    // If reveal=true, return actual values (for editing)
    if (reveal) {
      return NextResponse.json({
        configured: true,
        settings: {
          accountSid: settings.accountSid || '',
          authToken: settings.authToken || '',
          whatsappNumber: settings.whatsappNumber || '',
          enabled: settings.enabled ?? false,
          updatedAt: settings.updatedAt
        }
      })
    }

    // Default: Mask sensitive values for display
    return NextResponse.json({
      configured: true,
      settings: {
        accountSid: maskValue(settings.accountSid),
        authToken: maskValue(settings.authToken),
        whatsappNumber: settings.whatsappNumber || '',
        enabled: settings.enabled ?? false,
        updatedAt: settings.updatedAt
      }
    })

  } catch (error) {
    console.error('[Twilio Settings] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/settings/twilio
 * Save Twilio configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const body = await request.json()
    const { accountSid, authToken, whatsappNumber, enabled } = body

    // Validate required fields
    if (!accountSid || !authToken || !whatsappNumber) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validate format
    if (!accountSid.startsWith('AC')) {
      return NextResponse.json(
        { error: 'Account SID debe comenzar con "AC"' },
        { status: 400 }
      )
    }

    if (!whatsappNumber.startsWith('+')) {
      return NextResponse.json(
        { error: 'El número de WhatsApp debe comenzar con "+"' },
        { status: 400 }
      )
    }

    const settings: TwilioSettings = {
      accountSid,
      authToken,
      whatsappNumber,
      enabled: enabled ?? true,
      updatedAt: new Date().toISOString()
    }

    // Upsert settings
    const { error } = await db
      .from('app_settings')
      .upsert({
        key: SETTINGS_KEY,
        value: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      })

    if (error) {
      console.error('[Twilio Settings] Error saving:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada correctamente'
    })

  } catch (error) {
    console.error('[Twilio Settings] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/settings/twilio
 * Delete Twilio configuration
 */
export async function DELETE() {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response
    }

    const { error } = await db
      .from('app_settings')
      .delete()
      .eq('key', SETTINGS_KEY)

    if (error) {
      console.error('[Twilio Settings] Error deleting:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada'
    })

  } catch (error) {
    console.error('[Twilio Settings] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function maskValue(value: string): string {
  if (!value || value.length < 8) return '••••••••'
  return value.slice(0, 4) + '••••••••' + value.slice(-4)
}
