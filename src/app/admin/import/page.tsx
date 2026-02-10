'use client'

import ExcelImporter from '@/features/products/import/ExcelImporter'

export default function ImportPage() {
  return (
    <div className="p-6 pl-10 min-h-screen">
      <ExcelImporter />
    </div>
  )
}
