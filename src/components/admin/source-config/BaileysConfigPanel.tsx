'use client'

import { Smartphone } from 'lucide-react'

export function BaileysConfigPanel() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[#e9edef] font-medium">Configuración de Baileys</h3>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-8 space-y-4">
        <div className="w-24 h-24 mx-auto bg-[#2a3942] rounded-lg flex items-center justify-center">
          <Smartphone className="h-12 w-12 text-[#8696a0]" />
        </div>
        <div>
          <h4 className="text-[#e9edef] font-medium">Próximamente</h4>
          <p className="text-sm text-[#8696a0] mt-2 max-w-md mx-auto">
            La integración con Baileys está en desarrollo. Permitirá conectar
            WhatsApp escaneando un código QR, sin necesidad de cuenta de Twilio.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-[#2a3942] text-[#8696a0]">Sin costo mensual</span>
          <span className="px-2 py-1 rounded bg-[#2a3942] text-[#8696a0]">Conexión directa</span>
          <span className="px-2 py-1 rounded bg-[#2a3942] text-[#8696a0]">Auto-reconexión</span>
        </div>
      </div>
    </div>
  )
}
