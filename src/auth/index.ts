import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})

// Export middleware config
export const middleware = auth

// Define protected routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|auth).*)",
  ],
}