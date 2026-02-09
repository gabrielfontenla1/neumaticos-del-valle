'use client'

import { AlertCircle, Clock, FileSpreadsheet, RefreshCw, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StockUpdateSession } from '../../types/stock-update'

interface RecoveryPromptProps {
  session: StockUpdateSession
  onRecover: () => void
  onDiscard: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function RecoveryPrompt({ session, onRecover, onDiscard }: RecoveryPromptProps) {
  const isCompleted = !!session.updateResult
  const wasRunning = session.isRunning

  return (
    <Card className="bg-[#262624] border-yellow-500/50 shadow-lg shadow-black/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-yellow-400">
              {isCompleted
                ? 'Se encontro una sesion anterior completada'
                : wasRunning
                  ? 'Se encontro una sesion interrumpida'
                  : 'Se encontro una sesion anterior'}
            </CardTitle>
            <p className="text-sm text-[#888888] mt-1">
              {isCompleted
                ? 'Puedes ver los resultados de la actualizacion anterior'
                : 'Puedes recuperar el progreso guardado o iniciar de nuevo'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="rounded-lg p-4 bg-[#1a1a18] border border-[#3a3a38]">
          <div className="flex items-center gap-3 mb-3">
            <FileSpreadsheet className="w-5 h-5 text-[#d97757]" />
            <span className="font-medium text-[#fafafa]">{session.file.name}</span>
            <Badge
              variant="secondary"
              className={
                session.source === 'pirelli'
                  ? 'bg-[#d97757]/20 text-[#d97757]'
                  : 'bg-blue-500/20 text-blue-400'
              }
            >
              {session.source.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#888888]">Tamano: </span>
              <span className="text-[#fafafa]">{formatFileSize(session.file.size)}</span>
            </div>
            <div>
              <span className="text-[#888888]">Fecha: </span>
              <span className="text-[#fafafa]">{formatDate(session.startTime)}</span>
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div className="rounded-lg p-4 bg-[#1a1a18] border border-[#3a3a38]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#888888]">Progreso guardado</span>
            <span className="text-xl font-bold text-[#d97757]">{session.progress.percent}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-[#2a2a28] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#d97757] to-[#e89878] transition-all"
              style={{ width: `${session.progress.percent}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="text-green-400 font-bold">{session.stats.updated}</div>
              <div className="text-[#888888]">Actualizados</div>
            </div>
            <div>
              <div className="text-yellow-400 font-bold">{session.stats.notFound}</div>
              <div className="text-[#888888]">No encontrados</div>
            </div>
            <div>
              <div className="text-red-400 font-bold">{session.stats.errors}</div>
              <div className="text-[#888888]">Errores</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold">{session.stats.skipped}</div>
              <div className="text-[#888888]">Omitidos</div>
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#888888]">
            <Clock className="w-4 h-4" />
            <span>Ultima actividad:</span>
          </div>
          <span className="text-[#fafafa]">{formatTime(session.lastActivity)}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onRecover}
            className="flex-1 bg-[#d97757] hover:bg-[#d97757]/90 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isCompleted ? 'Ver Resultados' : 'Ver Progreso Guardado'}
          </Button>
          <Button
            onClick={onDiscard}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Descartar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
