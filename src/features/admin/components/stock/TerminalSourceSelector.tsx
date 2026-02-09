'use client'

// ===========================================
// Terminal Source Selector Component
// Pirelli/Corven selector with terminal styling
// ===========================================

import { Car, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { terminalColors } from './StockTerminal'
import type { SourceType } from '@/features/admin/types/stock-update'

interface TerminalSourceSelectorProps {
  onSelect: (source: SourceType) => void
  disabled?: boolean
}

export function TerminalSourceSelector({ onSelect, disabled = false }: TerminalSourceSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pirelli Card */}
      <motion.button
        onClick={() => onSelect('pirelli')}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
        className="text-left transition-all"
        style={{
          padding: '24px',
          borderRadius: '8px',
          border: `2px solid ${terminalColors.border}`,
          background: 'rgba(0,0,0,0.2)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = terminalColors.coral
            e.currentTarget.style.background = 'rgba(217, 119, 87, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = terminalColors.border
          e.currentTarget.style.background = 'rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex items-start gap-4">
          {/* Number badge */}
          <div
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded text-xs font-bold"
            style={{
              background: 'rgba(217, 119, 87, 0.2)',
              color: terminalColors.coral,
              border: `1px solid ${terminalColors.coral}`,
            }}
          >
            1
          </div>

          <div className="flex-1 space-y-3">
            {/* Title row */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: 'rgba(217, 119, 87, 0.2)' }}
              >
                <Car className="w-6 h-6" style={{ color: terminalColors.coral }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: terminalColors.fgLight }}>
                  PIRELLI
                </h3>
                <p className="text-xs" style={{ color: terminalColors.fgMuted }}>
                  Autos y camionetas
                </p>
              </div>
            </div>

            {/* Command line */}
            <div
              className="font-mono text-xs px-3 py-2 rounded"
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: terminalColors.fgMuted,
              }}
            >
              <span style={{ color: terminalColors.coral }}>$</span> upload pirelli.xlsx
            </div>
          </div>
        </div>
      </motion.button>

      {/* Corven Card */}
      <motion.button
        onClick={() => onSelect('corven')}
        disabled={disabled}
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
        className="text-left transition-all"
        style={{
          padding: '24px',
          borderRadius: '8px',
          border: `2px solid ${terminalColors.border}`,
          background: 'rgba(0,0,0,0.2)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = terminalColors.info
            e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = terminalColors.border
          e.currentTarget.style.background = 'rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex items-start gap-4">
          {/* Number badge */}
          <div
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded text-xs font-bold"
            style={{
              background: 'rgba(96, 165, 250, 0.2)',
              color: terminalColors.info,
              border: `1px solid ${terminalColors.info}`,
            }}
          >
            2
          </div>

          <div className="flex-1 space-y-3">
            {/* Title row */}
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ background: 'rgba(96, 165, 250, 0.2)' }}
              >
                <Truck className="w-6 h-6" style={{ color: terminalColors.info }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: terminalColors.fgLight }}>
                  CORVEN
                </h3>
                <p className="text-xs" style={{ color: terminalColors.fgMuted }}>
                  Agro, camiones e industrial
                </p>
              </div>
            </div>

            {/* Command line */}
            <div
              className="font-mono text-xs px-3 py-2 rounded"
              style={{
                background: 'rgba(0,0,0,0.3)',
                color: terminalColors.fgMuted,
              }}
            >
              <span style={{ color: terminalColors.info }}>$</span> upload corven.xlsx
            </div>
          </div>
        </div>
      </motion.button>
    </div>
  )
}
