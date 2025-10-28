import { LoginForm } from "@/features/auth/components/LoginForm"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100 px-4 py-12">
      <Suspense fallback={
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4" />
            <div className="h-4 bg-gray-200 rounded mb-8 w-3/4 mx-auto" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: "Iniciar Sesión - Neumáticos del Valle",
  description: "Inicia sesión o regístrate en Neumáticos del Valle",
}