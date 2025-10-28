'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, Minus, Plus, Trash2, MessageCircle, MapPin } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import { CustomerData } from '@/features/cart/types'
import { createVoucher } from '@/features/checkout/api/voucher'
import { openWhatsApp, formatPrice, generateTireDescription } from '@/lib/whatsapp'
import { supabase } from '@/lib/supabase'

interface Store {
  id: string
  name: string
  address: string
  phone: string
  whatsapp: string | null
}

export function QuickCheckout() {
  const {
    items,
    totals,
    isLoading,
    itemCount,
    updateQuantity,
    removeItem,
    clearAll,
    isOpen,
    closeCart
  } = useCart()

  const [stores, setStores] = useState<Store[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    store_id: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Partial<CustomerData>>({})

  // Load stores
  useEffect(() => {
    async function loadStores() {
      const { data } = await supabase
        .from('stores')
        .select('id, name, address, phone, whatsapp')
        .eq('active', true)
        .order('is_main', { ascending: false })

      const storesData = data as Store[]

      if (storesData) {
        setStores(storesData)
        // Set default store
        if (storesData.length > 0 && !formData.store_id) {
          setFormData(prev => ({ ...prev, store_id: storesData[0].id }))
        }
      }
    }

    loadStores()
  }, [])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^[0-9+\-\s]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
    }

    if (!formData.store_id) {
      newErrors.store_id = 'Selecciona una sucursal'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || items.length === 0) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create voucher in database
      const voucher = await createVoucher(formData, items, totals)

      if (voucher) {
        // Get store WhatsApp number
        const store = stores.find(s => s.id === formData.store_id)
        const whatsappNumber = store?.whatsapp || store?.phone

        // Open WhatsApp with message
        openWhatsApp(voucher, whatsappNumber)

        // Store purchase data for post-purchase flow
        sessionStorage.setItem('purchase_completed', 'true')
        sessionStorage.setItem('last_purchase', JSON.stringify({
          voucher_code: voucher.code,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          items: items.map(item => ({
            product_id: item.product_id,
            name: `${item.brand} ${item.name}`,
            quantity: item.quantity
          }))
        }))

        // Clear cart and close
        await clearAll()
        closeCart()

        // Redirect to success page
        window.location.href = `/checkout/success?code=${voucher.code}`
      } else {
        alert('Error al crear el presupuesto. Por favor intenta nuevamente.')
      }
    } catch (error) {
      console.error('Error submitting checkout:', error)
      alert('Error al procesar la solicitud. Por favor intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update form field
  const updateField = (field: keyof CustomerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Mi Carrito ({itemCount})</h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Cargando carrito...
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                  <button
                    onClick={closeCart}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Continuar comprando
                  </button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  {!showForm && (
                    <div className="p-4 space-y-4">
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex gap-4">
                            {/* Product image - Using mock tire image for all products (temporary) */}
                            <img
                              src="/tire.webp"
                              alt={item.name}
                              className="w-20 h-20 object-contain rounded-lg"
                              loading="lazy"
                            />

                            {/* Product details */}
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {item.brand} {item.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {generateTireDescription(item)} - {item.sku}
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-12 text-center font-medium">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    disabled={item.quantity >= item.stock_quantity}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    {item.sale_price ? (
                                      <>
                                        <p className="text-sm text-gray-500 line-through">
                                          {formatPrice(item.price * item.quantity)}
                                        </p>
                                        <p className="font-semibold text-green-600">
                                          {formatPrice(item.sale_price * item.quantity)}
                                        </p>
                                      </>
                                    ) : (
                                      <p className="font-semibold">
                                        {formatPrice(item.price * item.quantity)}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Totals */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>{formatPrice(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">IVA (19%)</span>
                          <span>{formatPrice(totals.tax)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                          <span>Total</span>
                          <span>{formatPrice(totals.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Form */}
                  {showForm && (
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                      <h3 className="font-semibold text-lg mb-4">Datos de Contacto</h3>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                            errors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Juan Pérez"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+56 9 1234 5678"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="juan@email.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Store Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sucursal para retiro *
                        </label>
                        <select
                          value={formData.store_id}
                          onChange={(e) => updateField('store_id', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                            errors.store_id ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Selecciona una sucursal</option>
                          {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                              {store.name} - {store.address}
                            </option>
                          ))}
                        </select>
                        {errors.store_id && (
                          <p className="mt-1 text-sm text-red-600">{errors.store_id}</p>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas adicionales (opcional)
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => updateField('notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          rows={3}
                          placeholder="Información adicional sobre tu pedido..."
                        />
                      </div>

                      {/* Back button */}
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        ← Volver al carrito
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* Footer with action buttons */}
            {items.length > 0 && (
              <div className="p-4 border-t space-y-2">
                {!showForm ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Solicitar Presupuesto por WhatsApp
                  </button>
                ) : (
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    {isSubmitting ? 'Procesando...' : 'Enviar por WhatsApp'}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}