"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

export function UserButton() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
    )
  }

  if (!session?.user) {
    return (
      <Link
        href="/auth/login"
        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
      >
        Iniciar Sesión
      </Link>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "Usuario"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-medium">
            {session.user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <button
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
            aria-label="Cerrar menú"
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <p className="font-medium text-gray-900">
                {session.user.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {session.user.email}
              </p>
            </div>

            <div className="p-2">
              <Link
                href="/profile"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Mi Perfil
              </Link>
              <Link
                href="/orders"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Mis Pedidos
              </Link>
              <Link
                href="/settings"
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Configuración
              </Link>
            </div>

            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  signOut({ callbackUrl: "/" })
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}