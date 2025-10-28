"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = () => {
    switch (error) {
      case "Configuration":
        return "Hay un problema con la configuración del servidor. Por favor, contacta al administrador."
      case "AccessDenied":
        return "No tienes permiso para acceder a este recurso."
      case "Verification":
        return "El enlace de verificación ha expirado o ya fue usado."
      case "OAuthSignin":
        return "Error al iniciar sesión con Google. Por favor, intenta nuevamente."
      case "OAuthCallback":
        return "Error al procesar la respuesta de Google. Por favor, intenta nuevamente."
      case "OAuthCreateAccount":
        return "No se pudo crear tu cuenta. Por favor, intenta con otro método."
      case "EmailCreateAccount":
        return "No se pudo crear tu cuenta con este correo electrónico."
      case "Callback":
        return "Error en el proceso de autenticación. Por favor, intenta nuevamente."
      case "OAuthAccountNotLinked":
        return "Este correo ya está registrado con otro método de inicio de sesión."
      case "SessionRequired":
        return "Por favor, inicia sesión para acceder a esta página."
      default:
        return "Ocurrió un error durante el proceso de autenticación."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error de Autenticación
          </h1>

          <p className="text-gray-600 mb-6">
            {getErrorMessage()}
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Intentar nuevamente
            </Link>

            <Link
              href="/"
              className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}