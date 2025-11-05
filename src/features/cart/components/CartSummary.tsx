'use client'

import { CartTotals } from '../types'

interface CartSummaryProps {
  totals: CartTotals
}

export function CartSummary({ totals }: CartSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="space-y-4">
      {/* Products */}
      <div className="flex items-center justify-between">
        <span className="text-base text-gray-600">Productos</span>
        <span className="text-base font-semibold text-gray-900">{formatPrice(totals.subtotal)}</span>
      </div>

      {/* Shipping */}
      <div className="flex items-center justify-between">
        <span className="text-base text-gray-600">Envío</span>
        <span className="text-base font-semibold text-green-600">Gratis</span>
      </div>

      {/* Coupon field */}
      <div className="pt-2">
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Ingresar código de cupón
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-4">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Total</span>
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(totals.total)}
          </span>
        </div>
      </div>

      {/* Savings message if applicable */}
      {totals.subtotal > totals.total && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-green-700 font-semibold">
            ¡Ahorraste {formatPrice(totals.subtotal - totals.total)}!
          </p>
        </div>
      )}
    </div>
  )
}