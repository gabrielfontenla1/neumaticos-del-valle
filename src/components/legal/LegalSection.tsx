'use client'

import { motion } from 'framer-motion'
import type { LegalSectionData } from './types'

interface LegalSectionProps {
  section: LegalSectionData
  index: number
}

export function LegalSection({ section, index }: LegalSectionProps) {
  const Icon = section.icon

  return (
    <motion.section
      id={section.id}
      className="scroll-mt-20"
      style={{ contain: 'content' }}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="bg-white/[0.03] border border-white/[0.06] hover:border-white/10 rounded-2xl p-6 sm:p-8 transition-colors duration-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FEE004]/10 border border-[#FEE004]/20 flex-shrink-0">
            <Icon className="w-5 h-5 text-[#FEE004]" />
          </div>
          <h2
            id={`${section.id}-heading`}
            className="text-lg sm:text-xl font-semibold text-white pt-1"
          >
            {index + 1}. {section.title}
          </h2>
        </div>

        <div className="ml-0 sm:ml-14 space-y-4">
          {section.content.map((paragraph, pIndex) => (
            <p key={pIndex} className="text-sm sm:text-base text-gray-400 leading-relaxed">
              {paragraph}
            </p>
          ))}

          {section.list && (
            <ul className="space-y-2.5">
              {section.list.map((item, lIndex) => (
                <li key={lIndex} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FEE004] mt-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {section.extra && (
            <p className="text-sm text-gray-500 leading-relaxed italic">
              {section.extra}
            </p>
          )}
        </div>
      </div>
    </motion.section>
  )
}
