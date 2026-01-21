'use client'

import Link from 'next/link'
import { Star, Phone, MessageCircle, MapPin } from 'lucide-react'
import { footerLinks } from './data'

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Main Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-base md:text-lg font-bold text-white mb-2">
              Neumáticos del Valle
            </h3>
            <p className="text-xs md:text-sm text-gray-400 mb-2">
              Distribuidor Oficial Pirelli
            </p>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#FEE004] fill-[#FEE004]" />
              ))}
            </div>
          </div>

          {/* Links - Compacto en móvil */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3 md:mb-4">Enlaces</h4>
            <ul className="space-y-2 md:space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs md:text-sm text-gray-400 hover:text-[#FEE004] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Compacto en móvil */}
          <div>
            <h4 className="text-xs md:text-sm font-semibold text-white mb-3 md:mb-4">Contacto</h4>
            <div className="space-y-2 md:space-y-2.5">
              <a
                href="tel:+5493855854741"
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                <span className="truncate">+54 9 385 585-4741</span>
              </a>
              <a
                href="https://wa.me/5493855854741"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 hover:text-green-400 transition-colors"
              >
                <MessageCircle className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                <span>+54 9 385 585-4741</span>
              </a>
              <a
                href="/sucursales"
                className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors"
              >
                <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                <span>9 Sucursales</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom - Más compacto en móvil */}
        <div className="pt-4 md:pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            © 2024 Neumáticos del Valle
          </p>
          <div className="flex gap-4 md:gap-6 text-xs">
            <Link href="/admin" className="text-gray-500 hover:text-[#FEE004] transition-colors">
              Admin
            </Link>
            <Link href="#" className="text-gray-500 hover:text-white transition-colors">
              Términos
            </Link>
            <Link href="#" className="text-gray-500 hover:text-white transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
