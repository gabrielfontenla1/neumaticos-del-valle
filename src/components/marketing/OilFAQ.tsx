'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: '¿Cada cuánto debo cambiar el aceite?',
    answer: 'El intervalo de cambio depende del tipo de aceite y el uso del vehículo. Para aceites sintéticos premium como Shell Helix Ultra, el cambio se recomienda cada 10.000-15.000 km o 12 meses. Para aceites minerales, el intervalo es de 5.000-7.000 km o 6 meses. Siempre consultá el manual de tu vehículo para la recomendación específica.',
  },
  {
    question: '¿Cuál es la diferencia entre sintético y mineral?',
    answer: 'Los aceites sintéticos se fabrican mediante procesos químicos avanzados, ofreciendo mejor protección, mayor durabilidad y mejor rendimiento en temperaturas extremas. Los aceites minerales se derivan directamente del petróleo refinado y son más económicos, adecuados para motores más antiguos o uso moderado. Los semi-sintéticos combinan lo mejor de ambos mundos.',
  },
  {
    question: '¿Qué significa la viscosidad 5W-30?',
    answer: 'La viscosidad tiene dos números: el primero (5W) indica el comportamiento en frío ("W" viene de Winter/Invierno) - cuanto menor, mejor fluye al arrancar. El segundo número (30) indica la viscosidad a temperatura de operación - cuanto mayor, más espeso. Un 5W-30 fluye bien en frío y mantiene buena protección en caliente. Es ideal para climas templados y motores modernos.',
  },
  {
    question: '¿Puedo mezclar aceites de diferente viscosidad?',
    answer: 'No es recomendable mezclar aceites de diferente viscosidad o tipo (sintético con mineral). Si necesitás agregar aceite de emergencia, usá el mismo tipo y viscosidad. Mezclar puede afectar las propiedades protectoras del aceite. Ante una emergencia, es preferible completar con el mismo tipo aunque sea de otra marca, y luego hacer un cambio completo.',
  },
  {
    question: '¿Qué aceite es mejor para mi auto con alto kilometraje?',
    answer: 'Para vehículos con más de 100.000 km, recomendamos aceites con formulación "High Mileage" o viscosidades un poco más altas como 10W-40 o 15W-40 que ofrecen mejor sellado de juntas. Shell Helix HX7 10W-40 es excelente para estos casos. Los aceites más espesos ayudan a compensar el desgaste natural del motor y reducir el consumo de aceite.',
  },
]

export function OilFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FEE004]/20 rounded-full flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-[#FEE004]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Preguntas Frecuentes</h3>
            <p className="text-sm text-gray-500">Todo lo que necesitás saber sobre aceites</p>
          </div>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="divide-y divide-gray-100">
        {faqItems.map((item, index) => (
          <div key={index} className="overflow-hidden">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-base font-semibold text-gray-900 pr-4">
                {item.question}
              </span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
