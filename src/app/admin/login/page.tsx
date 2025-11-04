/**
 * Admin Login Page - Exact Rapicompras Style
 * Dark theme with orange accents using shadcn/ui components
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'
import { adminLogin } from '@/features/admin/api'
import AnimatedBackground from '@/components/AnimatedBackground'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#3d3d3b',  // Más oscuro basado en referencia
  foreground: '#fafafa',
  card: '#333331',        // Card más oscura
  cardForeground: '#fafafa',
  primary: '#d97757',
  primaryForeground: '#ffffff',
  secondary: '#2d2d2b',
  secondaryForeground: '#fafafa',
  muted: '#2d2d2b',
  mutedForeground: '#999999',  // Más claro para mejor contraste
  border: '#2d2d2b',
  input: '#2d2d2b',       // Inputs más oscuros
  ring: '#d97757',
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
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
        setIsExiting(true)
        setTimeout(() => {
          router.push('/admin')
        }, 600)
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
    <div
      className="min-h-screen relative overflow-hidden transition-colors"
      style={{
        backgroundColor: colors.background
      }}
    >
      {/* Animated background */}
      <AnimatedBackground />

      {/* Header */}
      <motion.header
        className="absolute top-0 left-0 right-0 z-50 p-6 md:p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-lg font-light" style={{ color: colors.foreground }}>
              Neumáticos del Valle
            </span>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Card container */}
          <motion.div
            className="rounded-xl border-0"
            style={{
              backgroundColor: colors.card,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.4)'
            }}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{
              opacity: isExiting ? 0 : 1,
              y: isExiting ? -50 : 0,
              scale: isExiting ? 1.05 : 1
            }}
            transition={{
              duration: isExiting ? 0.4 : 0.5,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            <div className="p-8">
                {/* Icon */}
                <motion.div
                  className="flex justify-center mb-8"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.primary + '20' }}
                  >
                    <User className="h-10 w-10" style={{ color: colors.primary }} />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  className="text-center mb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h1 className="text-3xl font-light mb-3" style={{ color: colors.foreground }}>
                    Iniciar Sesión
                  </h1>
                  <p className="text-sm" style={{ color: colors.mutedForeground }}>
                    Neumáticos del Valle
                  </p>
                </motion.div>

                {/* Form */}
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* Email */}
                  <div>
                    <Label
                      htmlFor="email"
                      className="block text-sm font-normal mb-2"
                      style={{ color: colors.foreground }}
                    >
                      Usuario o Email
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 px-4 rounded-lg border-0 focus-visible:ring-1 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                      style={{
                        backgroundColor: colors.input,
                        borderColor: 'transparent',
                        color: colors.foreground,
                        boxShadow: 'none'
                      }}
                      placeholder="tu@email.com"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <Label
                      htmlFor="password"
                      className="block text-sm font-normal mb-2"
                      style={{ color: colors.foreground }}
                    >
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 px-4 pr-12 rounded-lg border-0 focus-visible:ring-1 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                        style={{
                          backgroundColor: colors.input,
                          borderColor: 'transparent',
                          color: colors.foreground,
                          boxShadow: 'none'
                        }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                        style={{ color: colors.mutedForeground }}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <Alert
                      className="border"
                      style={{
                        backgroundColor: '#7f1d1d20',
                        borderColor: '#ef444480',
                        color: '#fca5a5'
                      }}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Remember me checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      className="border data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded"
                      style={{
                        borderColor: '#555555',
                        backgroundColor: 'transparent'
                      }}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-normal cursor-pointer select-none"
                      style={{ color: colors.mutedForeground }}
                    >
                      Recordarme por 30 días
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 border-0"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.primaryForeground
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                        <span>Iniciando sesión...</span>
                      </>
                    ) : (
                      <>
                        <span>Iniciar Sesión</span>
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Links */}
                  <div className="text-center pt-2">
                    <a
                      href="#"
                      className="text-sm underline transition-colors"
                      style={{ color: colors.primary }}
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                </motion.form>

                {/* Footer */}
                <motion.div
                  className="text-center mt-8 pt-6"
                  style={{ borderTop: `1px solid ${colors.border}20` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <p className="text-xs" style={{ color: colors.mutedForeground }}>
                    ¿No tienes cuenta?{' '}
                    <a
                      href="#"
                      className="underline transition-colors"
                      style={{ color: colors.primary }}
                    >
                      Contacta al administrador
                    </a>
                  </p>
                </motion.div>
              </div>
            </motion.div>

          {/* Additional links */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-6 text-xs">
              <a
                href="#"
                className="transition-colors hover:underline"
                style={{ color: colors.mutedForeground }}
              >
                Ayuda
              </a>
              <a
                href="#"
                className="transition-colors hover:underline"
                style={{ color: colors.mutedForeground }}
              >
                Términos
              </a>
              <a
                href="#"
                className="transition-colors hover:underline"
                style={{ color: colors.mutedForeground }}
              >
                Privacidad
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
