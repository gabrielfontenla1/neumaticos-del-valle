import { CartItem, CartTotals, CustomerData, VoucherData } from '@/features/cart/types'

// WhatsApp numbers for each store
export const WHATSAPP_NUMBERS = {
  main: '5493855854741', // Número principal - Sucursal Catamarca Av Belgrano
  santiago: '5493855854741', // Mismo número para todas las sucursales
  default: '5493855854741' // Número por defecto
}

// Detect if user is on mobile
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent || navigator.vendor
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
}

// Format price in Argentine pesos
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(amount)
}

// Generate tire description
export function generateTireDescription(item: CartItem): string {
  if (item.width && item.aspect_ratio && item.rim_diameter) {
    return `${item.width}/${item.aspect_ratio}R${item.rim_diameter}`
  }
  return item.sku
}

// Generate WhatsApp message
export function generateWhatsAppMessage(voucher: VoucherData, orderNumber?: string): string {
  const lines = [
    `🚗 *SOLICITUD DE PRESUPUESTO*`,
    `📋 Código de Presupuesto: *${voucher.code}*`,
  ]

  // Add order number if provided
  if (orderNumber) {
    lines.push(`📌 Número de Orden: *${orderNumber}*`)
  }

  lines.push(
    ``,
    `👤 *DATOS DEL CLIENTE*`,
    `Nombre: ${voucher.customer_name}`,
    `Teléfono: ${voucher.customer_phone}`,
    `Email: ${voucher.customer_email}`,
    ``,
    `🛞 *PRODUCTOS SOLICITADOS*`,
  )

  // Add items
  voucher.items.forEach((item, index) => {
    const tire = generateTireDescription(item)
    const price = item.sale_price || item.price
    lines.push(
      `${index + 1}. ${item.brand} ${item.name}`,
      `   ${tire} - Cantidad: ${item.quantity}`,
      `   Precio unitario: ${formatPrice(price)}`,
      `   Subtotal: ${formatPrice(price * item.quantity)}`,
      ``
    )
  })

  // Add totals
  lines.push(
    `💰 *RESUMEN*`,
    `Subtotal: ${formatPrice(voucher.subtotal)}`,
    `IVA (19%): ${formatPrice(voucher.tax)}`,
    `*TOTAL: ${formatPrice(voucher.total)}*`,
  )

  // Add notes if present
  if (voucher.notes) {
    lines.push(
      ``,
      `📝 *NOTAS*`,
      voucher.notes
    )
  }

  // Add footer
  lines.push(
    ``,
    `_Este presupuesto es válido hasta el ${new Date(voucher.valid_until).toLocaleDateString('es-AR')}_`,
    `_Favor confirmar disponibilidad de stock_`
  )

  return lines.join('\n')
}

// Build WhatsApp URL
export function buildWhatsAppUrl(
  phoneNumber: string,
  message: string
): string {
  // Remove all non-numeric characters from phone
  const cleanPhone = phoneNumber.replace(/\D/g, '')

  // Check if it already has a country code (starts with 54 for Argentina or 56 for Chile)
  // If it already starts with 54 or 56, use as is
  // Otherwise, assume it's an Argentine number and add 54
  const finalPhone = (cleanPhone.startsWith('54') || cleanPhone.startsWith('56'))
    ? cleanPhone
    : `54${cleanPhone}`

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message)

  // Use appropriate URL based on device
  if (isMobileDevice()) {
    // Mobile devices - use direct WhatsApp protocol
    return `whatsapp://send?phone=${finalPhone}&text=${encodedMessage}`
  } else {
    // Desktop - use WhatsApp Web
    return `https://wa.me/${finalPhone}?text=${encodedMessage}`
  }
}

// Open WhatsApp with message
export function openWhatsApp(voucher: VoucherData, storePhone?: string, orderNumber?: string): void {
  const phone = storePhone || WHATSAPP_NUMBERS.default
  const message = generateWhatsAppMessage(voucher, orderNumber)
  const url = buildWhatsAppUrl(phone, message)

  // Open in new tab/window
  window.open(url, '_blank', 'noopener,noreferrer')
}

// Product data for quick message generation
export interface QuickMessageProduct {
  name: string
  brand: string
  sku: string
  width?: number | null
  aspect_ratio?: number | null
  rim_diameter?: number | null
}

// Generate simple message for quick inquiries
export function generateQuickMessage(
  product: QuickMessageProduct | string,
  productSku?: string,
  customerName?: string
): string {
  // Support legacy signature: (productName: string, productSku: string, customerName?: string)
  if (typeof product === 'string') {
    const productName = product
    const sku = productSku || ''
    const lines = [
      `*CONSULTA WEB*`,
      ``,
      `SKU: ${sku}`,
      `Producto: ${productName}`,
      ``,
      `Quisiera saber precio y disponibilidad.`,
      ``,
      `[BOT:CONSULTA_WEB]`
    ]

    if (customerName) {
      lines.splice(lines.length - 1, 0, `Nombre: ${customerName}`, ``)
    }

    return lines.join('\n')
  }

  // New signature with full product data
  const tireSize = (product.width && product.aspect_ratio && product.rim_diameter)
    ? `${product.width}/${product.aspect_ratio}R${product.rim_diameter}`
    : 'N/A'

  const lines = [
    `*CONSULTA WEB*`,
    ``,
    `SKU: ${product.sku}`,
    `${product.brand} ${product.name}`,
    `Medida: ${tireSize}`,
    ``,
    `Quisiera saber precio y disponibilidad.`,
    ``,
    `[BOT:CONSULTA_WEB]`
  ]

  if (customerName) {
    lines.splice(lines.length - 1, 0, `Nombre: ${customerName}`, ``)
  }

  return lines.join('\n')
}

// Open WhatsApp for quick product inquiry
export function openWhatsAppQuickInquiry(
  productName: string,
  productSku: string,
  customerName?: string,
  storePhone?: string
): void {
  const phone = storePhone || WHATSAPP_NUMBERS.default
  const message = generateQuickMessage(productName, productSku, customerName)
  const url = buildWhatsAppUrl(phone, message)

  window.open(url, '_blank', 'noopener,noreferrer')
}

// Generate simple cart message (no customer data required)
// @deprecated Use generateAIOptimizedMessage instead
export function generateSimpleCartMessage(
  items: CartItem[],
  totals: CartTotals
): string {
  // Redirect to AI-optimized version
  return generateAIOptimizedMessage(items, totals)
}

/**
 * Generate AI-optimized WhatsApp message for cart checkout
 * Includes SKU, complete tire size, branch name, order number, and bot instruction tags
 */
export function generateAIOptimizedMessage(
  items: CartItem[],
  totals: CartTotals,
  branchName?: string,
  orderNumber?: string | null
): string {
  const lines = [
    `[BOT:COMPRA_WEB]`
  ]

  // Add order number if provided
  if (orderNumber) {
    lines.push(`📋 *Pedido: ${orderNumber}*`)
  }

  // Add branch if provided
  if (branchName) {
    lines.push(`Sucursal: ${branchName}`)
  }

  lines.push(
    ``,
    `*PEDIDO WEB*`,
    ``
  )

  // Add items with SKU and complete tire info
  items.forEach((item, index) => {
    const price = item.sale_price || item.price
    const tireSize = generateTireDescription(item)

    lines.push(
      `#${index + 1} | SKU: ${item.sku}`,
      `   ${item.brand} ${item.name}`,
      `   Medida: ${tireSize}`,
      `   Cantidad: ${item.quantity} | ${formatPrice(price)} c/u`,
      ``
    )
  })

  // Add total
  lines.push(
    `*TOTAL: ${formatPrice(totals.total)}*`
  )

  return lines.join('\n')
}

/**
 * Product data for single product WhatsApp message
 */
export interface SingleProductData {
  sku: string
  brand: string
  name: string
  price: number
  sale_price?: number | null
  width?: number | null
  aspect_ratio?: number | null
  rim_diameter?: number | null
}

/**
 * Generate AI-optimized WhatsApp message for single product purchase
 * Used by "Comprar por WhatsApp" button on product detail page
 */
export function generateSingleProductMessage(
  product: SingleProductData,
  quantity: number,
  branchName?: string
): string {
  const price = product.sale_price || product.price
  const tireSize = (product.width && product.aspect_ratio && product.rim_diameter)
    ? `${product.width}/${product.aspect_ratio}R${product.rim_diameter}`
    : product.sku
  const total = price * quantity

  const lines = [
    `[BOT:COMPRA_WEB]`
  ]

  // Add branch if provided
  if (branchName) {
    lines.push(`Sucursal: ${branchName}`)
  }

  lines.push(
    ``,
    `*PEDIDO WEB*`,
    ``,
    `#1 | SKU: ${product.sku}`,
    `   ${product.brand} ${product.name}`,
    `   Medida: ${tireSize}`,
    `   Cantidad: ${quantity} | ${formatPrice(price)} c/u`,
    ``,
    `*TOTAL: ${formatPrice(total)}*`
  )

  return lines.join('\n')
}