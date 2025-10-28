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
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span className="text-gray-900">{formatPrice(totals.subtotal)}</span>
      </div>

      {/* IVA info - already included */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 text-xs">IVA incluido</span>
        <span className="text-gray-500 text-xs">19%</span>
      </div>

      {/* Shipping info */}
      {totals.shipping > 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Envío</span>
          <span className="text-gray-900">{formatPrice(totals.shipping)}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Envío</span>
          <span className="text-green-600 text-xs font-medium">A coordinar</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t pt-3">
        {/* Total */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-semibold text-gray-900">Total</span>
            <p className="text-xs text-gray-500 mt-0.5">
              {totals.items_count} {totals.items_count === 1 ? 'producto' : 'productos'}
            </p>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(totals.total)}
          </span>
        </div>
      </div>

      {/* Savings message if applicable */}
      {totals.subtotal > totals.total && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700 font-medium text-center">
            ¡Ahorraste {formatPrice(totals.subtotal - totals.total)}!
          </p>
        </div>
      )}
    </div>
  )
}