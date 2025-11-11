/**
 * Admin Login Page - Dashboard Theme
 * Matches the exact dashboard skin with grid and color scheme
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { adminLogin } from '@/features/admin/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR hydration issues with PIXI.js
const AnimatedBackground = dynamic(() => import('@/components/AnimatedBackground'), {
  ssr: false
})

// Exact colors from dashboard theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  secondary: '#262626',
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const session = await adminLogin(email, password)

      if (session) {
        router.push('/admin')
      } else {
        setError('Credenciales inválidas. Por favor intente de nuevo.')
      }
    } catch (error) {
      console.error('Error durante login:', error)
      setError('Error al iniciar sesión. Por favor intente de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: colors.background }}>
      {/* Animated Background - Same as dashboard */}
      <div className="fixed inset-0 z-0">
        <AnimatedBackground />
      </div>

      {/* Login Form Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Card Container */}
          <div
            className="rounded-2xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Header with Logo */}
            <div
              className="px-8 py-6"
              style={{
                borderBottom: `1px solid ${colors.border}`,
                background: `linear-gradient(180deg, ${colors.card} 0%, rgba(38, 38, 36, 0.8) 100%)`
              }}
            >
              <div className="flex justify-center">
                <Image
                  src="/NDV_Logo_Negro.svg"
                  alt="Neumáticos del Valle"
                  width={180}
                  height={45}
                  className="brightness-0 invert"
                  priority
                />
              </div>
            </div>

            {/* Form Section */}
            <div className="px-8 py-8">
              {/* Welcome Text */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2" style={{ color: colors.foreground }}>
                  Panel de Administración
                </h1>
                <p className="text-sm" style={{ color: colors.mutedForeground }}>
                  Ingresá tus credenciales para continuar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label
                    htmlFor="email"
                    className="block text-sm font-medium mb-2"
                    style={{ color: colors.foreground }}
                  >
                    Email
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-lg transition-all"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      color: colors.foreground
                    }}
                    placeholder="admin@neumaticosdelvalle.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium"
                      style={{ color: colors.foreground }}
                    >
                      Contraseña
                    </Label>
                    <a
                      href="#"
                      className="text-sm hover:opacity-80 transition-opacity"
                      style={{ color: colors.primary }}
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-lg transition-all"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colors.border}`,
                      color: colors.foreground
                    }}
                    placeholder="••••••••••••••••"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 font-semibold rounded-xl transition-all transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, #FF8A1D 0%, #FFA758 100%)`,
                    color: '#ffffff',
                    boxShadow: '0 4px 15px rgba(255, 138, 29, 0.3)'
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando sesión...
                    </span>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444'
                  }}
                >
                  {error}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-8 py-4 text-center"
              style={{
                borderTop: `1px solid ${colors.border}`,
                background: `linear-gradient(180deg, rgba(38, 38, 36, 0.8) 0%, ${colors.card} 100%)`
              }}
            >
              <p className="text-sm" style={{ color: colors.mutedForeground }}>
                ¿No tienes una cuenta?{' '}
                <a
                  href="#"
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: colors.primary }}
                >
                  Contacta al administrador
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-8 flex items-center justify-center space-x-6">
            <a
              href="#"
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: colors.mutedForeground }}
            >
              Términos de uso
            </a>
            <span className="text-sm" style={{ color: colors.border }}>•</span>
            <a
              href="#"
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: colors.mutedForeground }}
            >
              Política de privacidad
            </a>
            <span className="text-sm" style={{ color: colors.border }}>•</span>
            <a
              href="#"
              className="text-sm hover:opacity-80 transition-opacity"
              style={{ color: colors.mutedForeground }}
            >
              Ayuda
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}