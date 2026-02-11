'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { LegalSectionData } from './types'

interface LegalMobileMenuProps {
  sections: LegalSectionData[]
  activeSection: string | null
  isOpen: boolean
  onClose: () => void
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

const panelVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'tween' as const, duration: 0.25, ease: 'easeOut' as const } },
  exit: { x: '100%', transition: { type: 'tween' as const, duration: 0.2, ease: 'easeIn' as const } },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
}

export function LegalMobileMenu({ sections, activeSection, isOpen, onClose }: LegalMobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const handleSectionClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    onClose()
    // Small delay to let the menu close before scrolling
    requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top, behavior: 'smooth' })
      }
    })
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 z-[54] lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            id="legal-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Tabla de contenidos"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 w-[85vw] max-w-sm h-full bg-black/95 backdrop-blur-xl border-l border-white/10 z-[55] lg:hidden"
          >
            {/* Close button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contenido
              </p>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white transition-colors duration-200"
                aria-label="Cerrar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section links */}
            <nav aria-label="Tabla de contenidos">
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-4 py-4 space-y-1"
              >
                {sections.map((section) => {
                  const isActive = activeSection === section.id
                  const SectionIcon = section.icon
                  return (
                    <motion.li key={section.id} variants={itemVariants}>
                      <a
                        href={`#${section.id}`}
                        onClick={(e) => handleSectionClick(e, section.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`flex items-center gap-3 py-3 px-4 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? 'text-[#FEE004] bg-white/[0.03]'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                        }`}
                      >
                        <SectionIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{section.title}</span>
                      </a>
                    </motion.li>
                  )
                })}
              </motion.ul>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
