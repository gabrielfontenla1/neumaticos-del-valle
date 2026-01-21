import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminAuth } from '@/lib/auth/admin-check'

/**
 * POST /api/admin/branches/upload-image
 * Upload branch background image to Supabase Storage
 * Requires admin authentication
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response as NextResponse
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const branchId = formData.get('branchId') as string

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
        },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'File size exceeds 5MB limit',
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = branchId
      ? `${branchId}-${Date.now()}.${fileExt}`
      : `branch-${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('branches')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload image',
        },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('branches')
      .getPublicUrl(uploadData.path)

    return NextResponse.json(
      {
        success: true,
        url: urlData.publicUrl,
        path: uploadData.path,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/branches/upload-image:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/branches/upload-image
 * Delete branch background image from Supabase Storage
 * Requires admin authentication
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    // Verify admin authentication
    const authResult = await requireAdminAuth()
    if (!authResult.authorized) {
      return authResult.response as NextResponse
    }

    // Get image path from query params
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: path',
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('branches')
      .remove([path])

    if (deleteError) {
      console.error('Error deleting image:', deleteError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete image',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Image deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/admin/branches/upload-image:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
