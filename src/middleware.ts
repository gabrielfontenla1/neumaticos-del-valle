import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
                          req.nextUrl.pathname.startsWith("/admin") ||
                          req.nextUrl.pathname.startsWith("/profile")

  // If on auth page and logged in, redirect to home
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If accessing protected route and not logged in, redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
}