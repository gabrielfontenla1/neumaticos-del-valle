'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export default function PhoneMockup({ children, className = '' }: PhoneMockupProps) {
  return (
    <div className={`phone-container ${className}`}>
      {/* Ambient effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pirelli-yellow/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pirelli-yellow/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      {/* Phone mockup */}
      <div className="phone-mockup relative mx-auto">
        {/* Phone frame highlights */}
        <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        
        {/* Power button */}
        <div className="absolute right-[-2px] top-32 w-1 h-16 bg-gray-700 rounded-l-sm" />
        
        {/* Volume buttons */}
        <div className="absolute left-[-2px] top-24 w-1 h-10 bg-gray-700 rounded-r-sm" />
        <div className="absolute left-[-2px] top-36 w-1 h-10 bg-gray-700 rounded-r-sm" />
        
        {/* Phone screen */}
        <div className="phone-screen">
          {/* Notch */}
          <div className="phone-notch">
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-gray-900" />
          </div>
          
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 z-50">
            <span className="text-xs text-white/80 font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H5.3l.85-1.48L4.85 7 4 8.47 3.15 7l-1.3.75.85 1.48H1v1.5h1.7l-.85 1.48 1.3.75zm6.7-.75l1.48.85 1.48-.85-.85-1.48H14v-1.5h-2.05l.85-1.48L11.5 7 10 8.47 8.5 7l-1.3.75.85 1.48H6v1.5h2.05l-.85 1.48zm8 0l1.48.85 1.48-.85-.85-1.48H22v-1.5h-2.05l.85-1.48L19.5 7 18 8.47 16.5 7l-1.3.75.85 1.48H14v1.5h2.05l-.85 1.48z"/>
              </svg>
              <svg className="w-4 h-4 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2-2v8a2 2 0 002 2h14a2 2 0 002-2V7l2 2V2L1 2v7z"/>
              </svg>
              <svg className="w-5 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="10" rx="2" ry="2"/>
                <path d="M22 10.5h1.5a1 1 0 011 1v2a1 1 0 01-1 1H22"/>
              </svg>
            </div>
          </div>
          
          {/* Content area with custom scrollbar */}
          <div className="h-full w-full overflow-y-auto pt-12 custom-scrollbar">
            {children}
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Floating UI elements for desktop */}
      <div className="hidden lg:block">
        {/* Left info panel */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 glass-card p-6 w-64">
          <h3 className="text-sm font-medium text-white/60 mb-2">Características</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pirelli-yellow rounded-full" />
              Cotización instantánea
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pirelli-yellow rounded-full" />
              Catálogo completo Pirelli
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pirelli-yellow rounded-full" />
              Precios actualizados
            </li>
          </ul>
        </div>

        {/* Right info panel */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 glass-card p-6 w-64">
          <h3 className="text-sm font-medium text-white/60 mb-2">Beneficios</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full" />
              Sin compromiso de compra
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full" />
              Respuesta inmediata
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full" />
              Asesoramiento experto
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}