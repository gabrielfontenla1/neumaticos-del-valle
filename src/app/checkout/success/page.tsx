'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, MessageCircle, Clock, Package, ArrowLeft, Phone, Copy, Gift, Star, Home } from 'lucide-react'
import { getVoucherByCode } from '@/features/checkout/api/voucher'
import { PostPurchaseFlow } from '@/features/reviews/components'

function SuccessContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [voucher, setVoucher] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (code) {
      loadVoucher(code)
    }
  }, [code])

  const loadVoucher = async (voucherCode: string) => {
    setIsLoading(true)
    const data = await getVoucherByCode(voucherCode)
    if (data && data.length > 0) {
      setVoucher(data[0])
    }
    setIsLoading(false)
  }

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Solicitud Enviada con Éxito!
          </h1>

          {/* Voucher code */}
          {code && (
            <div className="bg-gray-50 rounded-lg p-4 my-6">
              <p className="text-sm text-gray-600 mb-1">Código de presupuesto:</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-blue-600">{code}</p>
                <button
                  onClick={copyCode}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copiar código"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Guarda este código para futuras referencias</p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Tu solicitud de presupuesto ha sido enviada por WhatsApp.
            Nuestro equipo de ventas te contactará a la brevedad para confirmar
            disponibilidad y coordinar el retiro de tus neumáticos.
          </p>

          {/* Next steps */}
          <div className="bg-blue-50 rounded-xl p-6 text-left mb-8">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Próximos pasos:
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Confirmación por WhatsApp</p>
                  <p className="text-sm text-gray-600">
                    Recibirás la confirmación del presupuesto y disponibilidad de stock
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Coordinación de retiro</p>
                  <p className="text-sm text-gray-600">
                    Acordaremos fecha y hora para el retiro en la sucursal seleccionada
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Instalación opcional</p>
                  <p className="text-sm text-gray-600">
                    Si lo deseas, podemos coordinar la instalación de tus neumáticos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="border border-gray-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-600 mb-2">Si tienes alguna consulta, contáctanos:</p>
            <div className="flex justify-center gap-4">
              <a
                href="https://wa.me/5493855870760"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
              <a
                href="tel:+5493855870760"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Phone className="h-5 w-5" />
                Llamar
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver al inicio
            </Link>
            <Link
              href="/productos"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Package className="h-5 w-5" />
              Seguir comprando
            </Link>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-2">
            Tu presupuesto es válido por 7 días a partir de la fecha de emisión.
          </p>
          <p>
            Los precios están sujetos a disponibilidad de stock.
          </p>
        </div>

        {/* Call to Action for Review */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 text-center">
          <div className="flex justify-center mb-4">
            <Star className="w-8 h-8 text-yellow-500" />
            <Star className="w-8 h-8 text-yellow-500" />
            <Star className="w-8 h-8 text-yellow-500" />
            <Star className="w-8 h-8 text-yellow-500" />
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">¡Obtén un Regalo Especial!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Después de tu compra, deja una reseña de 4 o 5 estrellas y recibe un voucher
            para una <span className="font-semibold text-green-600 dark:text-green-400">inspección gratuita de neumáticos</span>.
          </p>
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-lg">
            <Gift className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              Servicio valorado en $15.000
            </span>
          </div>
        </div>
      </div>
    </div>

    {/* Post Purchase Flow Component */}
    <PostPurchaseFlow />
    </>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}