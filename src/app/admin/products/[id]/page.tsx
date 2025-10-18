// Product Details Page - Complete Information Display
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  Ruler,
  Gauge,
  Shield,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  input: '#262626',
  secondary: '#262626',
}

interface Product {
  id: string
  name: string
  sku: string
  brand_name: string
  model: string | null
  category: string | null
  size: string | null
  width: number | null
  profile: number | null
  diameter: number | null
  aspect_ratio: number | null
  rim_diameter: number | null
  construction: string | null
  load_index: string | null
  speed_rating: string | null
  extra_load: boolean
  run_flat: boolean
  seal_inside: boolean
  tube_type: boolean
  homologation: string | null
  description: string | null
  original_description: string
  display_name: string
  size_display: string
  price: number
  stock: number
  image_url: string | null
  features: string[] | null
  parse_confidence: number
  parse_warnings: string[]
  created_at: string
  updated_at: string
  slug: string
}

interface BranchStock {
  branch_id: string
  quantity: number
  last_updated: string
}

const BRANCHES = {
  '5f02d7b2-aaa6-4241-b5c0-8ac5046e836a': 'BELGRANO',
  '231fee71-54fc-45a8-aacd-aad14d36a69e': 'CATAMARCA',
  'aa8b29e4-c73b-4700-8b0b-d9df053edb0e': 'LA_BANDA',
  'a4670ae9-dda6-42c5-8b73-bbe24553ac41': 'SALTA',
  'b6c750e5-e7fe-4594-a985-cc9eddb310e4': 'TUCUMAN',
  'fec649b5-b4f4-4b14-8ba5-20603b6ad950': 'VIRGEN'
}

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [branchStocks, setBranchStocks] = useState<BranchStock[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadProductDetails(params.id as string)
    }
  }, [params.id])

  const loadProductDetails = async (productId: string) => {
    setIsLoading(true)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Load product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!productError && productData) {
      setProduct(productData as Product)
    }

    // Load branch stocks
    const { data: stockData, error: stockError } = await supabase
      .from('branch_stock')
      .select('*')
      .eq('product_id', productId)

    if (!stockError && stockData) {
      setBranchStocks(stockData as BranchStock[])
    }

    setIsLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-6" style={{
      backgroundColor: colors.card,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
    }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
        {title}
      </h3>
      {children}
    </div>
  )

  const DataRow = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderBottomColor: colors.border }}>
      <div className="flex items-center gap-2">
        {icon && <span style={{ color: colors.mutedForeground }}>{icon}</span>}
        <span style={{ color: colors.mutedForeground }}>{label}</span>
      </div>
      <span className="font-medium" style={{ color: colors.foreground }}>
        {value ?? 'N/A'}
      </span>
    </div>
  )

  const BooleanBadge = ({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) => (
    <span className="px-3 py-1 text-sm font-medium rounded-full inline-flex items-center gap-1"
      style={{
        backgroundColor: value ? '#14532d20' : '#7f1d1d20',
        color: value ? '#86efac' : '#fca5a5'
      }}>
      {value ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {value ? trueLabel : falseLabel}
    </span>
  )

  if (isLoading) {
    return (
      <div>
        <DashboardSkeleton />
      </div>
    )
  }

  if (!product) {
    return (
      <div>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: '#f59e0b' }} />
          <p className="text-lg" style={{ color: colors.foreground }}>
            Producto no encontrado
          </p>
          <button
            onClick={() => router.push('/admin/products')}
            className="mt-4 px-4 py-2 rounded-lg font-semibold transition-all"
            style={{ backgroundColor: colors.primary, color: '#ffffff' }}
          >
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/products')}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: colors.card }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: colors.foreground }} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: colors.foreground }}>
                {product.display_name}
              </h1>
              <p className="mt-1" style={{ color: colors.mutedForeground }}>
                SKU: {product.sku}
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <InfoCard title="Información General">
              <div className="space-y-2">
                <DataRow label="Nombre del Producto" value={product.name} icon={<Package className="w-4 h-4" />} />
                <DataRow label="Marca" value={product.brand_name} />
                <DataRow label="Modelo" value={product.model} />
                <DataRow label="Categoría" value={product.category} />
                <DataRow label="Código Interno (SKU)" value={product.sku} />
                <DataRow
                  label="Precio"
                  value={formatCurrency(product.price)}
                  icon={<DollarSign className="w-4 h-4" />}
                />
                <DataRow label="Stock Total en Todas las Sucursales" value={`${product.stock} unidades`} />
              </div>
            </InfoCard>

            {/* Technical Specifications */}
            <InfoCard title="Medidas y Especificaciones">
              <div className="space-y-2">
                <DataRow label="Medida Completa" value={product.size_display} icon={<Ruler className="w-4 h-4" />} />
                <DataRow label="Ancho del Neumático" value={product.width ? `${product.width} mm` : null} />
                <DataRow label="Perfil (Altura)" value={product.profile ? `${product.profile}%` : null} />
                <DataRow label="Relación de Aspecto" value={product.aspect_ratio ? `${product.aspect_ratio}%` : null} />
                <DataRow label="Diámetro Total" value={product.diameter ? `${product.diameter} pulgadas` : null} />
                <DataRow label="Diámetro de Aro/Llanta" value={product.rim_diameter ? `${product.rim_diameter} pulgadas` : null} />
                <DataRow label="Tipo de Construcción" value={product.construction === 'R' ? 'Radial (R)' : product.construction} />
                <DataRow label="Índice de Carga" value={product.load_index} icon={<Gauge className="w-4 h-4" />} />
                <DataRow label="Índice de Velocidad Máxima" value={product.speed_rating} />
              </div>
            </InfoCard>

            {/* Features & Characteristics */}
            <InfoCard title="Características Especiales">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: colors.mutedForeground }}>Reforzado (Extra Load)</span>
                  <BooleanBadge value={product.extra_load} trueLabel="Sí" falseLabel="No" />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: colors.mutedForeground }}>Run Flat (Antipinchazos)</span>
                  <BooleanBadge value={product.run_flat} trueLabel="Sí" falseLabel="No" />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: colors.mutedForeground }}>Autosellante</span>
                  <BooleanBadge value={product.seal_inside} trueLabel="Sí" falseLabel="No" />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: colors.mutedForeground }}>Requiere Cámara</span>
                  <BooleanBadge value={product.tube_type} trueLabel="Sí, con cámara" falseLabel="No, sin cámara" />
                </div>
                {product.homologation && (
                  <DataRow label="Homologación de Fábrica" value={product.homologation} icon={<Shield className="w-4 h-4" />} />
                )}
              </div>
            </InfoCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Stock by Branch */}
            <InfoCard title="Stock por Sucursal">
              <div className="space-y-3">
                {branchStocks.map((stock) => {
                  const branchName = BRANCHES[stock.branch_id as keyof typeof BRANCHES] || stock.branch_id
                  return (
                    <div key={stock.branch_id} className="flex items-center justify-between py-2 border-b"
                      style={{ borderBottomColor: colors.border }}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" style={{ color: colors.mutedForeground }} />
                        <span style={{ color: colors.foreground }}>{branchName}</span>
                      </div>
                      <span className="px-3 py-1 text-sm font-medium rounded-full"
                        style={{
                          backgroundColor: stock.quantity === 0 ? '#7f1d1d20' : stock.quantity < 5 ? '#78350f20' : '#14532d20',
                          color: stock.quantity === 0 ? '#fca5a5' : stock.quantity < 5 ? '#fcd34d' : '#86efac'
                        }}>
                        {stock.quantity} unidades
                      </span>
                    </div>
                  )
                })}
              </div>
            </InfoCard>

            {/* Parsing Information */}
            <InfoCard title="Información del Análisis Inteligente">
              <div className="space-y-2">
                <DataRow label="Descripción del Excel Original" value={product.original_description} />
                <DataRow label="Nombre Procesado y Limpio" value={product.display_name} />
                <div className="flex items-center justify-between py-2">
                  <span style={{ color: colors.mutedForeground }}>Precisión del Análisis</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.secondary }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${product.parse_confidence}%`,
                          backgroundColor: product.parse_confidence >= 90 ? '#86efac' : product.parse_confidence >= 70 ? '#fcd34d' : '#fca5a5'
                        }}
                      />
                    </div>
                    <span className="font-medium" style={{ color: colors.foreground }}>
                      {product.parse_confidence}%
                    </span>
                  </div>
                </div>
                {product.parse_warnings && product.parse_warnings.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#78350f20' }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: '#fcd34d' }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1" style={{ color: '#fcd34d' }}>
                          Notas del Sistema:
                        </p>
                        <ul className="text-sm space-y-1" style={{ color: colors.mutedForeground }}>
                          {product.parse_warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Metadata */}
            <InfoCard title="Información del Sistema">
              <div className="space-y-2">
                <DataRow label="ID del Producto" value={product.id} />
                <DataRow
                  label="Registrado el"
                  value={formatDate(product.created_at)}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <DataRow
                  label="Última Modificación"
                  value={formatDate(product.updated_at)}
                  icon={<Calendar className="w-4 h-4" />}
                />
                {product.description && (
                  <div className="pt-2">
                    <p className="text-sm mb-2" style={{ color: colors.mutedForeground }}>Descripción Adicional:</p>
                    <p className="text-sm" style={{ color: colors.foreground }}>
                      {product.description}
                    </p>
                  </div>
                )}
                {product.features && product.features.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm mb-2" style={{ color: colors.mutedForeground }}>Características Adicionales:</p>
                    <ul className="text-sm space-y-1">
                      {product.features.map((feature, idx) => (
                        <li key={idx} style={{ color: colors.foreground }}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>
        </div>
    </div>
  )
}
