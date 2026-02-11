'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, List } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface LegalHeaderProps {
  title: string
  icon: LucideIcon
  onMobileMenuToggle: () => void
  isMobileMenuOpen: boolean
}

export function LegalHeader({ title, icon: Icon, onMobileMenuToggle, isMobileMenuOpen }: LegalHeaderProps) {
  return (
    <motion.header
      role="banner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors duration-200 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Volver</span>
        </Link>

        {/* Center: Icon + title */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400">
          <Icon className="w-4 h-4" />
          <span className="truncate max-w-[200px]">{title}</span>
        </div>

        {/* Right: Logo (desktop) + mobile menu toggle */}
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Image
              src="/NDV_Logo.svg"
              alt="Neumaticos del Valle"
              width={100}
              height={28}
              className="h-7 w-auto lg:h-8"
            />
          </Link>

          {/* Mobile/Tablet menu toggle */}
          <button
            onClick={onMobileMenuToggle}
            aria-expanded={isMobileMenuOpen}
            aria-controls="legal-mobile-menu"
            aria-label="Abrir menu de navegacion"
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
