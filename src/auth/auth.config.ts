import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@neumaticosdelvalleocr.cl'
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin2024'

        if (email === adminEmail && password === adminPassword) {
          return {
            id: "admin-1",
            email,
            name: "Administrador",
            role: "admin",
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // On credentials sign-in, persist role from the user object
      if (user && account?.provider === "credentials") {
        token.role = (user as { role?: string }).role || "admin"
        token.id = user.id
      }
      // On OAuth sign-in, persist OAuth data
      if (account && profile) {
        token.accessToken = account.access_token
        token.id = profile.sub
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string | undefined
      }
      return session
    },
    async signIn({ account, profile }) {
      // Allow credentials provider
      if (account?.provider === "credentials") {
        return true
      }
      // Allow OAuth sign in only for verified Google accounts
      if (account?.provider === "google") {
        return profile?.email_verified === true
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt"
  }
} satisfies NextAuthConfig