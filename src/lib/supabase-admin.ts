import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Administrative Supabase client with SERVICE_ROLE_KEY
 *
 * ⚠️ IMPORTANT: This client bypasses Row Level Security (RLS)
 * - Use ONLY in server-side code (API routes, server components)
 * - NEVER expose this client or the SERVICE_ROLE_KEY to the browser
 * - Only use for admin operations like bulk imports, system tasks
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY - required for admin operations')
}

// Create admin client with SERVICE_ROLE_KEY (bypasses RLS)
// Typed version for strict type checking
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-application-name': 'neumaticos-del-valle-admin'
      }
    },
    db: {
      schema: 'public'
    }
  }
)

// Untyped version for flexible CRUD operations (useful when Database types are incomplete)
export const supabaseAdminUntyped = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-application-name': 'neumaticos-del-valle-admin'
      }
    },
    db: {
      schema: 'public'
    }
  }
)
