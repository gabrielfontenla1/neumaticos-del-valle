'use client'

import { motion, useScroll } from 'framer-motion'

export function LegalProgressBar() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      role="progressbar"
      aria-label="Progreso de lectura"
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 h-0.5 bg-[#FEE004] origin-left z-[60]"
      style={{ scaleX: scrollYProgress, willChange: 'transform' }}
    />
  )
}
