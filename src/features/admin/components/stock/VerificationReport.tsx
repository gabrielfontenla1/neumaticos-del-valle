'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  FileJson,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { VerificationResult, VerificationItem } from '../../types/stock-update'

interface VerificationReportProps {
  result: VerificationResult
  onClose: () => void
}

type FilterType = 'all' | 'match' | 'mismatch' | 'not_found'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: 'green' | 'yellow' | 'red' | 'blue'
}) {
  const colorClasses = {
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  }

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: VerificationItem['status'] }) {
  switch (status) {
    case 'match':
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          OK
        </Badge>
      )
    case 'mismatch':
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Diferencia
        </Badge>
      )
    case 'not_found':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          No encontrado
        </Badge>
      )
  }
}

function ItemRow({ item, isExpanded, onToggle }: {
  item: VerificationItem
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-[#3a3a38] last:border-b-0">
      <div
        className={`flex items-center gap-4 p-3 cursor-pointer hover:bg-[#2a2a28] transition-colors ${
          item.status !== 'match' ? 'bg-[#1f1f1d]' : ''
        }`}
        onClick={onToggle}
      >
        <div className="w-8">
          {item.status !== 'match' && (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#888888]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#888888]" />
            )
          )}
        </div>
        <div className="w-28 font-mono text-sm text-[#d97757]">{item.codigo_propio}</div>
        <div className="flex-1 text-sm text-[#fafafa] truncate">{item.descripcion}</div>
        <div className="w-24">
          <StatusBadge status={item.status} />
        </div>
      </div>

      {isExpanded && item.status !== 'match' && (
        <div className="px-12 pb-4 bg-[#1a1a18]">
          {item.differences.map((diff, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 py-1 text-sm text-yellow-300"
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {diff}
            </div>
          ))}

          {item.database && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg p-3 bg-[#262624] border border-[#3a3a38]">
                <div className="text-[#888888] mb-2 font-semibold">Excel</div>
                <div className="space-y-1">
                  <div>Contado: <span className="text-[#fafafa]">${item.excel.contado.toLocaleString()}</span></div>
                  <div>Publico: <span className="text-[#fafafa]">${item.excel.publico.toLocaleString()}</span></div>
                  <div>Stock: <span className="text-[#fafafa]">{item.excel.stock_total}</span></div>
                </div>
              </div>
              <div className="rounded-lg p-3 bg-[#262624] border border-[#3a3a38]">
                <div className="text-[#888888] mb-2 font-semibold">Base de Datos</div>
                <div className="space-y-1">
                  <div>Precio: <span className="text-[#fafafa]">${item.database.price.toLocaleString()}</span></div>
                  <div>Lista: <span className="text-[#fafafa]">${item.database.price_list.toLocaleString()}</span></div>
                  <div>Stock: <span className="text-[#fafafa]">{item.database.stock}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function VerificationReport({ result, onClose }: VerificationReportProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const filteredItems = useMemo(() => {
    if (filter === 'all') return result.items
    return result.items.filter(item => item.status === filter)
  }, [result.items, filter])

  const toggleExpanded = (codigo: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(codigo)) {
        next.delete(codigo)
      } else {
        next.add(codigo)
      }
      return next
    })
  }

  const expandAllMismatches = () => {
    const mismatches = result.items
      .filter(item => item.status !== 'match')
      .map(item => item.codigo_propio)
    setExpandedItems(new Set(mismatches))
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  const exportCSV = () => {
    const headers = [
      'Codigo',
      'Descripcion',
      'Estado',
      'Excel Contado',
      'Excel Publico',
      'Excel Stock',
      'DB Precio',
      'DB Lista',
      'DB Stock',
      'Diferencias',
    ]

    const rows = result.items.map(item => [
      item.codigo_propio,
      item.descripcion,
      item.status,
      item.excel.contado,
      item.excel.publico,
      item.excel.stock_total,
      item.database?.price || '',
      item.database?.price_list || '',
      item.database?.stock || '',
      item.differences.join('; '),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `verificacion_${result.source}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `verificacion_${result.source}_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const successRate = result.total > 0
    ? Math.round((result.matches / result.total) * 100)
    : 0

  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-[#fafafa]">
              Reporte de Verificacion
            </CardTitle>
            <p className="text-sm text-[#888888] mt-1">
              {result.source.toUpperCase()} - {new Date(result.timestamp).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-[#3a3a38]">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#262624] border-[#3a3a38]">
                <DropdownMenuItem onClick={exportCSV} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportJSON} className="cursor-pointer">
                  <FileJson className="w-4 h-4 mr-2" />
                  Exportar JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#3a3a38]"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Verificados"
            value={result.total}
            icon={CheckCircle}
            color="blue"
          />
          <StatCard
            label="Coinciden"
            value={result.matches}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Diferencias"
            value={result.mismatches}
            icon={AlertTriangle}
            color="yellow"
          />
          <StatCard
            label="No Encontrados"
            value={result.notFound}
            icon={XCircle}
            color="red"
          />
        </div>

        {/* Success Rate */}
        <div className="rounded-lg p-4 bg-[#1a1a18] border border-[#3a3a38]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#888888]">Tasa de exito</span>
            <span className={`text-2xl font-bold ${
              successRate >= 90 ? 'text-green-400' :
              successRate >= 70 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {successRate}%
            </span>
          </div>
          <div className="h-2 bg-[#2a2a28] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                successRate >= 90 ? 'bg-green-500' :
                successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Filter and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#888888]" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-[#3a3a38]">
                  {filter === 'all' && 'Todos'}
                  {filter === 'match' && 'Coinciden'}
                  {filter === 'mismatch' && 'Diferencias'}
                  {filter === 'not_found' && 'No encontrados'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#262624] border-[#3a3a38]">
                <DropdownMenuItem onClick={() => setFilter('all')} className="cursor-pointer">
                  Todos ({result.total})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('match')} className="cursor-pointer">
                  Coinciden ({result.matches})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('mismatch')} className="cursor-pointer">
                  Diferencias ({result.mismatches})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('not_found')} className="cursor-pointer">
                  No encontrados ({result.notFound})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllMismatches}
              className="text-[#888888] hover:text-[#fafafa]"
            >
              Expandir diferencias
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="text-[#888888] hover:text-[#fafafa]"
            >
              Colapsar todo
            </Button>
          </div>
        </div>

        {/* Items Table */}
        <div className="rounded-lg border border-[#3a3a38] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 p-3 bg-[#1a1a18] border-b border-[#3a3a38] text-xs font-semibold text-[#888888]">
            <div className="w-8"></div>
            <div className="w-28">CODIGO</div>
            <div className="flex-1">DESCRIPCION</div>
            <div className="w-24">ESTADO</div>
          </div>

          {/* Items */}
          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-[#888888]">
                No hay items para mostrar con el filtro actual
              </div>
            ) : (
              filteredItems.map(item => (
                <ItemRow
                  key={item.codigo_propio}
                  item={item}
                  isExpanded={expandedItems.has(item.codigo_propio)}
                  onToggle={() => toggleExpanded(item.codigo_propio)}
                />
              ))
            )}
          </div>
        </div>

        {/* Summary */}
        {result.mismatches > 0 && (
          <div className="rounded-lg p-4 bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-400">
                  Se encontraron {result.mismatches} diferencias
                </h4>
                <p className="text-sm text-yellow-300/80 mt-1">
                  Algunos productos tienen valores diferentes entre el Excel y la base de datos.
                  Esto puede ocurrir si hubo modificaciones manuales despues de la importacion
                  o si la actualizacion no se completo correctamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {result.notFound > 0 && (
          <div className="rounded-lg p-4 bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-400">
                  {result.notFound} productos no encontrados
                </h4>
                <p className="text-sm text-red-300/80 mt-1">
                  Estos codigos del Excel no existen en la base de datos.
                  Verifica que los productos hayan sido importados previamente
                  o que los codigos coincidan exactamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {result.matches === result.total && result.total > 0 && (
          <div className="rounded-lg p-4 bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-400">
                  Verificacion exitosa
                </h4>
                <p className="text-sm text-green-300/80 mt-1">
                  Todos los {result.total} productos del Excel coinciden con la base de datos.
                  La actualizacion se aplico correctamente.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
