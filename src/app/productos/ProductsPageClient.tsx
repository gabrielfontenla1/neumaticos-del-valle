"use client"

import ProductsPageWrapper from "./ProductsPageWrapper"

export default function ProductsPageClient({ children }: { children: React.ReactNode }) {
  return (
    <ProductsPageWrapper>
      {children}
    </ProductsPageWrapper>
  )
}
