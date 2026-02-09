'use client'

// ===========================================
// Terminal Results Panel Component
// Displays update results with terminal styling
// ===========================================

import { CheckCircle, AlertTriangle, Package, Search, Upload, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { terminalColors, TerminalButton, TerminalStat, TerminalCommand } from './StockTerminal'
import type { UpdateResult, ExcelRowCache } from '@/features/admin/types/stock-update'

// ===========================================
// Terminal Alert (inline component)
// ===========================================

interface TerminalAlertProps {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  children: React.ReactNode
}

function TerminalAlert({ type, title, children }: TerminalAlertProps) {
  const colors = {
    success: { border: terminalColors.success, bg: 'rgba(74, 222, 128, 0.1)' },
    warning: { border: terminalColors.warning, bg: 'rgba(251, 191, 36, 0.1)' },
    error: { border: terminalColors.error, bg: 'rgba(239, 68, 68, 0.1)' },
    info: { border: terminalColors.info, bg: 'rgba(96, 165, 250, 0.1)' },
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5" style={{ color: colors[type].border }} />,
    warning: <AlertTriangle className="w-5 h-5" style={{ color: colors[type].border }} />,
    error: <XCircle className="w-5 h-5" style={{ color: colors[type].border }} />,
    info: <Search className="w-5 h-5" style={{ color: colors[type].border }} />,
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: colors[type].bg,
        borderLeft: `4px solid ${colors[type].border}`,
      }}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          <h4 className="font-semibold mb-1" style={{ color: colors[type].border }}>
            {title}
          </h4>
          <div className="text-sm" style={{ color: terminalColors.fg }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Main Results Panel
// ===========================================

interface TerminalResultsPanelProps {
  result: UpdateResult
  excelDataCache: ExcelRowCache[]
  onReset: () => void
  onVerify: () => void
  isVerifying?: boolean
  verificationError?: string | null
}

export function TerminalResultsPanel({
  result,
  excelDataCache,
  onReset,
  onVerify,
  isVerifying = false,
  verificationError,
}: TerminalResultsPanelProps) {
  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'prices_and_stock':
        return 'PRECIOS + STOCK'
      case 'prices_only':
        return 'SOLO PRECIOS'
      case 'stock_only':
        return 'SOLO STOCK'
      default:
        return mode.toUpperCase()
    }
  }

  const sourceLabel = result.source === 'pirelli' ? 'PIRELLI' : 'CORVEN'
  const fileName = 'lista_precios.xlsx' // Could be passed as prop if needed

  return (
    <div className="space-y-6">
      {/* Command output header */}
      <div>
        <TerminalCommand
          command={`stock-update --source ${result.source} --file ${fileName}`}
        />
        <TerminalCommand
          output={result.updated > 0 ? '✓ Actualizacion completada exitosamente' : '⚠ Actualizacion sin cambios'}
          highlight={result.updated > 0}
        />
      </div>

      {/* Results summary box */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: `1px solid ${terminalColors.border}`,
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{
            background: terminalColors.terminalHeader,
            borderBottom: `1px solid ${terminalColors.border}`,
          }}
        >
          {result.updated > 0 ? (
            <CheckCircle className="w-5 h-5" style={{ color: terminalColors.success }} />
          ) : (
            <AlertTriangle className="w-5 h-5" style={{ color: terminalColors.warning }} />
          )}
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: terminalColors.fgLight }}
          >
            Resumen de Operacion
          </span>
        </div>

        {/* Stats grid */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div
              className="p-4 rounded-lg text-center"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${terminalColors.border}`,
              }}
            >
              <TerminalStat
                label="Updated"
                value={result.updated}
                color={result.updated > 0 ? 'success' : 'muted'}
              />
              {result.priceUpdates > 0 && (
                <div className="text-[10px] mt-2" style={{ color: terminalColors.success }}>
                  {result.priceUpdates} precios
                </div>
              )}
              {result.stockUpdates > 0 && (
                <div className="text-[10px]" style={{ color: terminalColors.info }}>
                  {result.stockUpdates} stocks
                </div>
              )}
            </div>

            <div
              className="p-4 rounded-lg text-center"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${terminalColors.border}`,
              }}
            >
              <TerminalStat
                label="Not Found"
                value={result.notFound}
                color={result.notFound > 0 ? 'warning' : 'muted'}
              />
            </div>

            <div
              className="p-4 rounded-lg text-center"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${terminalColors.border}`,
              }}
            >
              <TerminalStat
                label="Errors"
                value={result.errors.length}
                color={result.errors.length > 0 ? 'error' : 'success'}
              />
            </div>

            <div
              className="p-4 rounded-lg text-center"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${terminalColors.border}`,
              }}
            >
              <TerminalStat
                label="Total"
                value={result.totalRows}
                color="coral"
              />
            </div>
          </div>

          {/* Info line */}
          <div
            className="text-xs text-center py-2 rounded"
            style={{
              background: 'rgba(0,0,0,0.2)',
              color: terminalColors.fgMuted,
            }}
          >
            Origen: <span style={{ color: terminalColors.coral }}>{sourceLabel}</span>
            {' • '}
            Modo: <span style={{ color: terminalColors.fgLight }}>{getModeLabel(result.mode)}</span>
          </div>
        </div>
      </div>

      {/* Status alerts */}
      {result.updated === 0 && result.notFound > 0 && (
        <TerminalAlert type="warning" title="Ningun Producto fue Actualizado">
          <p className="mb-2">
            Los {result.notFound} productos del Excel no se encontraron en la base de datos.
            Esto puede ocurrir por:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-xs" style={{ color: terminalColors.fgMuted }}>
            <li>Los codigos de producto en el Excel no coinciden con los de la BD</li>
            <li>Los productos aun no fueron importados al sistema</li>
            <li>Hay diferencias en el formato de los codigos (espacios, guiones, etc.)</li>
          </ul>
        </TerminalAlert>
      )}

      {result.updated > 0 && (
        <TerminalAlert type="success" title="Actualizacion Exitosa!">
          <p>
            Se actualizaron correctamente {result.updated} productos de {sourceLabel}.
          </p>
          {result.notFound > 0 && (
            <p className="mt-1 text-xs" style={{ color: terminalColors.warning }}>
              {result.notFound} productos del Excel no se encontraron en la base de datos.
            </p>
          )}
        </TerminalAlert>
      )}

      {result.errors.length > 0 && (
        <TerminalAlert type="error" title={`Se encontraron ${result.errors.length} errores`}>
          <div
            className="space-y-1 max-h-32 overflow-y-auto mt-2"
            style={{ scrollbarWidth: 'thin' }}
          >
            {result.errors.map((err, idx) => (
              <div
                key={idx}
                className="text-xs font-mono p-2 rounded"
                style={{ background: 'rgba(0,0,0,0.3)' }}
              >
                <span style={{ color: terminalColors.error }}>[{err.codigo}]</span>{' '}
                <span style={{ color: terminalColors.fgMuted }}>{err.error}</span>
              </div>
            ))}
          </div>
        </TerminalAlert>
      )}

      {/* Verification section */}
      {excelDataCache.length > 0 && result.updated > 0 && (
        <div
          className="rounded-lg p-4 flex items-center justify-between"
          style={{
            background: 'rgba(96, 165, 250, 0.1)',
            border: `1px solid rgba(96, 165, 250, 0.3)`,
          }}
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5" style={{ color: terminalColors.info }} />
            <div>
              <h4 className="font-semibold text-sm" style={{ color: terminalColors.fgLight }}>
                Verificar Actualizacion
              </h4>
              <p className="text-xs" style={{ color: terminalColors.fgMuted }}>
                Compara los datos del Excel con la base de datos
              </p>
            </div>
          </div>
          <TerminalButton
            variant="secondary"
            onClick={onVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Verificar
              </span>
            )}
          </TerminalButton>
        </div>
      )}

      {verificationError && (
        <TerminalAlert type="error" title="Error de Verificacion">
          {verificationError}
        </TerminalAlert>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <TerminalButton variant="primary" onClick={onReset}>
          <span className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Nuevo Archivo
          </span>
        </TerminalButton>

        <Link href={result.source === 'corven' ? '/agro-camiones' : '/admin/products'}>
          <TerminalButton variant="secondary">
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ver Productos
            </span>
          </TerminalButton>
        </Link>
      </div>
    </div>
  )
}
