'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function IAPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/chats?tab=ai-assistant')
  }, [router])

  return null
}
