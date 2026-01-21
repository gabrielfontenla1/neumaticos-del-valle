'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { X, Upload, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  onUpload: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFile = (file: File): string | null => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return 'Solo se permiten archivos JPEG, PNG o WebP'
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return 'El archivo no puede superar los 5MB'
    }

    return null
  }

  const processFile = async (file: File) => {
    setError(null)

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsUploading(true)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const result = await onUpload(file)

      if (result.success && result.url) {
        onChange(result.url)
        setPreview(result.url)
      } else {
        setError(result.error || 'Error al subir la imagen')
        setPreview(null)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Error al procesar la imagen')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        await processFile(file)
      }
    },
    [disabled, onUpload, onChange]
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {preview ? (
        // Preview state
        <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={preview.startsWith('data:')}
          />

          {/* Overlay with remove button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-white">Subiendo...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Upload zone
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'w-full aspect-[21/9] rounded-lg border-2 border-dashed transition-all cursor-pointer',
            'flex flex-col items-center justify-center gap-3',
            'bg-neutral-900/50 hover:bg-neutral-900',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-neutral-700 hover:border-neutral-600',
            disabled && 'opacity-50 cursor-not-allowed',
            isUploading && 'cursor-wait'
          )}
        >
          {isUploading ? (
            <>
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-neutral-400">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-neutral-800">
                {isDragging ? (
                  <Upload className="w-6 h-6 text-primary" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-200">
                  {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  JPEG, PNG o WebP (máx. 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
