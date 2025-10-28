export default function ProductsSkeleton() {
  return (
    <div className="min-h-screen bg-[#EDEDED]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with title skeleton */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-5 w-96 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Total', 'En Stock', 'Marcas', 'Categorías'].map((label, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
                <div className="text-xs text-gray-600 mb-1">{label}</div>
                <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar skeleton (Hidden on mobile, visible on lg+) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
              </div>

              {/* Size search skeleton */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse mb-1.5" />
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Search skeleton */}
              <div className="mb-4">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
              </div>

              {/* Filter sections skeleton */}
              {['Marca', 'Categoría', 'Modelo'].map((label, i) => (
                <div key={i} className="mb-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ))}

              {/* Size filters skeleton */}
              <div className="mb-4 pb-4 border-b border-gray-100">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                {['Ancho', 'Perfil', 'Rodado'].map((label, i) => (
                  <div key={i} className="mb-2.5">
                    <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mb-1" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Checkbox skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </aside>

          {/* Main content area skeleton */}
          <div className="flex-1">
            {/* Mobile Filter Button skeleton */}
            <div className="lg:hidden mb-4">
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Results header skeleton */}
            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Product grid skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-[0_2px_4px_-1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.03)]">
                  {/* Image skeleton - cuadrada */}
                  <div className="w-full aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />

                  {/* Content skeleton */}
                  <div className="flex flex-col h-full p-4">
                    <div className="flex-1">
                      {/* Brand skeleton */}
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1" />

                      {/* Size skeleton */}
                      <div className="h-7 w-32 bg-gray-300 rounded animate-pulse mb-1" />

                      {/* Model skeleton */}
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />

                      {/* Tags skeleton */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <div className="h-5 w-14 bg-blue-50 rounded animate-pulse" />
                        <div className="h-5 w-16 bg-green-50 rounded animate-pulse" />
                      </div>

                      {/* Rating skeleton */}
                      <div className="flex items-center gap-0.5 mb-3">
                        <div className="h-3 w-16 bg-yellow-200 rounded animate-pulse" />
                        <div className="h-3 w-8 bg-gray-100 rounded animate-pulse ml-1" />
                      </div>
                    </div>

                    {/* Price section skeleton */}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-5 w-14 bg-green-50 rounded animate-pulse" />
                      </div>
                      <div className="mb-1">
                        <div className="h-8 w-28 bg-gray-300 rounded animate-pulse" />
                      </div>
                      <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mb-2" />
                      <div className="text-center">
                        <div className="h-5 w-20 bg-green-50 rounded-full animate-pulse inline-block" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="mt-8 bg-white p-4 rounded-lg border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                  {/* Next button */}
                  <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                </div>
                <div className="sm:hidden h-5 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}