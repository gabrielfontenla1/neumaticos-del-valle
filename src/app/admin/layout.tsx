// Admin Layout for authentication protection
import type { Metadata } from 'next'
import AdminLayoutClient from './layout-client'

// Prevent search engine indexing of admin pages
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
