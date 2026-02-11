'use client'

import { motion } from 'framer-motion'
import type { LegalPageConfig } from './types'
import { LegalSection } from './LegalSection'

interface LegalContentProps {
  config: LegalPageConfig
}

const heroStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const heroItem = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

export function LegalContent({ config }: LegalContentProps) {
  const Icon = config.icon

  return (
    <main id="legal-content" role="main" className="flex-1 min-w-0 max-w-3xl">
      {/* Hero */}
      <div className="px-4 sm:px-6 lg:px-0 py-8 sm:py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroStagger}
          className="space-y-5"
        >
          <motion.div variants={heroItem} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FEE004]/10 border border-[#FEE004]/20">
              <Icon className="w-5 h-5 text-[#FEE004]" />
            </div>
            <span className="text-xs font-medium text-[#FEE004] tracking-wider uppercase">
              {config.badge}
            </span>
          </motion.div>

          <motion.h1
            variants={heroItem}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent"
          >
            {config.title}
          </motion.h1>

          <motion.p variants={heroItem} className="text-sm text-gray-500">
            {config.subtitle}
          </motion.p>

          <motion.p variants={heroItem} className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-3xl">
            {config.intro}
          </motion.p>
        </motion.div>
      </div>

      {/* Sections */}
      <div className="px-4 sm:px-6 lg:px-0 pb-12 space-y-6 sm:space-y-8">
        {config.sections.map((section, index) => (
          <LegalSection key={section.id} section={section} index={index} />
        ))}
      </div>
    </main>
  )
}
