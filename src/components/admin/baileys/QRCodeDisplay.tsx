'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw, CheckCircle2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface QRCodeDisplayProps {
  instanceId: string
  onConnected?: () => void
  onError?: (message: string) => void
}

type Phase = 'waiting' | 'qr_ready' | 'connected' | 'timeout'

export function QRCodeDisplay({ instanceId, onConnected, onError }: QRCodeDisplayProps) {
  const [phase, setPhase] = useState<Phase>('waiting')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(60)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch(`/api/baileys/instances/${instanceId}/qr`)
      const data = await res.json()

      if (!data.success || !data.data) return

      const { qr_code, status, expires_at } = data.data

      if (status === 'connected') {
        setPhase('connected')
        setTimeout(() => onConnected?.(), 1500)
        return
      }

      if (qr_code) {
        setQrCode(qr_code)
        setPhase('qr_ready')

        if (expires_at) {
          const remaining = Math.max(0, Math.floor((new Date(expires_at).getTime() - Date.now()) / 1000))
          setCountdown(remaining)
        }
      }
    } catch {
      // Silently retry on next interval
    }
  }, [instanceId, onConnected])

  // Poll for QR code
  useEffect(() => {
    fetchQR()
    const interval = setInterval(fetchQR, 3000)
    return () => clearInterval(interval)
  }, [fetchQR])

  // Elapsed timer for waiting phase
  useEffect(() => {
    if (phase !== 'waiting') return
    const timer = setInterval(() => {
      setElapsedSeconds(s => {
        if (s >= 30) {
          setPhase('timeout')
          return s
        }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase])

  // Countdown for QR expiry
  useEffect(() => {
    if (phase !== 'qr_ready' || countdown <= 0) return
    const timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [phase, countdown])

  const handleRetry = () => {
    setPhase('waiting')
    setElapsedSeconds(0)
    fetchQR()
  }

  return (
    <div className="py-2">
      <AnimatePresence mode="wait">
        {/* Waiting for QR */}
        {phase === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center space-y-4"
          >
            {/* Pulsing QR placeholder */}
            <div className="relative">
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-[200px] h-[200px] bg-[#2a3942] rounded-lg flex items-center justify-center"
              >
                <div className="grid grid-cols-5 gap-1.5 p-6">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 0.5, 0.2] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.05,
                        ease: 'easeInOut',
                      }}
                      className="w-5 h-5 bg-[#3b4a54] rounded-sm"
                    />
                  ))}
                </div>
              </motion.div>

              {/* Scanning line */}
              <motion.div
                animate={{ y: [0, 180, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-2 left-2 right-2 h-0.5 bg-[#00a884]/60 rounded-full shadow-[0_0_8px_rgba(0,168,132,0.4)]"
              />
            </div>

            <div className="flex items-center gap-2 text-[#8696a0]">
              <Loader2 className="h-4 w-4 animate-spin text-[#00a884]" />
              <span className="text-sm">Generando codigo QR...</span>
            </div>

            <Progress
              value={Math.min((elapsedSeconds / 15) * 100, 100)}
              className="w-48 h-1 bg-[#2a3942] [&>div]:bg-[#00a884]"
            />
          </motion.div>
        )}

        {/* QR code ready */}
        {phase === 'qr_ready' && qrCode && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center space-y-3"
          >
            <motion.div
              initial={{ boxShadow: '0 0 0 rgba(0,168,132,0)' }}
              animate={{ boxShadow: '0 0 20px rgba(0,168,132,0.15)' }}
              transition={{ duration: 0.5 }}
              className="bg-white p-3 rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="WhatsApp QR Code" width={200} height={200} />
            </motion.div>

            <div className="flex items-center gap-2 text-[#8696a0]">
              <Smartphone className="h-4 w-4" />
              <span className="text-sm">Escaneá el QR con WhatsApp</span>
            </div>

            {countdown > 0 && (
              <div className="flex items-center gap-2">
                <Progress
                  value={(countdown / 60) * 100}
                  className="w-32 h-1 bg-[#2a3942] [&>div]:bg-[#00a884] [&>div]:transition-all"
                />
                <span className="text-xs text-[#6a7a82] tabular-nums w-8">{countdown}s</span>
              </div>
            )}

            {countdown === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="bg-transparent border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                QR expirado - Reintentar
              </Button>
            )}
          </motion.div>
        )}

        {/* Connected */}
        {phase === 'connected' && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            className="flex flex-col items-center py-4 space-y-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: 'backOut' }}
            >
              <CheckCircle2 className="h-14 w-14 text-green-400" />
            </motion.div>
            <p className="text-green-400 font-medium text-sm">Conectado exitosamente</p>
          </motion.div>
        )}

        {/* Timeout */}
        {phase === 'timeout' && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center py-4 space-y-3"
          >
            <p className="text-[#8696a0] text-sm">
              El QR esta tardando mas de lo esperado
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="bg-transparent border-[#2a3942] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Reintentar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
