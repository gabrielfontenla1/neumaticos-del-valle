import { Navbar } from '@/components/layout/Navbar'

export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[#FFFFFF] border-b border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="py-4">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-2">
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="ml-3 h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="px-6 py-4">
                  <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-4" />
                </div>

                {/* Cart items skeleton */}
                {[1, 2, 3].map((item, index) => (
                  <div key={item} className={index !== 2 ? 'border-b border-gray-200' : ''}>
                    <div className="flex gap-3 sm:gap-4 p-4 sm:p-6">
                      {/* Checkbox */}
                      <div className="pt-4">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                      </div>

                      {/* Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-200 rounded animate-pulse" />

                      {/* Content */}
                      <div className="flex-1">
                        {/* Brand */}
                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-2" />

                        {/* Title */}
                        <div className="h-5 w-48 bg-gray-300 rounded animate-pulse mb-2" />

                        {/* Model */}
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />

                        {/* Stock */}
                        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-3" />

                        {/* Desktop: Eliminar */}
                        <div className="hidden sm:block">
                          <div className="h-4 w-16 bg-blue-100 rounded animate-pulse" />
                        </div>

                        {/* Mobile: Price and controls */}
                        <div className="sm:hidden">
                          <div className="h-6 w-24 bg-gray-300 rounded animate-pulse mb-3" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                              <div className="h-7 w-10 bg-gray-200 rounded animate-pulse" />
                              <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="h-4 w-16 bg-blue-100 rounded animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Desktop: Quantity and Price */}
                      <div className="hidden sm:flex sm:items-start sm:gap-8">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                          <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        </div>

                        {/* Price */}
                        <div className="min-w-[120px]">
                          <div className="h-7 w-28 bg-gray-300 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Info */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-12 bg-green-200 rounded animate-pulse" />
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-green-300 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#FFFFFF] rounded-lg border border-gray-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] p-6 sticky top-28">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6" />

              <div className="space-y-4">
                {/* Products */}
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Shipping */}
                <div className="flex items-center justify-between">
                  <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-green-200 rounded animate-pulse" />
                </div>

                {/* Coupon */}
                <div className="pt-2">
                  <div className="h-4 w-36 bg-blue-100 rounded animate-pulse" />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4">
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-32 bg-gray-300 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6">
                <div className="h-12 w-full bg-green-200 rounded-lg animate-pulse" />
              </div>

              {/* Additional options */}
              <div className="mt-4 text-center">
                <div className="h-4 w-36 bg-blue-100 rounded animate-pulse mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}