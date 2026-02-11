'use client'

import Link from 'next/link'
import { Star, Phone, MessageCircle, MapPin, Clock, ArrowUpRight } from 'lucide-react'
import { footerLinks } from './data'

const branches = [
  'Catamarca Centro',
  'La Banda',
  'San Fernando',
  'Salta',
  'Santiago del Estero',
  'Tucumán',
]

export function Footer() {
  return (
    <footer className="relative bg-black overflow-hidden">
      {/* Subtle top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#FEE004] to-transparent" />

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="py-10 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-6">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-4 lg:col-span-5">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
                Neumáticos del Valle
              </h3>
              <p className="text-sm text-gray-400 mb-4 max-w-xs">
                Distribuidor oficial en el NOA Argentino. Más de 40 años garantizando tu seguridad en ruta.
              </p>
              <div className="flex items-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-[#FEE004] fill-[#FEE004]" />
                ))}
                <span className="text-xs text-gray-500 ml-2">4.9/5 en Google</span>
              </div>

              {/* Contact quick actions */}
              <div className="flex flex-col gap-2.5">
                <a
                  href="tel:+5493855854741"
                  className="group inline-flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span>+54 9 385 585-4741</span>
                </a>
                <a
                  href="https://wa.me/5493855854741"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 text-sm text-gray-400 hover:text-green-400 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-green-500/10 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Navegación
              </h4>
              <ul className="space-y-2.5">
                {footerLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="group text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      {link.name}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/sucursales"
                    className="group text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    Sucursales
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Branches */}
            <div className="col-span-1 md:col-span-3 lg:col-span-2">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Sucursales
              </h4>
              <ul className="space-y-2.5">
                {branches.map((branch) => (
                  <li key={branch} className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-400">{branch}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hours */}
            <div className="col-span-2 md:col-span-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
                Horarios
              </h4>
              <div className="space-y-2.5 text-sm text-gray-400">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-xs font-medium">Lun - Vie</p>
                    <p>8:00 - 12:30 / 16:00 - 20:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-xs font-medium">Sábados</p>
                    <p>9:00 - 13:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Neumáticos del Valle SRL. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs">
            <Link href="/admin" className="text-gray-600 hover:text-[#FEE004] transition-colors">
              Admin
            </Link>
            <Link href="/terminos" className="text-gray-600 hover:text-white transition-colors">
              Términos
            </Link>
            <Link href="/privacidad" className="text-gray-600 hover:text-white transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </div>

      {/* Developer credit */}
      <div className="border-t border-white/[0.03] bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-[11px] text-gray-600">
            Desarrollo a medida por{' '}
            <a
              href="https://gabrielfontenla.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-[#FEE004] transition-colors font-medium"
            >
              gabrielfontenla.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
