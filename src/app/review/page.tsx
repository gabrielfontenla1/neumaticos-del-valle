'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ReviewForm, VoucherGenerator } from '@/features/reviews/components'
import { Star, Gift } from 'lucide-react'

function ReviewContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get('product') || 'general'
  const productName = searchParams.get('name') || 'Tu compra en Neumáticos del Valle'
  const purchaseCode = searchParams.get('code')

  const [showVoucher, setShowVoucher] = useState(false)

  const handleReviewSuccess = () => {
    const reviewId = sessionStorage.getItem('eligible_review_id')
    if (reviewId) {
      setShowVoucher(true)
    }
  }

  if (showVoucher) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-md mx-auto">
          <VoucherGenerator />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Deja tu Reseña
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tu opinión es muy importante para nosotros
          </p>
        </div>

        {/* Benefit Banner */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <Gift className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                Obtén un Regalo Especial
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Deja una reseña de 4 o 5 estrellas y recibe un voucher para una inspección gratuita de neumáticos
              </p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <ReviewForm
            productId={productId}
            productName={productName}
            purchaseCode={purchaseCode || undefined}
            onSuccess={handleReviewSuccess}
          />
        </div>
      </div>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  )
}