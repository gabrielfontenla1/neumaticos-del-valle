'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Tag,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Home,
  ChevronLeft
} from 'lucide-react'

type VoucherStatus = 'active' | 'used' | 'cancelled' | 'expired'

interface Voucher {
  id: string
  code: string
  customer_name: string
  customer_email: string
  customer_phone: string
  amount: number
  discount_percentage: number
  product_id: string | null
  status: VoucherStatus
  valid_until: string
  created_by: string
  branch_id: string
  notes: string | null
  created_at: string
  used_at: string | null
}

interface VoucherStatusUpdate {
  status: VoucherStatus
  used_at?: string
  used_by?: string
}

interface UserProfile {
  id: string
  role: 'admin' | 'vendedor' | 'user'
  [key: string]: unknown
}

export default function ManageVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadVouchers()
  }, [])

  useEffect(() => {
    filterVouchers()
  }, [vouchers, searchTerm, statusFilter])

  const loadVouchers = async () => {
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

        // Check if user can manage vouchers
        if (profileData.role !== 'admin' && profileData.role !== 'vendedor') {
          router.push('/dashboard')
          return
        }

        // Fetch vouchers based on role
        let query = supabase
          .from('vouchers')
          .select('*')
          .order('created_at', { ascending: false })

        if (profileData.role === 'vendedor' && profileData.branch_id) {
          query = query.eq('branch_id', profileData.branch_id)
        }

        const { data: vouchersData } = await query
        setVouchers(vouchersData || [])

        // Check and update expired vouchers
        const today = new Date().toISOString().split('T')[0]
        for (const voucher of vouchersData || []) {
          if (voucher.status === 'active' && voucher.valid_until < today) {
            await supabase
              .from('vouchers')
              .update({ status: 'expired' })
              .eq('id', voucher.id)
          }
        }
      }
    } catch (error) {
      console.error('Error loading vouchers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterVouchers = () => {
    let filtered = [...vouchers]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.customer_phone.includes(searchTerm)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter)
    }

    setFilteredVouchers(filtered)
  }

  const handleStatusChange = async (voucherId: string, newStatus: VoucherStatus) => {
    try {
      const updates: VoucherStatusUpdate = { status: newStatus }
      if (newStatus === 'used' && profile) {
        updates.used_at = new Date().toISOString()
        updates.used_by = profile.id
      }

      const { error } = await supabase
        .from('vouchers')
        .update(updates)
        .eq('id', voucherId)

      if (!error) {
        // Update local state
        setVouchers(prev => prev.map(v =>
          v.id === voucherId
            ? { ...v, status: newStatus, used_at: updates.used_at || null }
            : v
        ))
      }
    } catch (error) {
      console.error('Error updating voucher status:', error)
    }
  }

  const exportVouchers = () => {
    const csv = [
      ['Código', 'Cliente', 'Email', 'Teléfono', 'Descuento', 'Monto', 'Estado', 'Válido Hasta', 'Creado'],
      ...filteredVouchers.map(v => [
        v.code,
        v.customer_name,
        v.customer_email,
        v.customer_phone,
        `${v.discount_percentage}%`,
        `$${v.amount}`,
        v.status,
        new Date(v.valid_until).toLocaleDateString(),
        new Date(v.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vouchers_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#FFC700]"></div>
      </div>
    )
  }

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.status === 'active').length,
    used: vouchers.filter(v => v.status === 'used').length,
    expired: vouchers.filter(v => v.status === 'expired').length
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Gestión de Vouchers</h1>
                <p className="text-gray-400 text-sm">
                  Administra los vouchers de descuento
                </p>
              </div>
            </div>
            <Link
              href="/vouchers/new"
              className="flex items-center gap-2 bg-[#FFC700] text-black font-semibold py-2 px-4 rounded-lg hover:bg-[#FFD700] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Voucher</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Activos</p>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Usados</p>
            <p className="text-2xl font-bold text-gray-400">{stats.used}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-400 text-sm">Expirados</p>
            <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="used">Usados</option>
              <option value="cancelled">Cancelados</option>
              <option value="expired">Expirados</option>
            </select>

            {/* Export Button */}
            <button
              onClick={exportVouchers}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Descuento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Válido Hasta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredVouchers.length > 0 ? (
                  filteredVouchers.map((voucher) => (
                    <motion.tr
                      key={voucher.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-white font-mono font-medium">
                          {voucher.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white">{voucher.customer_name}</p>
                          <p className="text-gray-400 text-sm">{voucher.customer_phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#FFC700] font-semibold">
                          {voucher.discount_percentage}%
                        </span>
                        <span className="text-gray-400 ml-2">
                          (${voucher.amount})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-300">
                          {new Date(voucher.valid_until).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            voucher.status === 'active'
                              ? 'bg-green-500/20 text-green-400'
                              : voucher.status === 'used'
                              ? 'bg-gray-500/20 text-gray-400'
                              : voucher.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {voucher.status === 'active' ? 'Activo' :
                           voucher.status === 'used' ? 'Usado' :
                           voucher.status === 'cancelled' ? 'Cancelado' : 'Expirado'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {voucher.status === 'active' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(voucher.id, 'used')}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Marcar como usado"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(voucher.id, 'cancelled')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Cancelar"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron vouchers
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}