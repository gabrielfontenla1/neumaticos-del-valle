import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'

// Supabase error type for error handling
interface SupabaseErrorLike {
  code?: string
  message?: string
}

let supabaseInstance: SupabaseClient<Database> | null = null

/**
 * Get Supabase client instance with lazy initialization
 * Validates environment variables at runtime, not build time
 */
function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    // Create a single supabase client for interacting with your database
    // Using explicit type parameters for better type inference
    supabaseInstance = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'x-application-name': 'neumaticos-del-valle'
          }
        },
        db: {
          schema: 'public'
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    )
  }

  return supabaseInstance
}

// Export client with proxy for backward compatibility
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getSupabaseClient()
    return client[prop as keyof SupabaseClient<Database>]
  }
})

// Type-safe table access
export type Tables = Database['public']['Tables']
export type TableName = keyof Tables

// Helper functions for common operations
export const handleSupabaseError = (error: unknown) => {
  // Type guard to check if error has Supabase error structure
  const supabaseError = error as PostgrestError | SupabaseErrorLike | null

  if (supabaseError?.code === 'PGRST116') {
    return { error: 'No se encontraron datos' }
  }
  if (supabaseError?.code === '23505') {
    return { error: 'El registro ya existe' }
  }
  if (supabaseError?.code === '23503') {
    return { error: 'Referencia a datos inexistentes' }
  }
  if (supabaseError?.code === '22P02') {
    return { error: 'Formato de datos inválido' }
  }

  console.error('Supabase error:', error)
  return { error: supabaseError?.message || 'Error al procesar la solicitud' }
}

// Storage helpers
export const STORAGE_BUCKETS = {
  products: 'products',
  reviews: 'reviews',
  vouchers: 'vouchers',
  branches: 'branches'
} as const

export const getPublicUrl = (bucket: keyof typeof STORAGE_BUCKETS, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const uploadFile = async (
  bucket: keyof typeof STORAGE_BUCKETS,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? false,
      contentType: options?.contentType ?? file.type,
      cacheControl: '3600'
    })

  if (error) return handleSupabaseError(error)
  return { data, publicUrl: getPublicUrl(bucket, data.path) }
}

export const deleteFile = async (bucket: keyof typeof STORAGE_BUCKETS, paths: string[]) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths)

  if (error) return handleSupabaseError(error)
  return { success: true }
}