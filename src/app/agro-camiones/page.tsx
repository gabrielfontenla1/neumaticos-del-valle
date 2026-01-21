import { Navbar } from '@/components/layout/Navbar'

export const metadata = {
  title: 'Agro y Camiones | Neumáticos del Valle',
  description: 'Neumáticos para agro y camiones. Amplio catálogo de marcas y medidas para vehículos pesados.'
}

export default function AgroCamionesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            {/* Construction Icon */}
            <div className="mb-8">
              <svg
                className="w-24 h-24 mx-auto text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Estamos Trabajando en Esta Sección
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8">
              Muy pronto tendrás disponible nuestro catálogo completo de neumáticos para agro y camiones.
            </p>

            {/* Decorative divider */}
            <div className="w-24 h-1 bg-orange-500 mx-auto mb-8 rounded-full"></div>

            {/* Additional info */}
            <p className="text-gray-500">
              Mientras tanto, puedes contactarnos directamente para consultas sobre neumáticos de estos rubros.
            </p>

            {/* Back button */}
            <div className="mt-12">
              <a
                href="/"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
              >
                Volver al Inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
