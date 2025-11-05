'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Calendar,
  ShoppingBag,
  Star,
  MapPin,
  Phone,
  Award,
  Wrench,
  Clock,
  Shield,
  Zap,
  ChevronRight,
  CheckCircle2,
  MessageCircle,
  Mail,
  MapPinned,
  TrendingUp,
  Users,
  Package,
  AlignVerticalJustifyCenter,
  CircleDot,
  RotateCw,
  Wind,
  Settings2,
  LifeBuoy
} from 'lucide-react'

export function HomePage() {
  // Animation variants - subtle and smooth
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header/Navigation - Clean and minimal */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#FFC700] rounded-lg flex items-center justify-center">
                <Zap className="w-7 h-7 text-black" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Neumáticos del Valle
                </h1>
                <p className="text-xs text-gray-400 font-medium">Distribuidor Oficial Pirelli</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/productos" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">
                Productos
              </Link>
              <Link href="/turnos" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">
                Turnos
              </Link>
              <Link href="/admin/login" className="text-gray-300 hover:text-white transition-colors font-medium text-sm">
                Ingresar
              </Link>
              <a
                href="https://wa.me/5493855870760"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FFC700] hover:bg-[#FFD633] text-black px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
                Contactar
              </a>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Bold and minimal */}
      <section className="pt-24 pb-32 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-8 bg-[#FFC700]/20 text-[#FFC700] px-6 py-2 rounded-full text-sm font-semibold tracking-wide border border-[#FFC700]/30"
            >
              DISTRIBUIDOR OFICIAL PIRELLI
            </motion.span>

            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-8 leading-tight tracking-tight">
              Neumáticos premium
              <br />
              para tu vehículo
            </h2>

            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed font-normal">
              Más de 40 años garantizando tu seguridad en la ruta con productos Pirelli de primera calidad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/productos"
                className="bg-[#FFC700] hover:bg-[#FFD633] text-black px-8 py-4 rounded-lg font-bold text-base transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
              >
                Ver catálogo
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </Link>

              <Link
                href="/turnos"
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-base border-2 border-gray-700 hover:border-gray-500 transition-all flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" strokeWidth={2.5} />
                Reservar turno
              </Link>
            </div>
          </motion.div>

          {/* Stats - Clean and minimal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-24 max-w-5xl mx-auto"
          >
            {[
              { number: "40+", label: "Años", icon: Award },
              { number: "100K+", label: "Clientes", icon: Users },
              { number: "6", label: "Sucursales", icon: MapPin },
              { number: "100%", label: "Originales", icon: Shield }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <stat.icon className="w-8 h-8 text-[#FFC700] mx-auto mb-3" strokeWidth={2} />
                <div className="text-4xl md:text-5xl font-black text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section - Clean grid */}
      <section className="py-24 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
              Por qué elegirnos
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Calidad, experiencia y servicio profesional
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: Award,
                title: "Distribuidor Oficial",
                description: "Distribuidores autorizados de Pirelli en el NOA"
              },
              {
                icon: MapPin,
                title: "6 Sucursales",
                description: "Ubicadas estratégicamente para tu comodidad"
              },
              {
                icon: Wrench,
                title: "Servicio Profesional",
                description: "Técnicos certificados con equipamiento de última generación"
              },
              {
                icon: Clock,
                title: "Atención Rápida",
                description: "Servicio ágil y eficiente sin demoras innecesarias"
              }
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                variants={scaleIn}
                className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-[#FFC700] transition-all hover:shadow-lg group"
              >
                <div className="w-14 h-14 bg-[#FFC700] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-7 h-7 text-black" strokeWidth={2.5} />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">
                  {benefit.title}
                </h4>
                <p className="text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section - Card-based layout */}
      <section className="py-24 px-4 bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
              Nuestros servicios
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Atención integral para tu vehículo
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          >
            {[
              { name: 'Alineado', icon: AlignVerticalJustifyCenter, delay: 0 },
              { name: 'Balanceo', icon: CircleDot, delay: 0.1 },
              { name: 'Rotación', icon: RotateCw, delay: 0.2 },
              { name: 'Inflado con Nitrógeno', icon: Wind, delay: 0.3 },
              { name: 'Tren Delantero', icon: Settings2, delay: 0.4 },
              { name: 'Reparación de Llantas', icon: LifeBuoy, delay: 0.5 }
            ].map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.5,
                    delay: service.delay,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
                whileHover={{
                  scale: 1.05,
                  y: -8,
                  transition: {
                    duration: 0.2,
                    ease: "easeOut"
                  }
                }}
                whileTap={{ scale: 0.98 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-gray-900 rounded-xl p-6 border-2 border-gray-700 hover:border-[#FFC700] transition-all hover:shadow-xl cursor-pointer group relative overflow-hidden"
              >
                {/* Animated background gradient on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#FFC700]/0 to-[#FFC700]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />

                {/* Icon with rotation animation */}
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <service.icon className="w-8 h-8 mb-3 text-white group-hover:text-[#FFC700] transition-colors duration-300" strokeWidth={2} />
                </motion.div>

                {/* Service name with fade effect */}
                <motion.p
                  className="font-bold text-base text-white relative z-10"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {service.name}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link
              href="/turnos"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#FFC700] hover:bg-[#FFD633] text-black font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <Calendar className="w-5 h-5" strokeWidth={2.5} />
              Reservar un servicio
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Products Preview Section - Modern cards */}
      <section className="py-24 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-black text-white mb-4">
              Catálogo de productos
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Neumáticos Pirelli para todo tipo de vehículo
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 mb-12"
          >
            {[
              {
                category: "Autos",
                description: "Alta performance y seguridad",
                icon: ShoppingBag
              },
              {
                category: "Camionetas",
                description: "Resistencia para todo terreno",
                icon: Package
              },
              {
                category: "Camiones",
                description: "Máxima capacidad de carga",
                icon: TrendingUp
              }
            ].map((category, idx) => (
              <motion.div
                key={idx}
                variants={scaleIn}
                className="bg-gray-800 rounded-2xl p-10 border border-gray-700 hover:border-[#FFC700] transition-all hover:shadow-lg group"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FFC700] transition-colors">
                  <category.icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <h4 className="text-2xl font-bold text-white mb-3">
                  {category.category}
                </h4>
                <p className="text-gray-300 mb-6">
                  {category.description}
                </p>
                <Link
                  href="/productos"
                  className="text-white hover:text-[#FFC700] font-bold flex items-center gap-2 group-hover:gap-3 transition-all"
                >
                  Ver productos
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link
              href="/productos"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-lg border-2 border-gray-700 hover:border-[#FFC700] transition-all"
            >
              Ver catálogo completo
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Strong conversion focus */}
      <section className="py-24 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#FFC700] rounded-3xl p-12 md:p-16 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                  Reservá tu turno online
                </h3>
                <p className="text-lg mb-8 text-white/80 font-medium">
                  Evitá esperas innecesarias y asegurá tu horario preferido
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    "Elegí fecha y hora",
                    "Confirmación instantánea",
                    "Sin esperas en sucursal",
                    "Recordatorios automáticos"
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-[#FFC700]" strokeWidth={3} />
                      </div>
                      <span className="font-semibold">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/turnos"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-black hover:bg-[#333333] text-[#FFC700] font-bold rounded-lg transition-all shadow-lg"
                >
                  <Calendar className="w-5 h-5" strokeWidth={2.5} />
                  Agendar ahora
                </Link>
              </div>

              <div className="hidden md:block">
                <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-8 border border-black/10">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="font-bold text-lg mb-1">Horarios flexibles</div>
                        <div className="text-sm text-white/70">Lun-Vie: 8:00 - 18:00</div>
                        <div className="text-sm text-white/70">Sáb: 8:00 - 13:00</div>
                      </div>
                    </div>
                    <div className="h-px bg-black/10" />
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-black/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="font-bold text-lg mb-1">6 Sucursales</div>
                        <div className="text-sm text-white/70">En todo el NOA</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Organized and minimal */}
      <footer className="bg-gray-800 border-t border-gray-700 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-[#FFC700] rounded-lg flex items-center justify-center">
                  <Zap className="w-7 h-7 text-black" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Neumáticos del Valle</h4>
                  <p className="text-xs text-gray-300 font-medium">Distribuidor Oficial Pirelli</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Más de 40 años garantizando tu seguridad en la ruta
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="font-bold text-white mb-4 text-base">Enlaces</h5>
              <ul className="space-y-3">
                <li>
                  <Link href="/productos" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link href="/turnos" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                    Turnos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sucursales */}
            <div>
              <h5 className="font-bold text-white mb-4 text-base">Sucursales</h5>
              <ul className="space-y-3 text-gray-300 text-sm">
                {['Catamarca', 'La Banda', 'San Fernando del Valle', 'Salta', 'Santiago del Estero', 'Tucumán'].map((location, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <MapPinned className="w-4 h-4 text-[#FFC700] flex-shrink-0" strokeWidth={2} />
                    <span>{location}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h5 className="font-bold text-white mb-4 text-base">Contacto</h5>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://wa.me/5493855870760"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2 font-medium"
                  >
                    <MessageCircle className="w-4 h-4 text-[#FFC700]" strokeWidth={2} />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+5493855870760"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2 font-medium"
                  >
                    <Phone className="w-4 h-4 text-[#FFC700]" strokeWidth={2} />
                    (299) 504-4430
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@neumaticosdevalle.com"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2 font-medium"
                  >
                    <Mail className="w-4 h-4 text-[#FFC700]" strokeWidth={2} />
                    info@neumaticosdevalle.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-300 text-sm text-center md:text-left">
                2024 Neumáticos del Valle. Todos los derechos reservados
              </p>
              <div className="flex gap-6 text-sm">
                <Link href="/admin/appointments" className="text-gray-300 hover:text-white transition-colors font-medium">
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
