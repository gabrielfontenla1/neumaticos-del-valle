import { CartItem, CustomerData, VoucherData } from '@/features/cart/types'

// WhatsApp numbers for each store
export const WHATSAPP_NUMBERS = {
  main: '56912345678', // Replace with real number
  santiago: '56987654321', // Replace with real number
  default: '56912345678' // Default number
}

// Detect if user is on mobile
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent || navigator.vendor
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
}

// Format price in Chilean pesos
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
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
export function generateWhatsAppMessage(voucher: VoucherData): string {
  const lines = [
    `🚗 *SOLICITUD DE PRESUPUESTO*`,
    `📋 Código: *${voucher.code}*`,
    ``,
    `👤 *DATOS DEL CLIENTE*`,
    `Nombre: ${voucher.customer_name}`,
    `Teléfono: ${voucher.customer_phone}`,
    `Email: ${voucher.customer_email}`,
    ``,
    `🛞 *PRODUCTOS SOLICITADOS*`,
  ]

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
    `_Este presupuesto es válido hasta el ${new Date(voucher.valid_until).toLocaleDateString('es-CL')}_`,
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

  // Ensure it starts with country code
  const finalPhone = cleanPhone.startsWith('56') ? cleanPhone : `56${cleanPhone}`

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
export function openWhatsApp(voucher: VoucherData, storePhone?: string): void {
  const phone = storePhone || WHATSAPP_NUMBERS.default
  const message = generateWhatsAppMessage(voucher)
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