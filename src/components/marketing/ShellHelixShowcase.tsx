'use client'

import { motion } from 'framer-motion'
import { Droplet, Shield, Zap, Award, CheckCircle2, ArrowRight, MessageCircle } from 'lucide-react'
import { shellHelixOils, seriesInfo, oilsByCategory } from '@/data/shellHelixOils'
import Link from 'next/link'

export function ShellHelixShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-red-600 via-red-700 to-yellow-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=1920&h=1080&fit=crop')] bg-cover bg-center" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6"
            >
              <Droplet className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">
                Distribuidor Oficial Shell
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6"
            >
              Shell Helix
              <br />
              <span className="text-yellow-300">Aceites Premium</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/90 max-w-2xl mx-auto mb-8"
            >
              La tecnología PurePlus que protege los motores más exigentes del mundo
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <a
                href="https://wa.me/5493855946462?text=Hola!%20Quiero%20consultar%20por%20aceites%20Shell%20Helix"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all hover:scale-105 shadow-xl inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Consultar Precios
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {[
              { icon: Shield, text: 'Protección avanzada' },
              { icon: Zap, text: 'Máximo rendimiento' },
              { icon: Award, text: 'Tecnología PurePlus' },
              { icon: Droplet, text: 'Limpieza superior' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20"
              >
                <item.icon className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                <span className="text-white text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Series Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
            >
              Nuestra Línea Completa
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600"
            >
              Desde lo más premium hasta soluciones económicas
            </motion.p>
          </div>

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {Object.entries(oilsByCategory).map(([category, oils], index) => {
              const seriesKey = oils[0]?.series
              const info = seriesInfo[seriesKey]

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className={`relative h-64 rounded-2xl bg-gradient-to-br ${info?.color} p-6 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTMwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNNiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-4">
                        <Droplet className="w-12 h-12 text-white mb-3" />
                        <h3 className="text-2xl font-bold text-white mb-2">{info?.name}</h3>
                        <p className="text-white/90 text-sm font-medium">{info?.tagline}</p>
                      </div>

                      <div className="mt-auto">
                        <p className="text-white/80 text-sm mb-3">{info?.description}</p>
                        <div className="flex items-center gap-2 text-white text-sm font-semibold">
                          <span>{oils.length} productos</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* All Products List */}
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Todos los Productos</h3>

            {shellHelixOils.map((oil, index) => (
              <motion.div
                key={oil.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                  <div className="p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left - Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Droplet className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-1">{oil.name}</h4>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                                {oil.viscosity}
                              </span>
                              <span className="px-3 py-1 bg-blue-100 rounded-full text-sm font-semibold text-blue-700">
                                {oil.category}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {oil.specifications.join(' • ')}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="grid md:grid-cols-2 gap-3 mb-4">
                          {oil.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Applications */}
                        <div className="flex flex-wrap gap-2">
                          {oil.applications.map((app, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium"
                            >
                              {app}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right - CTA */}
                      <div className="lg:w-64 flex flex-col justify-center gap-3">
                        <div className="text-center lg:text-right mb-2">
                          <p className="text-sm text-gray-600 mb-1">Disponible en:</p>
                          <div className="flex flex-wrap justify-center lg:justify-end gap-2">
                            {oil.sizes.map((size, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>

                        <a
                          href={`https://wa.me/5493855946462?text=Hola!%20Quiero%20consultar%20por%20${encodeURIComponent(oil.name)}%20${oil.viscosity}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Consultar
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-red-600 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              ¿Necesitás asesoramiento?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Nuestros expertos te ayudan a elegir el aceite ideal para tu vehículo
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/5493855946462"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-8 py-4 bg-white text-red-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2 shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                Contactar por WhatsApp
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/"
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2"
              >
                Volver al Inicio
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
