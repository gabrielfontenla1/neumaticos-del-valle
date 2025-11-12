'use client'

import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
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
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
        size="default"
      >
        Explorar productos
      </Button>
    </div>
  )
}