import { Navbar } from '@/components/layout/Navbar'
import AgroCamionesClient from './AgroCamionesClient'

// Force dynamic rendering for pages using useSearchParams
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Agro y Camiones | Neumáticos del Valle',
  description: 'Neumáticos para agro y camiones. Amplio catálogo de marcas y medidas para vehículos pesados.'
}

export default function AgroCamionesPage() {
  return (
    <div>
      <Navbar />
      <AgroCamionesClient products={[]} stats={null} />
    </div>
  )
}
