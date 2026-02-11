import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Neumáticos del Valle',
  description:
    'Términos y condiciones de uso del sitio web y servicios de Neumáticos del Valle SRL.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://neumaticosdelvallesrl.com/terminos',
  },
}

export default function TerminosLayout({ children }: { children: React.ReactNode }) {
  return children
}
