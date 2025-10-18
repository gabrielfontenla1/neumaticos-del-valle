'use client'

import { useState } from 'react'
import { Star, Send, CheckCircle } from 'lucide-react'
import { submitReview } from '../api'
import { ReviewSubmission } from '../types'

interface ReviewFormProps {
  productId: string
  productName: string
  purchaseCode?: string
  onSuccess?: () => void
}

export function ReviewForm({ productId, productName, purchaseCode, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    comment: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Por favor selecciona una calificación')
      return
    }

    if (!formData.name || !formData.phone || !formData.comment) {
      setError('Por favor completa los campos requeridos')
      return
    }

    setIsSubmitting(true)
    setError('')

    const review: ReviewSubmission = {
      product_id: productId,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      rating,
      title: formData.title,
      comment: formData.comment,
      purchase_code: purchaseCode
    }

    const result = await submitReview(review)

    if (result) {
      setIsSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 2000)
    } else {
      setError('Error al enviar la reseña. Por favor intenta nuevamente.')
    }

    setIsSubmitting(false)
  }

  if (isSuccess) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-semibold mb-2">¡Gracias por tu reseña!</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Tu opinión es muy importante para nosotros.
          {rating >= 4 && (
            <span className="block mt-2 font-medium text-green-600 dark:text-green-400">
              ¡Pronto recibirás un voucher de regalo por tu excelente calificación!
            </span>
          )}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Califica tu experiencia</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {productName}
        </p>

        {/* Star Rating */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {rating === 5 && '¡Excelente!'}
            {rating === 4 && 'Muy bueno'}
            {rating === 3 && 'Bueno'}
            {rating === 2 && 'Regular'}
            {rating === 1 && 'Malo'}
          </p>
        )}
      </div>

      {/* Customer Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nombre completo *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400"
            placeholder="+569XXXXXXXX"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Correo electrónico (opcional)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Título de tu reseña (opcional)
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400"
          placeholder="Ej: Excelente calidad y servicio"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Tu comentario *
        </label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400 h-32 resize-none"
          placeholder="Cuéntanos tu experiencia con el producto..."
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {rating >= 4 && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            <span className="font-semibold">¡Beneficio especial!</span> Al dejar una reseña de 4 o 5 estrellas,
            recibirás un voucher para una inspección gratuita de neumáticos.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar Reseña
          </>
        )}
      </button>
    </form>
  )
}