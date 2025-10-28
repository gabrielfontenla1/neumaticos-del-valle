import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account && profile) {
        token.accessToken = account.access_token
        token.id = profile.sub
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ account, profile }) {
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