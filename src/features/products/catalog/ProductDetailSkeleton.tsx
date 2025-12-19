import { Skeleton } from '@/components/ui/skeleton'
import { Navbar } from '@/components/layout/Navbar'

export default function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white lg:bg-[#EDEDED]">
      <Navbar />

      {/* Mobile spacing for navbar */}
      <div className="pt-4 lg:pt-0 bg-white lg:bg-[#EDEDED]"></div>

      <div className="lg:max-w-[1440px] lg:mx-auto lg:px-4 sm:px-6 lg:px-8 lg:py-6">
        {/* Desktop Breadcrumb Skeleton */}
        <div className="hidden lg:block mb-4">
          <Skeleton className="h-8 w-40" />
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Mobile: Image First (order-1) / Desktop: Left Column */}
          <div className="order-1 lg:space-y-4">
            {/* Mobile Back Button and Title Skeleton */}
            <div className="lg:hidden px-4 py-3">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-6 w-full mb-1" />
              <Skeleton className="h-6 w-3/4" />
            </div>

            {/* Image Skeleton - Full width on mobile, card on desktop */}
            <div className="bg-[#FFFFFF] lg:rounded-lg lg:border lg:border-gray-200 lg:p-6 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
              <Skeleton className="aspect-square w-full" />
            </div>

            {/* Features Cards Skeleton - Hidden on mobile */}
            <div className="hidden lg:grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-3 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                  <Skeleton className="h-5 w-5 mx-auto mb-1.5" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Info Second (order-2) / Desktop: Right Column */}
          <div className="order-2 space-y-4">
            {/* Main Info Card Skeleton - Full width on mobile */}
            <div className="bg-[#FFFFFF] px-4 py-5 lg:rounded-lg lg:border lg:border-gray-200 lg:p-5 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
              {/* Brand and Stock - Hidden on mobile */}
              <div className="hidden lg:flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>

              {/* Product Name - Hidden on mobile */}
              <div className="hidden lg:block mb-3">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-3/4" />
              </div>

              {/* Rating - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>

              {/* Price - Larger on mobile */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 lg:h-3 w-24" />
                  <Skeleton className="h-6 lg:h-5 w-16" />
                </div>
                <Skeleton className="h-9 lg:h-8 w-40 mb-2" />
                <Skeleton className="h-4 lg:h-3 w-48 mb-2" />
                <Skeleton className="h-4 lg:h-3 w-32" />
              </div>

              {/* Size Information */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <Skeleton className="h-4 w-40 mb-2" />
                <div className="bg-gray-50 rounded-lg p-3">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-3 w-full mb-1" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stock disponible - Mobile */}
              <div className="mb-4">
                <Skeleton className="h-5 w-32" />
              </div>

              {/* Quantity and Buttons */}
              <div>
                <Skeleton className="h-5 lg:h-4 w-48 mb-2" />
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-9 lg:h-8 w-32" />
                </div>
                <Skeleton className="h-11 lg:h-10 w-full mb-3" />
                <Skeleton className="h-11 lg:h-10 w-full" />
              </div>
            </div>

            {/* Stock por sucursal Skeleton */}
            <div className="bg-[#FFFFFF] lg:rounded-lg lg:border lg:border-gray-200 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
              <div className="px-4 py-4 lg:p-5">
                <Skeleton className="h-5 w-48 mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-4 w-4 flex-shrink-0 rounded" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Size Information Skeleton */}
            <div className="bg-[#FFFFFF] lg:rounded-lg lg:border lg:border-gray-200 lg:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
              <div className="px-4 py-4 lg:p-5">
                <Skeleton className="h-5 w-40 mb-3" />
                <div className="bg-gray-50 lg:rounded-lg p-4">
                  <Skeleton className="h-8 w-40 mb-3" />
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card Skeleton */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] mb-4">
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Features Card Skeleton */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
              <Skeleton className="h-4 w-40 mb-2" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Category Card Skeleton */}
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Installment Table Skeleton */}
        <div className="mt-8 bg-[#FFFFFF] rounded-lg border border-gray-200 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Equivalent Tires Skeleton */}
        <div className="mt-8 bg-[#FFFFFF] rounded-lg border border-gray-200 p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24 ml-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#FFFFFF] rounded-lg border border-gray-200 p-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
                <Skeleton className="aspect-square w-full mb-3" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
