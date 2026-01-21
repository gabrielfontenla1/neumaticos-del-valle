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

// Generate simple message for quick inquiries
export function generateQuickMessage(
  productName: string,
  productSku: string,
  customerName?: string
): string {
  const lines = [
    `Hola! Me interesa el siguiente producto:`,
    ``,
    `🛞 ${productName}`,
    `SKU: ${productSku}`,
    ``,
    `Quisiera saber:`,
    `- Precio`,
    `- Disponibilidad`,
    `- Opciones de instalación`,
  ]

  if (customerName) {
    lines.push(``, `Saludos,`, customerName)
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
export function generateSimpleCartMessage(
  items: CartItem[],
  totals: CartTotals
): string {
  const lines = [
    `🛞 *PEDIDO NEUMÁTICOS DEL VALLE*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📦 *PRODUCTOS:*`,
    ``
  ]

  // Add items
  items.forEach((item, index) => {
    const tire = generateTireDescription(item)
    const price = item.sale_price || item.price
    lines.push(
      `${index + 1}. *${item.brand} ${item.name}*`,
      `   ${tire}`,
      `   Cantidad: ${item.quantity}`,
      `   ${formatPrice(price)} c/u`,
      ``
    )
  })

  // Add totals
  lines.push(
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 *TOTAL: ${formatPrice(totals.total)}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Hola! Me gustaría cotizar estos productos.`,
    `¿Tienen disponibilidad?`
  )

  return lines.join('\n')
}