'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, ArrowUp } from 'lucide-react'

export function LegalFooter() {
  const pathname = usePathname()
  const isPrivacidad = pathname === '/privacidad'

  const crossLink = isPrivacidad
    ? { href: '/terminos', label: 'Terminos y Condiciones' }
    : { href: '/privacidad', label: 'Politica de Privacidad' }

  return (
    <footer role="contentinfo" className="bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4 text-center">
        {/* Cross-navigation */}
        <Link
          href={crossLink.href}
          className="text-sm text-gray-400 hover:text-[#FEE004] transition-colors duration-200 inline-flex items-center gap-2"
        >
          {crossLink.label}
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Back to top */}
        <div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-200 inline-flex items-center gap-1"
          >
            <ArrowUp className="w-3 h-3" />
            Volver al inicio
          </button>
        </div>

        {/* Last updated */}
        <p className="text-xs text-gray-600">
          Ultima actualizacion: Febrero 2026
        </p>

        {/* Contact */}
        <p className="text-xs text-gray-600">
          Consultas:{' '}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493855854741'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-colors"
          >
            WhatsApp +54 9 385 585-4741
          </a>
        </p>

        {/* Copyright */}
        <p className="text-xs text-gray-700">
          &copy; {new Date().getFullYear()} Neumaticos del Valle SRL. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
