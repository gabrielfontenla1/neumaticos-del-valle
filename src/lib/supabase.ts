import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
// Using explicit type parameters for better type inference
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

// Type-safe table access
export type Tables = Database['public']['Tables']
export type TableName = keyof Tables

// Helper functions for common operations
export const handleSupabaseError = (error: any) => {
  if (error?.code === 'PGRST116') {
    return { error: 'No se encontraron datos' }
  }
  if (error?.code === '23505') {
    return { error: 'El registro ya existe' }
  }
  if (error?.code === '23503') {
    return { error: 'Referencia a datos inexistentes' }
  }
  if (error?.code === '22P02') {
    return { error: 'Formato de datos inválido' }
  }

  console.error('Supabase error:', error)
  return { error: error?.message || 'Error al procesar la solicitud' }
}

// Storage helpers
export const STORAGE_BUCKETS = {
  products: 'products',
  reviews: 'reviews',
  vouchers: 'vouchers'
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