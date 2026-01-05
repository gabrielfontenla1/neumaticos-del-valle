import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

interface AuthResult {
  authorized: true
  session: Session
}

interface UnauthorizedResult {
  authorized: false
  response: NextResponse
}

type RequireAdminAuthResult = AuthResult | UnauthorizedResult

/**
 * Check if the current user is authenticated and has admin access
 * Use this helper at the start of admin API route handlers
 *
 * @example
 * export async function GET(request: Request) {
 *   const authResult = await requireAdminAuth()
 *   if (!authResult.authorized) {
 *     return authResult.response
 *   }
 *   // Continue with admin logic...
 * }
 */
export async function requireAdminAuth(): Promise<RequireAdminAuthResult> {
  const session = await auth()

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }
  }

  // Check if user has admin role
  // Admin users are identified by:
  // 1. Email domain @neumaticoselvalle.com (or @neumaticosdelvallesrl.com.ar)
  // 2. Role set to 'admin' in the session
  const userEmail = session.user.email?.toLowerCase() || ''
  const userRole = (session.user as { role?: string }).role

  const isAdminByEmail =
    userEmail.endsWith('@neumaticoselvalle.com') ||
    userEmail.endsWith('@neumaticosdelvallesrl.com.ar')

  const isAdminByRole = userRole === 'admin'

  const isAdmin = isAdminByEmail || isAdminByRole

  if (!isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
  }

  return { authorized: true, session }
}
