import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Lora, IBM_Plex_Mono } from 'next/font/google';
import "./globals.css";
import { CartProvider } from '@/providers/CartProvider';
import { ConditionalLayout } from '@/components/ConditionalNav';
import { ThemeManager } from '@/components/ThemeManager';
import { SessionProvider } from '@/features/auth/components/SessionProvider';
import { WhatsAppBubble } from '@/components/WhatsAppBubble';

const plusJakartaSans = Plus_Jakarta_Sans({
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

export const metadata: Metadata = {
  title: "Neumáticos del Valle - Distribuidor Oficial Chile",
  description: "Obtén tu cotización personalizada de neumáticos en 2 minutos. Distribuidor oficial en Chile con instalación profesional y envío a domicilio.",
  keywords: "Pirelli, Michelin, Bridgestone, neumáticos, cotización, Chile",
  authors: [{ name: "Neumáticos del Valle" }],
  creator: "Neumáticos del Valle",
  publisher: "Neumáticos del Valle",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
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
      </head>
      <body
        className={`${plusJakartaSans.variable} ${lora.variable} ${ibmPlexMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeManager />
        <SessionProvider>
          <CartProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <WhatsAppBubble />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
