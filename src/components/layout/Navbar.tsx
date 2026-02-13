'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, Menu, X, Phone, MapPin, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isAuthenticated } from '@/features/admin/api'
import { useCartContext } from '@/providers/CartProvider'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const { itemCount } = useCartContext()

  // Helper function to check if link is active
  const isLinkActive = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname?.startsWith(href)) return true
    return false
  }

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
    <nav className="bg-black" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 py-2 mr-12">
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
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Inicio
              {isLinkActive('/') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/productos"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/productos')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Ver Productos
              {isLinkActive('/productos') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/agro-camiones"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/agro-camiones')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Agro y Camiones
              {isLinkActive('/agro-camiones') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/equivalencias"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/equivalencias')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Equivalencias
              {isLinkActive('/equivalencias') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/servicios"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/servicios')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Servicios
              {isLinkActive('/servicios') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/aceites"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/aceites')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Aceites
              {isLinkActive('/aceites') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/sucursales"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/sucursales')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Sucursales
              {isLinkActive('/sucursales') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/turnos"
              className="flex items-center gap-2 px-4 py-2 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-[#FEE004]/20 text-sm font-semibold"
            >
              <Calendar className="w-4 h-4" />
              Turnos
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Cart Button */}
            <Link
              href="/carrito"
              className="p-2 text-white hover:text-[#FEE004] transition-all duration-300 ease-out rounded-lg hover:bg-white/5 relative"
              aria-label="Carrito de compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Admin panel link - only show if admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-[#FEE004] text-black hover:bg-[#FEE004]/90 rounded-lg transition-all duration-300 ease-out text-sm font-medium"
              >
                Panel Admin
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            {/* Cart Button Mobile */}
            <Link
              href="/carrito"
              className="p-2 text-white hover:text-[#FEE004] transition-all duration-300 ease-out relative"
              aria-label="Carrito de compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:text-[#FEE004] transition-all duration-300 ease-out"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 space-y-3 border-t border-white/10 mt-2">
          <Link
            href="/"
            className={`block px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium ${
              isLinkActive('/')
                ? 'text-[#FEE004] bg-white/10'
                : 'text-white hover:text-[#FEE004] hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Inicio
          </Link>
          <Link
            href="/productos"
            className={`block px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium ${
              isLinkActive('/productos')
                ? 'text-[#FEE004] bg-white/10'
                : 'text-white hover:text-[#FEE004] hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Ver Productos
          </Link>
          <Link
            href="/agro-camiones"
            className={`block px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium ${
              isLinkActive('/agro-camiones')
                ? 'text-[#FEE004] bg-white/10'
                : 'text-white hover:text-[#FEE004] hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Agro y Camiones
          </Link>
          <Link
            href="/equivalencias"
            className={`block px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium ${
              isLinkActive('/equivalencias')
                ? 'text-[#FEE004] bg-white/10'
                : 'text-white hover:text-[#FEE004] hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Equivalencias
          </Link>
          <Link
            href="/servicios"
            className={`block px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium ${
              isLinkActive('/servicios')
                ? 'text-[#FEE004] bg-white/10'
                : 'text-white hover:text-[#FEE004] hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Servicios
          </Link>
          <Link
            href="/aceites"
            className={`block px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium ${
              isLinkActive('/aceites')
                ? 'text-[#FEE004] bg-white/10'
                : 'text-white hover:text-[#FEE004] hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Aceites
          </Link>
          <Link
            href="/sucursales"
            className={`block px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium ${
              isLinkActive('/sucursales')
                ? 'text-[#FEE004] bg-white/10'
                : 'text-white hover:text-[#FEE004] hover:bg-white/5'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Sucursales
          </Link>
          <Link
            href="/turnos"
            className="flex items-center gap-2 px-4 py-3 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-all duration-300 ease-out text-sm font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Calendar className="w-4 h-4" />
            Turnos
          </Link>
          <div className="border-t border-white/10 pt-3 space-y-2">
            <Link
              href="/carrito"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ease-out text-sm font-medium text-white hover:text-[#FEE004] hover:bg-white/5 w-full text-left relative"
              onClick={() => setMobileMenuOpen(false)}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito</span>
              {itemCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-all duration-300 ease-out text-sm font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                Panel Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
