'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Tracks which section is currently visible in the viewport using IntersectionObserver.
 *
 * @param sectionIds - Array of HTML element ids to observe
 * @returns The id of the currently active (most visible) section, or null
 */
export function useLegalScrollSpy(sectionIds: string[]): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current?.disconnect()

    const callback: IntersectionObserverCallback = (entries) => {
      const intersecting = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (intersecting.length > 0) {
        setActiveSection(intersecting[0].target.id)
      }
    }

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '-80px 0px -60% 0px',
    })

    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [sectionIds])

  return activeSection
}
