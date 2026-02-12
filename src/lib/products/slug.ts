/**
 * Generates a URL-friendly slug for a product.
 *
 * Format: {brand}-{model}-{width}-{profile}-r{diameter}-{sku}
 * Example: pirelli-cinturato-p7-205-55-r16-2854500
 *
 * The SKU suffix guarantees uniqueness even for same-model variants.
 */
export function generateSlug(product: {
  brand?: string
  model?: string
  name?: string
  width?: number | null
  profile?: number | null
  diameter?: number | null
  sku?: string
  id?: string
}): string {
  const parts: string[] = []

  // Brand
  if (product.brand) {
    parts.push(product.brand)
  }

  // Model (prefer model, fallback to name)
  const model = product.model || product.name
  if (model) {
    parts.push(model)
  }

  // Dimensions (only if all are valid)
  if (product.width && product.width > 0 &&
      product.profile && product.profile > 0 &&
      product.diameter && product.diameter > 0) {
    parts.push(String(product.width))
    parts.push(String(product.profile))
    parts.push(`r${product.diameter}`)
  }

  // SKU suffix for uniqueness (always included)
  const sku = product.sku || (product.id ? product.id.slice(0, 8) : '')
  if (sku) {
    parts.push(sku)
  }

  // Join, normalize, and clean
  let slug = parts
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9-]/g, '-')    // Replace non-alphanumeric with dash
    .replace(/-+/g, '-')            // Collapse consecutive dashes
    .replace(/^-|-$/g, '')          // Trim leading/trailing dashes

  // Max 120 characters
  if (slug.length > 120) {
    slug = slug.slice(0, 120).replace(/-$/, '')
  }

  return slug
}
