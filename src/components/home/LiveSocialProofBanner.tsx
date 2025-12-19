'use client'

import { motion } from 'framer-motion'
import { Users, ThumbsUp } from 'lucide-react'
import { useState } from 'react'

const notifications = [
  { name: 'Juan M.', action: 'reservó un turno', time: 'hace 3 minutos', location: 'Catamarca' },
  { name: 'María G.', action: 'compró 4 neumáticos', time: 'hace 7 minutos', location: 'Tucumán' },
  { name: 'Carlos P.', action: 'realizó un service', time: 'hace 12 minutos', location: 'Salta' },
]

export function LiveSocialProofBanner() {
  const [currentNotification, setCurrentNotification] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {notifications[currentNotification].name} {notifications[currentNotification].action}
          </p>
          <p className="text-xs text-gray-500">
            {notifications[currentNotification].location} • {notifications[currentNotification].time}
          </p>
        </div>
        <ThumbsUp className="w-5 h-5 text-[#FEE004]" />
      </div>
    </motion.div>
  )
}
