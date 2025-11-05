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
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xs">0</span>
        </div>
      </div>

      {/* Message */}
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        Tu carrito está vacío
      </h3>
      <p className="text-base text-gray-600 text-center mb-8 max-w-sm">
        ¡No te preocupes! Encontrá los mejores neumáticos para tu vehículo en nuestro catálogo.
      </p>

      {/* CTA */}
      <Button
        onClick={handleGoToProducts}
        className="mb-8 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
        size="default"
      >
        Explorar productos
      </Button>

      {/* Benefits */}
      <div className="w-full max-w-md space-y-4 border-t pt-6">
        <h4 className="text-base font-bold text-gray-900 text-center">
          Beneficios de comprar con nosotros
        </h4>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-bold">Mejores precios</span> - Trabajamos directo con importadores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-bold">Stock garantizado</span> - Amplia variedad de marcas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-yellow-600"
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
              <p className="text-sm text-gray-700">
                <span className="font-bold">Atención rápida</span> - Respuesta inmediata por WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}