'use client'

import { motion } from 'framer-motion'
import type { LegalSectionData } from './types'

interface LegalSidebarProps {
  sections: LegalSectionData[]
  activeSection: string | null
}

const listStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariant = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

function handleSectionClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export function LegalSidebar({ sections, activeSection }: LegalSidebarProps) {
  return (
    <aside className="hidden lg:block w-[260px] flex-shrink-0">
      <nav
        aria-label="Tabla de contenidos"
        className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto px-6 py-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4">
          Contenido
        </p>
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={listStagger}
          className="space-y-1"
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id
            return (
              <motion.li key={section.id} variants={itemVariant}>
                <a
                  href={`#${section.id}`}
                  onClick={(e) => handleSectionClick(e, section.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`block text-sm py-2 pl-4 border-l-2 transition-all duration-200 ${
                    isActive
                      ? 'text-[#FEE004] border-l-[#FEE004] bg-white/[0.02] font-medium'
                      : 'text-gray-500 border-white/5 hover:text-gray-300'
                  }`}
                >
                  {section.title}
                </a>
              </motion.li>
            )
          })}
        </motion.ul>
      </nav>
    </aside>
  )
}
