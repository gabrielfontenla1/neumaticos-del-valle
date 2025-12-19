'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: '¿Cómo sé que los neumáticos son originales?',
    answer: 'Cada neumático Pirelli incluye un código único de verificación que puedes validar en el sitio oficial de Pirelli. Además, somos distribuidores oficiales certificados desde 1984, lo que garantiza que todos nuestros productos vienen directamente de fábrica con sus certificados de autenticidad.'
  },
  {
    question: '¿Cuánto tiempo tarda el servicio completo?',
    answer: 'El servicio completo (diagnóstico, instalación de 4 neumáticos, alineación y balanceo) toma aproximadamente 60-90 minutos. Si solo necesitas cambio de neumáticos, el servicio express toma menos de 30 minutos. Te recomendamos reservar turno para evitar esperas.'
  },
  {
    question: '¿Qué garantía tienen los neumáticos?',
    answer: 'Todos los neumáticos Pirelli incluyen la garantía oficial del fabricante que cubre defectos de fábrica. Además, ofrecemos garantía de instalación de 6 meses. La duración específica depende del modelo, pero la mayoría de nuestros neumáticos tienen garantía de 5 años contra defectos de manufactura.'
  },
  {
    question: '¿Puedo pagar en cuotas?',
    answer: 'Sí, aceptamos todas las tarjetas de crédito con planes de cuotas sin interés. También trabajamos con financiación propia para casos especiales. Consultá las opciones disponibles al momento de tu visita o contactanos por WhatsApp.'
  },
  {
    question: '¿Qué incluye el diagnóstico digital?',
    answer: 'El diagnóstico digital incluye: medición de profundidad de dibujo, revisión de desgaste irregular, análisis de presión, inspección de daños laterales, verificación de válvulas, y análisis de alineación con equipamiento 3D. Recibes un reporte completo con fotos y recomendaciones.'
  },
  {
    question: '¿Tienen stock de todos los modelos?',
    answer: 'Mantenemos stock permanente de los modelos más populares en nuestras 6 sucursales. Para medidas especiales o modelos específicos, podemos conseguirlos en 24-48 horas desde el depósito central de Pirelli. Te recomendamos consultarnos antes de tu visita.'
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Preguntas Frecuentes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            Respuestas claras a las dudas más comunes
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-gray-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-8 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center p-8 bg-white rounded-2xl border border-gray-200"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            ¿No encontraste tu respuesta?
          </h3>
          <p className="text-gray-600 mb-6">
            Nuestro equipo está listo para ayudarte
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5493855946462"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Contactar por WhatsApp
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/turnos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FEE004] text-black rounded-lg font-semibold hover:bg-[#FEE004]/90 transition-colors"
            >
              Reservar Turno
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
