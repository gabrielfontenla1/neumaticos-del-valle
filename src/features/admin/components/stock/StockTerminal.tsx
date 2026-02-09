'use client'

// ===========================================
// Stock Terminal Component
// Terminal window with Claude Code styling
// ===========================================

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

// Terminal color palette (Claude Code style)
export const terminalColors = {
  background: '#1a1816',
  terminal: '#2F2B29',
  terminalHeader: '#252220',
  coral: '#D97757',
  coralLight: '#E08860',
  orange: '#FF6B35',
  border: '#4A433F',
  fg: '#C9BFB5',
  fgLight: '#FAF6F3',
  fgMuted: '#8a7f75',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#EF4444',
  info: '#60A5FA',
}

interface StockTerminalProps {
  children: ReactNode
  title?: string
  subtitle?: string
  isRunning?: boolean
  className?: string
}

export function StockTerminal({
  children,
  title = 'STOCK UPDATE',
  subtitle,
  isRunning = false,
  className = '',
}: StockTerminalProps) {
  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{
        borderRadius: '12px',
        border: `1px solid ${terminalColors.border}`,
        boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
        background: terminalColors.terminal,
        overflow: 'hidden',
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          background: terminalColors.terminalHeader,
          padding: '12px 16px',
        }}
      >
        {/* Control buttons */}
        <div className="flex items-center gap-[6px]">
          <div
            className="w-[10px] h-[10px] rounded-full"
            style={{ background: terminalColors.coral }}
          />
          <div
            className="w-[10px] h-[10px] rounded-full"
            style={{ background: terminalColors.coralLight, opacity: 0.6 }}
          />
          <div
            className="w-[10px] h-[10px] rounded-full"
            style={{ background: terminalColors.fg, opacity: 0.4 }}
          />
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <motion.div
              className="w-2 h-2 rounded-full"
              style={{ background: terminalColors.success }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          <span
            className="text-[10px] font-medium tracking-[0.05em] uppercase"
            style={{ color: terminalColors.fgMuted }}
          >
            {title}
          </span>
        </div>
      </div>

      {/* Subtitle if present */}
      {subtitle && (
        <div
          className="px-4 py-2 border-b text-xs"
          style={{
            background: 'rgba(0,0,0,0.2)',
            borderColor: terminalColors.border,
            color: terminalColors.fgMuted,
          }}
        >
          {subtitle}
        </div>
      )}

      {/* Body */}
      <div
        className="flex-1 overflow-hidden"
        style={{ color: terminalColors.fg }}
      >
        {children}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2 text-[10px] border-t"
        style={{
          background: terminalColors.terminalHeader,
          borderTopColor: terminalColors.border,
          color: terminalColors.fgMuted,
        }}
      >
        <div className="flex items-center gap-4">
          <span>neumaticos-del-valle</span>
          <span>•</span>
          <span>tty1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>•</span>
          <span style={{ color: isRunning ? terminalColors.success : terminalColors.fgMuted }}>
            {isRunning ? '● RUNNING' : '○ IDLE'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Terminal Progress Bar
// ===========================================

interface TerminalProgressProps {
  value: number
  label?: string
  showPercentage?: boolean
  className?: string
}

export function TerminalProgress({
  value,
  label,
  showPercentage = true,
  className = '',
}: TerminalProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={className}>
      {label && (
        <div
          className="flex items-center justify-between mb-2"
          style={{ fontSize: '11px', color: terminalColors.fgMuted }}
        >
          <span>{label}</span>
          {showPercentage && (
            <span style={{ color: terminalColors.coral }}>{clampedValue}%</span>
          )}
        </div>
      )}

      <div
        className="w-full rounded-sm overflow-hidden"
        style={{ height: '3px', backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${terminalColors.coral}, ${terminalColors.coralLight})`,
          }}
        />
      </div>
    </div>
  )
}

// ===========================================
// Terminal Command Line
// ===========================================

interface TerminalCommandProps {
  command?: string
  output?: string
  highlight?: boolean
  showCursor?: boolean
}

export function TerminalCommand({
  command,
  output,
  highlight = false,
  showCursor = false,
}: TerminalCommandProps) {
  return (
    <div className="mb-1">
      {command && (
        <div className="flex items-center">
          <span style={{ color: terminalColors.coral, marginRight: '8px' }}>$</span>
          <span style={{ color: terminalColors.fg }}>{command}</span>
        </div>
      )}
      {output && (
        <div className="flex items-center">
          <span style={{ color: highlight ? terminalColors.coralLight : terminalColors.fgLight }}>
            {output}
          </span>
          {showCursor && (
            <motion.div
              className="ml-1"
              style={{ width: '8px', height: '14px', background: terminalColors.coralLight }}
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ===========================================
// Terminal Button
// ===========================================

interface TerminalButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'default' | 'large'
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export function TerminalButton({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  onClick,
  className = '',
}: TerminalButtonProps) {
  const sizeStyles = {
    default: { padding: '10px 20px', fontSize: '12px' },
    large: { padding: '14px 28px', fontSize: '13px' },
  }

  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${terminalColors.orange} 0%, ${terminalColors.coral} 100%)`,
      color: 'white',
      boxShadow: '0 4px 20px rgba(255, 107, 53, 0.3)',
    },
    secondary: {
      background: 'transparent',
      color: terminalColors.coral,
      border: `2px solid ${terminalColors.coral}`,
    },
    ghost: {
      background: 'transparent',
      color: terminalColors.fg,
    },
    danger: {
      background: 'transparent',
      color: terminalColors.error,
      border: `2px solid ${terminalColors.error}`,
    },
  }

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        fontFamily: 'inherit',
        fontWeight: 700,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        opacity: disabled ? 0.5 : 1,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {children}
    </motion.button>
  )
}

// ===========================================
// Terminal Stats Box
// ===========================================

interface TerminalStatProps {
  label: string
  value: number | string
  color?: 'coral' | 'success' | 'warning' | 'error' | 'muted'
}

export function TerminalStat({ label, value, color = 'muted' }: TerminalStatProps) {
  const colorMap = {
    coral: terminalColors.coral,
    success: terminalColors.success,
    warning: terminalColors.warning,
    error: terminalColors.error,
    muted: terminalColors.fgMuted,
  }

  return (
    <div className="text-center">
      <div
        className="text-2xl font-bold mb-1"
        style={{ color: colorMap[color] }}
      >
        {value}
      </div>
      <div
        className="text-[10px] uppercase tracking-wider"
        style={{ color: terminalColors.fgMuted }}
      >
        {label}
      </div>
    </div>
  )
}
