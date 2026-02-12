'use client'

import { useRef, useCallback } from 'react'

const PREFIX = 'scroll-pos:'
const MAX_AGE = 10 * 60 * 1000 // 10 minutes

/**
 * Get the actual scrollable element.
 * When html+body both have height:100% + overflow-y:auto, the body becomes
 * the scroll container and window.scrollTo/window.scrollY don't work.
 * Falls back to documentElement for standard layouts.
 */
function getScrollElement(): Element {
  const body = document.body
  const html = document.documentElement
  if (body.scrollHeight > body.clientHeight && html.scrollHeight <= html.clientHeight + 1) {
    return body
  }
  return html
}

function getScrollTop(): number {
  const el = getScrollElement()
  return el === document.body ? document.body.scrollTop : window.scrollY
}

function scrollTo(y: number): void {
  const el = getScrollElement()
  el.scrollTo(0, y)
}

function getMaxScroll(): number {
  const el = getScrollElement()
  return el.scrollHeight - el.clientHeight
}

/**
 * Hook for saving and restoring scroll position across client-side navigations.
 *
 * Uses sessionStorage (per-tab) with a timestamp to detect when the user is
 * returning from a product detail page via back navigation.
 *
 * The `isReturningRef` is initialized synchronously during the first render
 * (before any effects run) so it can be used as a guard in other effects to
 * prevent page-reset and scroll-to-top from firing on back navigation.
 */
export function useScrollRestoration(key: string) {
  const sk = PREFIX + key

  // Detect "returning" state synchronously during first render, before effects.
  const isReturningRef = useRef<boolean | null>(null)
  if (isReturningRef.current === null) {
    try {
      const t = sessionStorage.getItem(sk + ':t')
      if (t && Date.now() - Number(t) < MAX_AGE && sessionStorage.getItem(sk + ':y') !== null) {
        isReturningRef.current = true
      } else {
        isReturningRef.current = false
        sessionStorage.removeItem(sk + ':y')
        sessionStorage.removeItem(sk + ':t')
      }
    } catch {
      isReturningRef.current = false
    }
  }

  // Timer ID for cancelling pending restore retries
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Save current scroll position before navigating to a product detail. */
  const saveScrollPosition = useCallback(() => {
    try {
      let y = Math.round(getScrollTop())
      const max = getMaxScroll()
      // Clamp: don't save positions in the bottom 200px (pagination/footer area).
      // If the user is near the bottom (e.g. reaching for the paginator) and
      // accidentally taps a product link, restoring to the very bottom is bad UX.
      if (max > 400 && y > max - 200) {
        y = max - 200
      }
      sessionStorage.setItem(sk + ':y', String(y))
      sessionStorage.setItem(sk + ':t', String(Date.now()))
    } catch { /* sessionStorage unavailable */ }
  }, [sk])

  /**
   * Cancel any pending restore and clear all scroll restoration state.
   * Call this on any user-initiated navigation (page change, filter change).
   */
  const clearSavedPosition = useCallback(() => {
    isReturningRef.current = false
    if (restoreTimerRef.current !== null) {
      clearTimeout(restoreTimerRef.current)
      restoreTimerRef.current = null
    }
    try {
      sessionStorage.removeItem(sk + ':y')
      sessionStorage.removeItem(sk + ':t')
    } catch { /* sessionStorage unavailable */ }
  }, [sk])

  /**
   * Restore the saved scroll position. Call this after products have loaded
   * (isLoading === false) so the page is tall enough to scroll to.
   */
  const restoreScrollPosition = useCallback(() => {
    if (!isReturningRef.current) return
    isReturningRef.current = false

    let y = 0
    try {
      const v = sessionStorage.getItem(sk + ':y')
      sessionStorage.removeItem(sk + ':y')
      sessionStorage.removeItem(sk + ':t')
      y = v ? parseInt(v, 10) : 0
    } catch { /* sessionStorage unavailable */ }
    if (!y || y <= 0) return

    const target = y
    let attempts = 0
    const tryScroll = () => {
      // If clearSavedPosition was called, abort
      if (restoreTimerRef.current === null) return
      restoreTimerRef.current = null

      const maxAvailable = getMaxScroll()
      if (maxAvailable >= target || attempts >= 30) {
        scrollTo(Math.min(target, Math.max(0, maxAvailable)))
      } else {
        attempts++
        restoreTimerRef.current = setTimeout(tryScroll, 50)
      }
    }
    restoreTimerRef.current = setTimeout(tryScroll, 100)
  }, [sk])

  return {
    isReturningRef,
    saveScrollPosition,
    restoreScrollPosition,
    /** Cancel any pending restore and clear all saved scroll data. */
    clearSavedPosition,
  }
}
