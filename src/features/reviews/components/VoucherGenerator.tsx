'use client'

import { useState, useEffect } from 'react'
import { Gift, Copy, Check, Download } from 'lucide-react'
import { generateServiceVoucher } from '../api'
import { ServiceVoucher } from '../types'

interface VoucherGeneratorProps {
  onClose?: () => void
}

export function VoucherGenerator({ onClose }: VoucherGeneratorProps) {
  const [voucher, setVoucher] = useState<ServiceVoucher | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkAndGenerateVoucher()
  }, [])

  const checkAndGenerateVoucher = async () => {
    const reviewId = sessionStorage.getItem('eligible_review_id')
    const customerDataStr = sessionStorage.getItem('review_customer_data')

    if (!reviewId || !customerDataStr) {
      return
    }

    const customerData = JSON.parse(customerDataStr)
    setIsGenerating(true)

    const generatedVoucher = await generateServiceVoucher(reviewId, customerData)

    if (generatedVoucher) {
      setVoucher(generatedVoucher)
    }

    setIsGenerating(false)
  }

  const copyCode = () => {
    if (voucher) {
      navigator.clipboard.writeText(voucher.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareVoucher = () => {
    if (voucher) {
      const message = `🎁 ¡Felicitaciones! Has recibido un voucher de Neumáticos del Valle

Código: ${voucher.code}
Servicio: Inspección gratuita de neumáticos
Válido hasta: ${new Date(voucher.valid_until).toLocaleDateString('es-CL')}

Presenta este código en cualquiera de nuestras sucursales para hacer válido tu beneficio.

¡Gracias por tu confianza!`

      // Try to share via Web Share API
      if (navigator.share) {
        navigator.share({
          title: 'Mi Voucher - Neumáticos del Valle',
          text: message
        })
      } else {
        // Fallback to WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
      }
    }
  }

  const downloadVoucher = () => {
    if (voucher) {
      const voucherData = `
VOUCHER DE SERVICIO
Neumáticos del Valle

================================
Código: ${voucher.code}
================================

Cliente: ${voucher.customer_name}
Teléfono: ${voucher.customer_phone}

Servicio: Inspección gratuita de neumáticos
Valor: GRATIS

Válido desde: ${new Date(voucher.valid_from).toLocaleDateString('es-CL')}
Válido hasta: ${new Date(voucher.valid_until).toLocaleDateString('es-CL')}

Instrucciones:
1. Presenta este voucher en cualquier sucursal
2. Menciona el código al personal
3. Disfruta tu servicio gratuito

¡Gracias por tu preferencia!
`
      const blob = new Blob([voucherData], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voucher-${voucher.code}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (isGenerating) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Generando tu voucher de regalo...</p>
      </div>
    )
  }

  if (!voucher) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-center">
        <Gift className="w-16 h-16 mx-auto mb-3 text-white" />
        <h2 className="text-2xl font-bold text-white">¡Felicitaciones!</h2>
        <p className="text-white/90 mt-2">Has ganado un servicio gratuito</p>
      </div>

      {/* Voucher Details */}
      <div className="p-6 space-y-6">
        {/* Code Display */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tu código de voucher</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-mono font-bold text-yellow-500">
              {voucher.code}
            </span>
            <button
              onClick={copyCode}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Copiar código"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-gray-600 dark:text-gray-400">Servicio:</span>
            <span className="font-semibold text-right">Inspección gratuita de neumáticos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Cliente:</span>
            <span className="font-medium">{voucher.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Válido hasta:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {new Date(voucher.valid_until).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            ¿Cómo usar tu voucher?
          </h4>
          <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
            <li>Guarda este código o toma una captura de pantalla</li>
            <li>Visita cualquiera de nuestras sucursales</li>
            <li>Presenta el código al personal de servicio</li>
            <li>¡Disfruta tu inspección gratuita!</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={downloadVoucher}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Descargar</span>
          </button>
          <button
            onClick={shareVoucher}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span className="text-sm font-medium">Compartir</span>
          </button>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  )
}