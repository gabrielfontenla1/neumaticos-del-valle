"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle2, RefreshCw, Shield } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface StockInfoPopupProps {
  storageKey?: string
  delayMs?: number
  forceShow?: boolean // Para testing
}

export function StockInfoPopup({
  storageKey = "stockInfoPopupShown",
  delayMs = 1500,
  forceShow = false
}: StockInfoPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar si ya se mostró en esta sesión
    const hasBeenShown = sessionStorage.getItem(storageKey)

    // Mostrar si forceShow está activo o si no se ha mostrado antes
    if (forceShow || !hasBeenShown) {
      // Mostrar popup después del delay
      const timer = setTimeout(() => {
        setIsVisible(true)
        // Marcar como mostrado solo si no es forzado
        if (!forceShow) {
          sessionStorage.setItem(storageKey, "true")
        }

        // Auto-cerrar después de 8 segundos
        const autoCloseTimer = setTimeout(() => {
          setIsVisible(false)
        }, 8000)

        return () => clearTimeout(autoCloseTimer)
      }, delayMs)

      return () => clearTimeout(timer)
    }
  }, [storageKey, delayMs, forceShow])

  const handleClose = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{
            duration: 0.4,
            ease: [0.23, 1, 0.320, 1]
          }}
          className="fixed bottom-6 right-6 z-40 w-80"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 relative overflow-hidden">
            {/* Gradiente decorativo sutil */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500" />

            {/* Botón de cerrar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Contenido */}
            <div className="pr-6">
              {/* Header con icono */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">
                    Información en Tiempo Real
                  </h3>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-xs text-gray-600 leading-relaxed ml-11 mb-3">
                Los precios y stock mostrados están sincronizados con nuestro sistema central.
              </p>

              {/* Badges informativos más sutiles */}
              <div className="flex gap-3 ml-11">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-xs">Actualizado</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Shield className="w-3 h-3" />
                  <span className="text-xs">Verificado</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}