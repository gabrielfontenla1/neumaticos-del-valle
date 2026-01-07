/**
 * WhatsApp Stock Response Templates
 * Spanish-language responses for stock queries with branch awareness
 */

import type { ProductWithStock } from '../services/stock-service'
import type { EquivalentWithStock } from '../services/equivalence-service'
import type { BranchStock } from '../services/stock-service'
import { getBranchDisplayName } from '../services/location-service'
import { formatEquivalenceLevel, getEquivalenceEmoji } from '../services/equivalence-service'

/**
 * Format price in Argentine Pesos
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Ask user for their location
 */
export function askLocation(): string {
  return `Para darte info de stock exacta, ¿desde qué ciudad nos escribís? 📍`
}

/**
 * Location not recognized
 */
export function locationNotRecognized(): string {
  return `No reconocí esa ciudad. ¿Podés decirme de qué ciudad o provincia sos?

Tenemos sucursales en:
• Santiago del Estero
• La Banda
• Tucumán
• Salta
• Catamarca`
}

/**
 * Confirm branch selection
 */
export function confirmBranch(branchCode: string): string {
  const branchName = getBranchDisplayName(branchCode)
  return `Perfecto, te muestro disponibilidad en nuestra sucursal de *${branchName}*.`
}

/**
 * Format product list for WhatsApp
 */
function formatProductList(products: ProductWithStock[], showStock: boolean = false): string {
  return products.slice(0, 5).map(p => {
    const stockInfo = showStock && p.branch_stock > 0 ? ` (${p.branch_stock} unid.)` : ''
    return `• *${p.brand}* ${p.model || ''} ${p.size_display} - ${formatPrice(p.price)}${stockInfo}`
  }).join('\n')
}

/**
 * Products available (4+ units)
 */
export function availableProducts(
  products: ProductWithStock[],
  branchCode: string,
  sizeDisplay: string
): string {
  const branchName = getBranchDisplayName(branchCode)
  const productList = formatProductList(products)

  let response = `En *${branchName}* tenemos disponibles para ${sizeDisplay}:\n\n${productList}`

  if (products.length > 5) {
    response += `\n\n_...y ${products.length - 5} opciones más_`
  }

  response += `\n\n¿Te interesa alguno? Escribime el que quieras y te doy más detalles.`

  return response
}

/**
 * Last units warning (2-3 units)
 */
export function lastUnitsProducts(
  products: ProductWithStock[],
  branchCode: string,
  sizeDisplay: string
): string {
  const branchName = getBranchDisplayName(branchCode)
  const productList = formatProductList(products, true)

  return `⚠️ *Últimas unidades* en ${branchName} para ${sizeDisplay}:

${productList}

_Stock limitado, consultá disponibilidad antes de venir._

¿Te interesa alguno?`
}

/**
 * Single unit warning with alternatives
 */
export function singleUnitWarning(
  product: ProductWithStock,
  branchCode: string,
  equivalents: EquivalentWithStock[],
  otherBranches: BranchStock[]
): string {
  const branchName = getBranchDisplayName(branchCode)

  let response = `⚠️ De *${product.brand}* ${product.model || ''} ${product.size_display} solo hay *1 unidad* en ${branchName}.

_Los neumáticos van en pares, con 1 solo no alcanza._`

  // Add equivalents if available
  if (equivalents.length > 0) {
    response += `\n\n*Alternativas equivalentes:*\n`
    response += equivalents.slice(0, 3).map(eq => {
      const emoji = getEquivalenceEmoji(eq.equivalence_level)
      return `${emoji} *${eq.brand}* ${eq.size_display} - ${formatPrice(eq.price)} (${eq.branch_stock} unid.)`
    }).join('\n')
  }

  // Add other branches if available
  if (otherBranches.length > 0) {
    const branchList = otherBranches.slice(0, 3).map(b =>
      `• ${getBranchDisplayName(b.branch_code)} (${b.total_quantity} unid.)`
    ).join('\n')
    response += `\n\n*Disponible en otras sucursales:*\n${branchList}`
    response += `\n\n_Podemos hacer envío entre sucursales._`
  }

  response += `\n\n¿Qué preferís?`

  return response
}

/**
 * No stock with equivalents available
 */
export function noStockWithEquivalents(
  sizeDisplay: string,
  branchCode: string,
  equivalents: EquivalentWithStock[]
): string {
  const branchName = getBranchDisplayName(branchCode)

  let response = `La medida *${sizeDisplay}* no la tenemos en stock en ${branchName}.

Pero tenemos *medidas equivalentes* que te sirven igual:\n`

  response += equivalents.slice(0, 5).map(eq => {
    const emoji = getEquivalenceEmoji(eq.equivalence_level)
    const levelText = formatEquivalenceLevel(eq.equivalence_level)
    const diffText = eq.diameter_diff_percent > 0 ? `+${eq.diameter_diff_percent}%` : `${eq.diameter_diff_percent}%`
    return `${emoji} *${eq.brand}* ${eq.size_display} - ${formatPrice(eq.price)}
   _${levelText} (${diffText} diámetro)_ - ${eq.branch_stock} unid.`
  }).join('\n\n')

  response += `\n\n_Las equivalencias tienen el mismo diámetro total, funcionan igual._

¿Te interesa alguna?`

  return response
}

/**
 * No stock locally but available in other branches
 */
export function availableInOtherBranch(
  sizeDisplay: string,
  branchCode: string,
  otherBranches: BranchStock[]
): string {
  const branchName = getBranchDisplayName(branchCode)

  const branchList = otherBranches.slice(0, 4).map(b =>
    `• *${getBranchDisplayName(b.branch_code)}* - ${b.total_quantity} unidades`
  ).join('\n')

  return `No tenemos *${sizeDisplay}* en ${branchName}, pero sí en otras sucursales:

${branchList}

Podemos hacer *envío entre sucursales* (demora 1-2 días hábiles).

¿Querés que te lo traigamos?`
}

/**
 * No stock anywhere
 */
export function noStockAnywhere(sizeDisplay: string): string {
  return `No tenemos la medida *${sizeDisplay}* en ninguna de nuestras sucursales.

¿Querés que te avise cuando llegue? Dejame tu número y te contactamos.`
}

/**
 * Confirm transfer request
 */
export function confirmTransfer(
  product: string,
  fromBranch: string,
  toBranch: string
): string {
  const fromName = getBranchDisplayName(fromBranch)
  const toName = getBranchDisplayName(toBranch)

  return `Perfecto, te confirmo el pedido de *${product}* desde ${fromName} a ${toName}.

Un asesor te va a contactar para coordinar el envío.

¿Hay algo más en lo que te pueda ayudar?`
}

/**
 * Generic error response
 */
export function errorResponse(): string {
  return `Hubo un problema buscando el stock. ¿Podés intentar de nuevo en unos minutos?

Si el problema persiste, escribí a un asesor.`
}

/**
 * Format search results summary
 */
export function searchResultsSummary(
  available: number,
  lastUnits: number,
  singleUnit: number,
  equivalents: number
): string {
  const parts: string[] = []

  if (available > 0) parts.push(`${available} disponibles`)
  if (lastUnits > 0) parts.push(`${lastUnits} últimas unidades`)
  if (singleUnit > 0) parts.push(`${singleUnit} con 1 sola unidad`)
  if (equivalents > 0) parts.push(`${equivalents} equivalentes`)

  return parts.join(', ')
}
