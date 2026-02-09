'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Clock, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'info' | 'success' | 'warning' | 'error' | 'processing'
  codigo?: string
  message: string
  details?: {
    precio?: number
    stock?: number
    descripcion?: string
  }
}

export interface ProgressData {
  current: number
  total: number
  percent: number
}

interface ProgressConsoleProps {
  logs: LogEntry[]
  progress: ProgressData
  isRunning: boolean
  startTime?: Date
  stats: {
    updated: number
    notFound: number
    errors: number
    skipped: number
  }
  /** Whether this is a recovered session */
  isRecovered?: boolean
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function StatBox({
  label,
  value,
  color
}: {
  label: string
  value: number
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
}) {
  const colorClasses = {
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    gray: 'text-[#888888] bg-[#3a3a38]/50 border-[#3a3a38]'
  }

  return (
    <div className={`text-center p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  const colors = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    processing: 'text-[#888888]'
  }

  const icons = {
    info: <Clock className="w-3 h-3" />,
    success: <CheckCircle className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    error: <XCircle className="w-3 h-3" />,
    processing: <Loader2 className="w-3 h-3 animate-spin" />
  }

  const time = entry.timestamp.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <div className={`flex items-start gap-2 py-0.5 ${colors[entry.type]}`}>
      <span className="text-[#555555] shrink-0 text-[10px] font-mono">[{time}]</span>
      <span className="shrink-0 mt-0.5">{icons[entry.type]}</span>
      {entry.codigo && (
        <span className="text-[#d97757] font-semibold shrink-0">[{entry.codigo}]</span>
      )}
      <span className="truncate flex-1">{entry.message}</span>
      {entry.details?.precio !== undefined && entry.details.precio > 0 && (
        <span className="text-green-400 shrink-0 text-xs">
          ${entry.details.precio.toLocaleString('es-AR')}
        </span>
      )}
    </div>
  )
}

export function ProgressConsole({
  logs,
  progress,
  isRunning,
  startTime,
  stats,
  isRecovered = false
}: ProgressConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  // Calculate elapsed time
  const elapsedTime = startTime ? formatElapsed(Date.now() - startTime.getTime()) : '0:00'

  // Update elapsed time every second
  useEffect(() => {
    if (!isRunning || !startTime) return

    const interval = setInterval(() => {
      // Force re-render by updating parent state would be needed
      // For now, the time updates on new log entries
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, startTime])

  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRunning ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-green-500/20 border border-green-500/30'}`}>
              {isRunning ? (
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg text-[#fafafa] flex items-center gap-2">
                {isRunning ? 'Procesando...' : 'Completado'}
                {isRecovered && (
                  <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Recuperado
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-[#888888]">
                {progress.current} / {progress.total} productos
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#d97757]">{progress.percent}%</div>
            <div className="text-xs text-[#888888] flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              {elapsedTime}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-[#1a1a18] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#d97757] to-[#e89878]"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Log Console */}
        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto rounded-lg bg-[#1a1a18] p-3 font-mono text-xs border border-[#2a2a28]"
        >
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#555555]">
              Esperando inicio...
            </div>
          ) : (
            <>
              {logs.map((log) => (
                <LogLine key={log.id} entry={log} />
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-[#888888] mt-1">
                  <span className="animate-pulse">|</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3">
          <StatBox
            label="Actualizados"
            value={stats.updated}
            color={stats.updated > 0 ? 'green' : 'gray'}
          />
          <StatBox
            label="No encontrados"
            value={stats.notFound}
            color={stats.notFound > 0 ? 'yellow' : 'gray'}
          />
          <StatBox
            label="Errores"
            value={stats.errors}
            color={stats.errors > 0 ? 'red' : 'gray'}
          />
          <StatBox
            label="Omitidos"
            value={stats.skipped}
            color={stats.skipped > 0 ? 'blue' : 'gray'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
