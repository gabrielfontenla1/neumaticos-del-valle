import type { Metadata, Viewport } from "next";
import { Inter, Lora, IBM_Plex_Mono, Montserrat } from 'next/font/google';
import "./globals.css";
import { CartProvider } from '@/providers/CartProvider';
import { NotificationProvider } from '@/components/notifications/CartNotifications';
import { ConditionalLayout } from '@/components/layout/ConditionalNav';
import { ThemeManager } from '@/components/layout/ThemeManager';
import { SessionProvider } from '@/features/auth/components/SessionProvider';
import { WhatsAppBubble } from '@/components/marketing/WhatsAppBubble';
import { Toaster } from '@/components/ui/sonner';
import { ToastProvider } from '@/providers/ToastProvider';
import { GoogleAds } from '@/components/analytics';

// Inter is very similar to Proxima Nova (Mercado Libre's font)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800']
});

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700']
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700']
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "Neumáticos del Valle - Distribuidor Oficial NOA Argentino",
  description: "Obtén tu cotización personalizada de neumáticos en 2 minutos. Distribuidor oficial en el NOA Argentino con instalación profesional y envío a domicilio.",
  keywords: "Pirelli, Michelin, Bridgestone, neumáticos, cotización, NOA, Argentina, Salta, Tucumán, Santiago del Estero, Catamarca",
  authors: [{ name: "Neumáticos del Valle" }],
  creator: "Neumáticos del Valle",
  publisher: "Neumáticos del Valle",
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#FFC700" />
        <GoogleAds />
      </head>
      <body
        className={`${inter.variable} ${lora.variable} ${ibmPlexMono.variable} ${montserrat.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeManager />
        <SessionProvider>
          <NotificationProvider>
            <CartProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              <WhatsAppBubble />
              <Toaster />
              <ToastProvider />
            </CartProvider>
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
