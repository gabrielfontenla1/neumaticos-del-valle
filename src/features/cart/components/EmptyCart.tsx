'use client'

import { Button } from '@/components/ui/button'
import { ShoppingBag, TrendingUp, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EmptyCartProps {
  onClose: () => void
}

export function EmptyCart({ onClose }: EmptyCartProps) {
  const router = useRouter()

  const handleGoToProducts = () => {
    onClose()
    router.push('/productos')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-semibold text-xs">0</span>
        </div>
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Tu carrito está vacío
      </h3>
      <p className="text-sm text-gray-500 text-center mb-8 max-w-sm">
        Agrega los neumáticos que necesitas y envía tu pedido por WhatsApp para recibir atención personalizada
      </p>

      {/* CTA */}
      <Button
        onClick={handleGoToProducts}
        className="mb-8"
        size="lg"
      >
        Ver productos disponibles
      </Button>

      {/* Benefits */}
      <div className="w-full space-y-4 border-t pt-6">
        <h4 className="text-sm font-medium text-gray-900">
          ¿Por qué comprar con nosotros?
        </h4>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Mejores precios del mercado
              </p>
              <p className="text-xs text-gray-500">
                Trabajamos directo con importadores
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Stock garantizado
              </p>
              <p className="text-xs text-gray-500">
                Amplia variedad de marcas y medidas
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Atención rápida
              </p>
              <p className="text-xs text-gray-500">
                Respuesta inmediata por WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}