'use client'

import { useState, useEffect } from 'react'
import { Star, Gift, X } from 'lucide-react'
import { ReviewForm } from './ReviewForm'
import { VoucherGenerator } from './VoucherGenerator'

interface PostPurchaseFlowProps {
  productId?: string
  productName?: string
  purchaseCode?: string
  onClose?: () => void
}

export function PostPurchaseFlow({
  productId,
  productName,
  purchaseCode,
  onClose
}: PostPurchaseFlowProps) {
  const [step, setStep] = useState<'intro' | 'review' | 'voucher'>('intro')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Check if user just completed a purchase
    const justPurchased = sessionStorage.getItem('purchase_completed')
    const purchaseData = sessionStorage.getItem('last_purchase')

    if (justPurchased === 'true' && purchaseData) {
      const data = JSON.parse(purchaseData)
      // Show post-purchase flow after a delay
      setTimeout(() => {
        setShowModal(true)
      }, 2000)
    }
  }, [])

  const handleReviewSuccess = () => {
    // Check if voucher should be generated
    const reviewId = sessionStorage.getItem('eligible_review_id')
    if (reviewId) {
      setStep('voucher')
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    setShowModal(false)
    sessionStorage.removeItem('purchase_completed')
    sessionStorage.removeItem('last_purchase')
    sessionStorage.removeItem('eligible_review_id')
    sessionStorage.removeItem('review_customer_data')
    onClose?.()
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        {step === 'intro' && (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">¡Gracias por tu compra!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tu opinión es muy importante para nosotros. Comparte tu experiencia y obtén beneficios exclusivos.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 mb-6">
              <Gift className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                Beneficio Especial
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Deja una reseña de 4 o 5 estrellas y recibe un voucher para una inspección gratuita de neumáticos
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('review')}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Dejar una Reseña
              </button>
              <button
                onClick={handleClose}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Tal vez más tarde
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="p-8">
            <h2 className="text-xl font-bold mb-6">Califica tu compra</h2>
            <ReviewForm
              productId={productId || 'general'}
              productName={productName || 'Tu compra en Neumáticos del Valle'}
              purchaseCode={purchaseCode}
              onSuccess={handleReviewSuccess}
            />
          </div>
        )}

        {step === 'voucher' && (
          <VoucherGenerator onClose={handleClose} />
        )}
      </div>
    </div>
  )
}