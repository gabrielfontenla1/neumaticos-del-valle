'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Calendar, Clock, Smartphone, CheckCircle, ChevronRight,
  MapPin, Wrench, Star, Zap, Shield, Phone, Share2,
  ChevronDown, Menu, X, ArrowRight, Users, TrendingUp
} from 'lucide-react'
import './styles.css'

export default function PromoTurnosPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const services = [
    { icon: '🔍', name: 'Revisión Gratuita', time: '30 min', price: 'GRATIS' },
    { icon: '🔄', name: 'Cambio de Neumáticos', time: '60 min', price: 'Incluye balanceo' },
    { icon: '⚙️', name: 'Alineación Computarizada', time: '45 min', price: 'Alta precisión' },
    { icon: '⚖️', name: 'Balanceo Dinámico', time: '30 min', price: 'Sin vibraciones' },
    { icon: '🔃', name: 'Rotación de Neumáticos', time: '30 min', price: 'Mayor durabilidad' },
    { icon: '💨', name: 'Inflado con Nitrógeno', time: '20 min', price: 'Mejor rendimiento' },
    { icon: '🚗', name: 'Tren Delantero', time: '60 min', price: 'Revisión completa' },
    { icon: '🔧', name: 'Reparación de Pinchazos', time: '40 min', price: 'Solución rápida' },
  ]

  const benefits = [
    { icon: <Clock className="w-8 h-8" />, title: '24/7', desc: 'Reservá cuando quieras' },
    { icon: <Smartphone className="w-8 h-8" />, title: 'Desde tu celular', desc: 'Sin llamadas' },
    { icon: <Zap className="w-8 h-8" />, title: '3 minutos', desc: 'Reserva ultra rápida' },
    { icon: <CheckCircle className="w-8 h-8" />, title: 'Confirmación', desc: 'Instantánea' },
    { icon: <MapPin className="w-8 h-8" />, title: 'Multi-sucursal', desc: 'Elegí tu preferida' },
    { icon: <Shield className="w-8 h-8" />, title: '100% Seguro', desc: 'Datos protegidos' },
  ]

  const steps = [
    { number: '1', title: 'Ingresá', desc: 'Al sistema online' },
    { number: '2', title: 'Elegí', desc: 'Sucursal y servicio' },
    { number: '3', title: 'Seleccioná', desc: 'Fecha y horario' },
    { number: '4', title: 'Confirmá', desc: '¡Y listo!' },
  ]

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '🚗 Sistema de Turnos Online - Neumáticos del Valle',
        text: '¡Reservá tu turno en 3 minutos! Sin llamadas, sin esperas. 100% online.',
        url: window.location.href,
      })
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent('¡Mirá esto! Ahora podés reservar tu turno en Neumáticos del Valle en solo 3 minutos 🚗')
    const url = encodeURIComponent(window.location.href)
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-50 lg:hidden pointer-events-none"
      >
        <Link
          href="/turnos"
          className="bg-[#D97757] text-white rounded-full p-4 shadow-2xl flex items-center justify-center hover:bg-[#c56645] transition-all hover:scale-110 pointer-events-auto"
        >
          <Calendar className="w-6 h-6" />
        </Link>
      </motion.div>

      {/* Share Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed top-6 right-6 z-50 pointer-events-none"
      >
        <button
          onClick={handleShare}
          className="bg-white/20 backdrop-blur-md text-white rounded-full p-3 shadow-lg hover:bg-white/30 transition-all pointer-events-auto"
        >
          <Share2 className="w-5 h-5" />
        </button>
        {showShareMenu && (
          <div className="absolute top-14 right-0 bg-white rounded-lg shadow-xl p-2 min-w-[150px] pointer-events-auto">
            <button
              onClick={shareWhatsApp}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Copiar enlace
            </button>
          </div>
        )}
      </motion.div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#D97757]/20 backdrop-blur-sm border border-[#D97757]/30 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-[#D97757]" />
              <span className="text-sm font-medium text-[#D97757]">NUEVO SISTEMA ONLINE</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Reservá tu turno<br />
              <span className="text-[#D97757]">en 3 minutos</span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
              Sin llamadas. Sin esperas. <span className="text-[#D97757] font-semibold">100% Online</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/turnos"
                className="group bg-[#D97757] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#c56645] transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2"
              >
                RESERVAR AHORA
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#como-funciona"
                className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-2"
              >
                Ver cómo funciona
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>

            {/* Live Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 px-6 border border-white/20">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#D97757]" />
                  <span className="text-2xl font-bold">500+</span>
                </div>
                <p className="text-sm text-gray-300">Turnos este mes</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 px-6 border border-white/20">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#D97757]" />
                  <span className="text-2xl font-bold">4.9</span>
                </div>
                <p className="text-sm text-gray-300">Satisfacción</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 px-6 border border-white/20">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#D97757]" />
                  <span className="text-2xl font-bold">24/7</span>
                </div>
                <p className="text-sm text-gray-300">Disponible</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Animated scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-8 h-8 text-white/50" />
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              ¿Por qué usar nuestro sistema?
            </h2>
            <p className="text-xl text-gray-300">Beneficios que hacen la diferencia</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
              >
                <div className="text-[#D97757] mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-300">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-20 px-6 bg-black/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-xl text-gray-300">Tan simple como 1, 2, 3, 4</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-[#D97757] to-[#c56645] rounded-2xl p-6 text-center hover:scale-105 transition-transform">
                  <div className="text-6xl font-bold mb-4 text-white/20">{step.number}</div>
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-white/80">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-[#D97757]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Servicios disponibles
            </h2>
            <p className="text-xl text-gray-300">Reservá cualquiera de estos servicios online</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{service.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{service.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="w-3 h-3" />
                      <span>{service.time}</span>
                    </div>
                    <p className="text-xs text-[#D97757] mt-1">{service.price}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-[#D97757] to-[#c56645] rounded-3xl p-12 text-center shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¡Empezá ahora!
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Unite a los cientos de clientes que ya reservan online
            </p>
            <Link
              href="/turnos"
              className="inline-flex items-center gap-2 bg-white text-[#D97757] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              RESERVAR MI TURNO
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-6 text-sm text-white/70">
              Sin registro • Sin costos adicionales • Confirmación inmediata
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-[#D97757]">Neumáticos del Valle</h3>
              <p className="text-gray-300">
                Tu centro de servicios de confianza, ahora con reservas 100% online.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Enlaces rápidos</h4>
              <div className="space-y-2">
                <Link href="/turnos" className="block text-gray-300 hover:text-[#D97757] transition-colors">
                  Reservar turno
                </Link>
                <Link href="/productos" className="block text-gray-300 hover:text-[#D97757] transition-colors">
                  Productos
                </Link>
                <Link href="/" className="block text-gray-300 hover:text-[#D97757] transition-colors">
                  Inicio
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contacto alternativo</h4>
              <p className="text-gray-300 mb-2">
                <Phone className="inline w-4 h-4 mr-2" />
                WhatsApp: Disponible
              </p>
              <p className="text-sm text-gray-400">
                Lun-Vie: 8:30-18:30<br />
                Sáb: 9:00-13:00
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>© 2024 Neumáticos del Valle. Todos los derechos reservados.</p>
            <p className="mt-2 text-sm">
              Sistema de turnos online - La forma más fácil de reservar tu servicio
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}