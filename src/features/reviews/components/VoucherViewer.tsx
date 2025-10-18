'use client'

import { useState } from 'react'
import { Search, Gift, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getCustomerVouchers, validateVoucherCode } from '../api'
import { ServiceVoucher } from '../types'

export function VoucherViewer() {
  const [searchMode, setSearchMode] = useState<'phone' | 'code'>('phone')
  const [searchValue, setSearchValue] = useState('')
  const [vouchers, setVouchers] = useState<ServiceVoucher[]>([])
  const [validationResult, setValidationResult] = useState<{
    is_valid: boolean
    voucher?: ServiceVoucher
    error?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchValue.trim()) return

    setIsLoading(true)
    setValidationResult(null)
    setVouchers([])

    if (searchMode === 'phone') {
      const result = await getCustomerVouchers(searchValue)
      setVouchers(result)
    } else {
      const result = await validateVoucherCode(searchValue.toUpperCase())
      setValidationResult(result)
    }

    setIsLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'redeemed':
        return <CheckCircle className="w-5 h-5 text-gray-500" />
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'redeemed':
        return 'Usado'
      case 'expired':
        return 'Expirado'
      default:
        return 'Pendiente'
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Gift className="w-6 h-6 text-yellow-500" />
          Mis Vouchers
        </h2>

        {/* Search Mode Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchMode('phone')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              searchMode === 'phone'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Buscar por teléfono
          </button>
          <button
            onClick={() => setSearchMode('code')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              searchMode === 'code'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Validar código
          </button>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={
              searchMode === 'phone'
                ? 'Ingresa tu teléfono (ej: +569XXXXXXXX)'
                : 'Ingresa el código del voucher (ej: NDV-XXXXX)'
            }
            className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Buscar
          </button>
        </div>

        {/* Results */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Buscando...</p>
          </div>
        )}

        {/* Validation Result (for code search) */}
        {validationResult && (
          <div className={`rounded-lg p-6 ${
            validationResult.is_valid
              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
              : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
          }`}>
            {validationResult.is_valid && validationResult.voucher ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                    Voucher Válido
                  </h3>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Código:</span> {validationResult.voucher.code}</p>
                  <p><span className="font-medium">Cliente:</span> {validationResult.voucher.customer_name}</p>
                  <p><span className="font-medium">Servicio:</span> Inspección gratuita</p>
                  <p><span className="font-medium">Válido hasta:</span> {new Date(validationResult.voucher.valid_until).toLocaleDateString('es-CL')}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-300">
                    Voucher Inválido
                  </h3>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {validationResult.error || 'El código ingresado no es válido'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vouchers List (for phone search) */}
        {vouchers.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Tus vouchers ({vouchers.length})
            </h3>
            {vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono font-bold text-lg">{voucher.code}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Inspección gratuita
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(voucher.status)}
                    <span className={`text-sm font-medium ${
                      voucher.status === 'active' ? 'text-green-600 dark:text-green-400' :
                      voucher.status === 'redeemed' ? 'text-gray-600 dark:text-gray-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {getStatusText(voucher.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Creado: {new Date(voucher.created_at).toLocaleDateString('es-CL')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Válido hasta: {new Date(voucher.valid_until).toLocaleDateString('es-CL')}</span>
                  </div>
                </div>

                {voucher.status === 'active' && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-400">
                    Presenta este código en cualquier sucursal para hacer válido tu beneficio
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && !validationResult && vouchers.length === 0 && searchValue && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron vouchers</p>
            <p className="text-sm mt-1">Verifica el número de teléfono ingresado</p>
          </div>
        )}
      </div>
    </div>
  )
}