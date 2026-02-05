'use client'

import Script from 'next/script'

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

/**
 * Google Ads Tracking Component
 *
 * Instala la etiqueta de Google Ads (gtag.js) para:
 * - Remarketing
 * - Seguimiento de conversiones
 *
 * Configurar ID en NEXT_PUBLIC_GOOGLE_ADS_ID
 */
export function GoogleAds() {
  // No renderizar si no hay ID configurado
  if (!GOOGLE_ADS_ID) {
    return null
  }

  return (
    <>
      {/* Google Ads gtag.js */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  )
}

/**
 * Función para trackear conversiones de Google Ads
 * Llamar cuando ocurra una conversión (compra, contacto, etc.)
 *
 * @example
 * // Trackear compra completada
 * trackGoogleAdsConversion('AW-17931829764/CONVERSION_LABEL', 15000, 'ARS')
 *
 * // Trackear contacto por WhatsApp
 * trackGoogleAdsConversion('AW-17931829764/WHATSAPP_LABEL')
 */
export function trackGoogleAdsConversion(
  conversionId: string,
  value?: number,
  currency: string = 'ARS'
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      ...(value && { value, currency }),
    })
  }
}

/**
 * Función para trackear eventos personalizados
 *
 * @example
 * trackGoogleAdsEvent('add_to_cart', { value: 5000, currency: 'ARS' })
 */
export function trackGoogleAdsEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}

// Extender el tipo Window para TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'js',
      targetId: string | Date,
      params?: Record<string, unknown>
    ) => void
    dataLayer: unknown[]
  }
}
