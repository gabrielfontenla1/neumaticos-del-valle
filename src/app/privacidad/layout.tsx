import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad | Neumáticos del Valle',
  description:
    'Conocé cómo recopilamos, usamos y protegemos tu información personal en Neumáticos del Valle SRL.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://neumaticosdelvallesrl.com/privacidad',
  },
}

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return children
}
