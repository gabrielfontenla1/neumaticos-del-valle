'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Search, Heart, User, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isAuthenticated } from '@/features/admin/api'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAdmin(isAuthenticated())
    }

    checkAuth()

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth)

    // Also check periodically in case sessionStorage changed in same tab
    const interval = setInterval(checkAuth, 1000)

    return () => {
      window.removeEventListener('storage', checkAuth)
      clearInterval(interval)
    }
  }, [pathname])

  // Don't render navbar if user is in admin area
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur-lg" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 py-2">
            <Image
              src="/NDV_Logo.svg"
              alt="Neumáticos del Valle"
              width={180}
              height={48}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-white hover:text-[#FEE004] transition-colors text-sm font-medium"
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className="text-white hover:text-[#FEE004] transition-colors text-sm font-medium"
            >
              Ver Productos
            </Link>
            <Link
              href="/equivalencias"
              className="text-white hover:text-[#FEE004] transition-colors text-sm font-medium"
            >
              Equivalencias
            </Link>
            <Link
              href="/servicios"
              className="text-white hover:text-[#FEE004] transition-colors text-sm font-medium"
            >
              Servicios
            </Link>
            <Link
              href="/sucursales"
              className="text-white hover:text-[#FEE004] transition-colors text-sm font-medium"
            >
              Sucursales
            </Link>
            <Link
              href="/turnos"
              className="flex items-center gap-2 px-4 py-2 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-all hover:shadow-lg hover:shadow-[#FEE004]/20 text-sm font-semibold"
            >
              <Calendar className="w-4 h-4" />
              Turnos
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              className="p-2 text-white hover:text-[#FEE004] transition-colors rounded-lg hover:bg-white/5"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/favoritos"
              className="p-2 text-white hover:text-[#FEE004] transition-colors rounded-lg hover:bg-white/5 flex items-center gap-2"
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">Favoritos</span>
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="px-4 py-2 bg-[#FEE004] text-black hover:bg-[#FEE004]/90 rounded-lg transition-all text-sm font-medium"
              >
                Panel Admin
              </Link>
            ) : (
              <Link
                href="/admin/login"
                className="px-4 py-2 border border-white/20 text-white hover:border-[#FEE004] hover:text-[#FEE004] rounded-lg transition-all text-sm font-medium"
              >
                Ingresá
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-[#FEE004] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-white/10 mt-2">
            <Link
              href="/"
              className="block px-4 py-2 text-white hover:text-[#FEE004] hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/productos"
              className="block px-4 py-2 text-white hover:text-[#FEE004] hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ver Productos
            </Link>
            <Link
              href="/equivalencias"
              className="block px-4 py-2 text-white hover:text-[#FEE004] hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Equivalencias
            </Link>
            <Link
              href="/servicios"
              className="block px-4 py-2 text-white hover:text-[#FEE004] hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Servicios
            </Link>
            <Link
              href="/sucursales"
              className="block px-4 py-2 text-white hover:text-[#FEE004] hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sucursales
            </Link>
            <Link
              href="/turnos"
              className="flex items-center gap-2 px-4 py-3 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-colors text-sm font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Calendar className="w-4 h-4" />
              Turnos
            </Link>
            <div className="border-t border-white/10 pt-3 space-y-2">
              <Link
                href="/favoritos"
                className="flex items-center gap-2 px-4 py-2 text-white hover:text-[#FEE004] hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart className="w-4 h-4" />
                Favoritos
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-3 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-colors text-sm font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Panel Admin
                </Link>
              ) : (
                <Link
                  href="/admin/login"
                  className="flex items-center gap-2 px-4 py-2 text-white hover:text-[#FEE004] hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Ingresá
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
