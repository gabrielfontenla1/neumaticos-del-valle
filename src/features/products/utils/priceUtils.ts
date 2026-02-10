/**
 * Canonical price_list resolution.
 *
 * Priority order:
 * 1. features.price_list  (source of truth, written by stock update from Excel PUBLICO column)
 * 2. product.price_list   (DB column, synced copy)
 * 3. Math.round(price / 0.75) (fallback: assumes 25% discount)
 */
export function resolvePriceList(product: {
  price: number
  price_list?: number | null
  features?: Record<string, unknown> | null
}): number {
  const fromFeatures = (product.features?.price_list as number | undefined) ?? null
  const fromColumn = product.price_list ?? null

  if (fromFeatures && fromFeatures > 0) return fromFeatures
  if (fromColumn && fromColumn > 0) return fromColumn
  return Math.round(product.price / 0.75)
}

export function resolveDiscountPercentage(product: {
  price: number
  price_list?: number | null
  features?: Record<string, unknown> | null
}): number {
  const priceList = resolvePriceList(product)
  if (priceList > product.price) {
    return Math.round(((priceList - product.price) / priceList) * 100)
  }
  return 25
}
