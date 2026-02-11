'use client'

import { useState, useMemo } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { OilWizard } from '@/components/marketing/OilWizard'
import { OilProductCard } from '@/components/marketing/OilProductCard'
import { OilFilters } from '@/components/marketing/OilFilters'
import { OilCompareModal } from '@/components/marketing/OilCompareModal'
import { OilFAQ } from '@/components/marketing/OilFAQ'
import { shellHelixOils } from '@/data/shellHelixOils'
import { Button } from '@/components/ui/button'
import { MessageCircle, Droplet, Scale } from 'lucide-react'

export default function AceitesPage() {
  // Estado para filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedViscosity, setSelectedViscosity] = useState<string>('all')

  // Estado para comparador
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [isCompareOpen, setIsCompareOpen] = useState(false)

  // Filtrar productos
  const filteredOils = useMemo(() => {
    return shellHelixOils.filter(oil => {
      if (selectedCategory !== 'all' && oil.category !== selectedCategory) return false
      if (selectedViscosity !== 'all' && oil.viscosity !== selectedViscosity) return false
      return true
    })
  }, [selectedCategory, selectedViscosity])

  // Productos seleccionados para comparar
  const selectedOils = useMemo(() => {
    return shellHelixOils.filter(oil => compareIds.includes(oil.id))
  }, [compareIds])

  // Toggle comparar
  const handleToggleCompare = (oilId: string) => {
    setCompareIds(prev => {
      if (prev.includes(oilId)) return prev.filter(id => id !== oilId)
      if (prev.length >= 3) return prev // máximo 3
      return [...prev, oilId]
    })
  }

  // Scroll a producto desde wizard
  const handleRecommendation = (oilId: string) => {
    // Limpiar filtros para mostrar el producto
    setSelectedCategory('all')
    setSelectedViscosity('all')
    // Scroll al grid
    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  // WhatsApp consulta general
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493855854741'
  const handleWhatsAppConsult = () => {
    const message = 'Hola! Quiero consultar por aceites Shell Helix'
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F7F7F7]">
        {/* Hero Compacto */}
        <section className="relative bg-black py-12 md:py-16">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-[#FEE004] px-4 py-2 rounded-full mb-4">
                <Droplet className="w-5 h-5 text-black" />
                <span className="text-black font-semibold">Distribuidor Oficial</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Shell Helix
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6">
                Aceites premium para el máximo rendimiento y protección de tu motor
              </p>
              <Button
                onClick={handleWhatsAppConsult}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 h-auto"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Consultar por WhatsApp
              </Button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 md:space-y-12">
          {/* Asistente Wizard */}
          <section>
            <OilWizard onRecommendation={handleRecommendation} />
          </section>

          {/* Filtros */}
          <section>
            <OilFilters
              selectedCategory={selectedCategory}
              selectedViscosity={selectedViscosity}
              onCategoryChange={setSelectedCategory}
              onViscosityChange={setSelectedViscosity}
            />
          </section>

          {/* Grid de Productos */}
          <section id="products-grid">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Nuestros Aceites
                {filteredOils.length !== shellHelixOils.length && (
                  <span className="text-base font-normal text-gray-500 ml-2">
                    ({filteredOils.length} productos)
                  </span>
                )}
              </h2>
              {compareIds.length > 0 && (
                <span className="text-sm text-gray-500">
                  {compareIds.length}/3 seleccionados para comparar
                </span>
              )}
            </div>

            {filteredOils.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay productos con los filtros seleccionados</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedViscosity('all')
                  }}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOils.map(oil => (
                  <OilProductCard
                    key={oil.id}
                    oil={oil}
                    isSelected={compareIds.includes(oil.id)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}
              </div>
            )}
          </section>

          {/* FAQ */}
          <section>
            <OilFAQ />
          </section>

          {/* CTA Final */}
          <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              ¿Necesitás ayuda para elegir?
            </h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Nuestros especialistas pueden asesorarte sobre el aceite ideal para tu vehículo
            </p>
            <Button
              onClick={handleWhatsAppConsult}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 h-auto"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contactar ahora
            </Button>
          </section>
        </div>

        {/* Sticky Compare Bar */}
        {compareIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 z-50 shadow-2xl">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-[#FEE004]" />
                <span className="font-semibold">
                  {compareIds.length} {compareIds.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                </span>
                <button
                  onClick={() => setCompareIds([])}
                  className="text-sm text-gray-400 hover:text-white underline ml-2"
                >
                  Limpiar
                </button>
              </div>
              <Button
                onClick={() => setIsCompareOpen(true)}
                className="bg-[#FEE004] text-black hover:bg-[#FDD000] font-semibold"
              >
                Ver comparación
              </Button>
            </div>
          </div>
        )}

        {/* Compare Modal */}
        <OilCompareModal
          oils={selectedOils}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
        />
      </main>
    </>
  )
}
