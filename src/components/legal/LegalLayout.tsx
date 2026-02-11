'use client'

import { useState, useMemo, useCallback } from 'react'
import type { LegalPageConfig } from './types'
import { useLegalScrollSpy } from './useLegalScrollSpy'
import { LegalProgressBar } from './LegalProgressBar'
import { LegalHeader } from './LegalHeader'
import { LegalSidebar } from './LegalSidebar'
import { LegalContent } from './LegalContent'
import { LegalMobileMenu } from './LegalMobileMenu'
import { LegalFooter } from './LegalFooter'

interface LegalLayoutProps {
  config: LegalPageConfig
}

export function LegalLayout({ config }: LegalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const sectionIds = useMemo(
    () => config.sections.map((s) => s.id),
    [config.sections]
  )

  const activeSection = useLegalScrollSpy(sectionIds)

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev)
  }, [])

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-black">
      {/* Skip to content */}
      <a
        href="#legal-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:bg-[#FEE004] focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
      >
        Saltar al contenido
      </a>

      <LegalProgressBar />

      <LegalHeader
        title={config.title}
        icon={config.icon}
        onMobileMenuToggle={handleMobileMenuToggle}
        isMobileMenuOpen={mobileMenuOpen}
      />

      <LegalMobileMenu
        sections={config.sections}
        activeSection={activeSection}
        isOpen={mobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      {/* Main layout: sidebar + content */}
      <div className="pt-14 max-w-7xl mx-auto flex gap-8">
        <LegalSidebar
          sections={config.sections}
          activeSection={activeSection}
        />
        <LegalContent config={config} />
      </div>

      <LegalFooter />
    </div>
  )
}
