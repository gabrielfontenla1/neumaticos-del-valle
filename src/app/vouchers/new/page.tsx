'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Save,
  Calendar,
  Percent,
  DollarSign,
  User,
  Phone,
  Mail,
  FileText,
  Package
} from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string
  price: number
}

interface VoucherProfile {
  id: string
  role: 'admin' | 'vendedor' | 'user'
  branch_id?: string
  [key: string]: unknown
}

export default function NewVoucherPage() {
  const [formData, setFormData] = useState({
    code: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    amount: '',
    discount_percentage: '',
    product_id: '',
    valid_until: '',
    notes: ''
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<VoucherProfile | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)

        // Check if user can create vouchers
        if (profileData.role !== 'admin' && profileData.role !== 'vendedor') {
          router.push('/dashboard')
          return
        }
      }

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, brand, price')
        .order('name')

      setProducts(productsData || [])

      // Generate voucher code
      generateVoucherCode()
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Error al cargar los datos')
    }
  }

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate form
      if (!formData.customer_name || !formData.customer_phone || !formData.amount ||
          !formData.discount_percentage || !formData.valid_until) {
        setError('Por favor completa todos los campos obligatorios')
        setLoading(false)
        return
      }

      // Verify profile is loaded
      if (!profile) {
        setError('No se pudo verificar el usuario. Por favor recarga la página.')
        setLoading(false)
        return
      }

      // Create voucher
      const { error: insertError } = await supabase
        .from('vouchers')
        .insert({
          code: formData.code,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email || null,
          customer_phone: formData.customer_phone,
          amount: parseFloat(formData.amount),
          discount_percentage: parseFloat(formData.discount_percentage),
          product_id: formData.product_id || null,
          status: 'active',
          valid_until: formData.valid_until,
          created_by: profile.id,
          branch_id: profile.branch_id,
          notes: formData.notes || null
        })

      if (insertError) {
        if (insertError.message?.includes('duplicate')) {
          setError('El código del voucher ya existe. Generando nuevo código...')
          generateVoucherCode()
        } else {
          setError(insertError.message)
        }
      } else {
        // Success - redirect to vouchers list
        router.push('/vouchers/manage')
      }
    } catch (error) {
      console.error('Error creating voucher:', error)
      setError('Error al crear el voucher')
    } finally {
      setLoading(false)
    }
  }

  // Calculate expiry date (30 days from now by default)
  useEffect(() => {
    const today = new Date()
    today.setDate(today.getDate() + 30)
    const defaultExpiry = today.toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, valid_until: defaultExpiry }))
  }, [])

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/vouchers/manage" className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Crear Nuevo Voucher</h1>
              <p className="text-gray-400 text-sm">
                Genera un voucher de descuento para un cliente
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Voucher Code */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código del Voucher
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent font-mono"
                  readOnly
                />
                <button
                  type="button"
                  onClick={generateVoucherCode}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  Generar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Cliente *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Teléfono del Cliente *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                    placeholder="(0383) 123-4567"
                  />
                </div>
              </div>

              {/* Customer Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email del Cliente
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                    placeholder="cliente@email.com"
                  />
                </div>
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Válido Hasta *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monto Máximo *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                    placeholder="5000"
                  />
                </div>
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Porcentaje de Descuento *
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                    required
                    min="1"
                    max="100"
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Producto Específico (Opcional)
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                >
                  <option value="">Sin restricción de producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.brand} - {product.name} (${product.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notas (Opcional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                  placeholder="Notas adicionales sobre el voucher..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
              <Link
                href="/vouchers/manage"
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-[#FFC700] text-black font-semibold rounded-lg hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Crear Voucher
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  )
}