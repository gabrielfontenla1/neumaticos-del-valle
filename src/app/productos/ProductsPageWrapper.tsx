"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function ProductsPageWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Hide skeleton after a brief moment to allow content to render
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative">
      {/* Render content in background - always visible but behind loading overlay */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* Loading overlay with fade-out */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 overflow-auto bg-[#EDEDED]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ zIndex: 40 }}
          >
            <div className="min-h-screen bg-[#EDEDED]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with title skeleton */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-5 w-96 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
                  </div>

                  {/* Stats cards skeleton */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-[#FFFFFF] p-4 rounded-lg border border-gray-200">
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
                        <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Filters sidebar skeleton */}
                  <div className="lg:w-72">
                    <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-6">
                      {/* Search input skeleton */}
                      <div className="mb-6">
                        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                        <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
                      </div>

                      {/* Filter sections skeleton */}
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
                          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3" />
                          <div className="space-y-2">
                            {[1, 2, 3].map((j) => (
                              <div key={j} className="flex items-center gap-2">
                                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Reset button skeleton */}
                      <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                  </div>

                  {/* Main content area skeleton */}
                  <div className="flex-1">
                    {/* Sort and view controls skeleton */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
                        <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
                      </div>
                      <div className="h-5 w-56 bg-gray-100 rounded animate-pulse" />
                    </div>

                    {/* Product grid skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={i} className="bg-[#FFFFFF] border border-gray-200 rounded-lg overflow-hidden">
                          {/* Image skeleton - cuadrada */}
                          <div className="w-full aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />

                          {/* Content skeleton */}
                          <div className="p-5">
                            {/* Brand/Title skeleton */}
                            <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse w-3/4" />
                            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse" />

                            {/* Price skeleton */}
                            <div className="h-8 bg-gray-300 rounded mb-4 w-1/2 animate-pulse" />

                            {/* Specs skeleton */}
                            <div className="space-y-2 mb-4">
                              <div className="h-4 bg-gray-100 rounded animate-pulse w-5/6" />
                              <div className="h-4 bg-gray-100 rounded animate-pulse w-4/6" />
                            </div>

                            {/* Stock badge skeleton */}
                            <div className="h-6 bg-gray-200 rounded-full w-20 mb-3 animate-pulse" />

                            {/* Button skeleton */}
                            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination skeleton */}
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 w-10 bg-gray-300 rounded animate-pulse" />
                      <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
