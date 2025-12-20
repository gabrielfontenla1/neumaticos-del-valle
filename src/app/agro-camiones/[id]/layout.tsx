import { Navbar } from '@/components/layout/Navbar'
import { Suspense } from 'react'

export default function AgroCamionesProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen bg-[#EDEDED]" />}>
        {children}
      </Suspense>
    </>
  )
}
