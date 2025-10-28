'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, MessageCircle, Mail, Clock, Star, Calendar, ExternalLink, Navigation } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { PixiBackground } from '@/components/PixiBackground';

// Branch data type
interface Branch {
  id: string;
  name: string;
  isMain?: boolean;
  address: string;
  province: string;
  phone: string;
  whatsapp: string;
  email: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  hours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
}

// Branch data
const branches: Branch[] = [
  {
    id: 'catamarca-belgrano',
    name: 'Catamarca - Av Belgrano',
    isMain: true,
    address: 'Av Belgrano 938, San Fernando del Valle de Catamarca',
    province: 'Catamarca',
    phone: '0383-443-5555',
    whatsapp: '5493834435555',
    email: 'catamarca.belgrano@neumaticosdelValle.com',
    coordinates: { lat: -28.4696, lng: -65.7852 },
    hours: {
      weekdays: '08:30 - 19:00',
      saturday: '08:30 - 13:00',
      sunday: 'Cerrado'
    }
  },
  {
    id: 'catamarca-alem',
    name: 'Catamarca - Alem',
    address: 'Alem 1118, San Fernando del Valle de Catamarca',
    province: 'Catamarca',
    phone: '0383-443-6666',
    whatsapp: '5493834436666',
    email: 'catamarca.alem@neumaticosdelValle.com',
    coordinates: { lat: -28.4696, lng: -65.7852 },
    hours: {
      weekdays: '08:30 - 19:00',
      saturday: '08:30 - 13:00',
      sunday: 'Cerrado'
    }
  },
  {
    id: 'santiago-labanda',
    name: 'Santiago del Estero - La Banda',
    address: 'República del Líbano Sur 866, La Banda',
    province: 'Santiago del Estero',
    phone: '0385-427-7777',
    whatsapp: '5493854277777',
    email: 'labanda@neumaticosdelValle.com',
    coordinates: { lat: -27.7356, lng: -64.2424 },
    hours: {
      weekdays: '08:30 - 19:00',
      saturday: '08:30 - 13:00',
      sunday: 'Cerrado'
    }
  },
  {
    id: 'santiago-belgrano',
    name: 'Santiago del Estero - Belgrano',
    address: 'Avenida Belgrano Sur 2834, Santiago del Estero',
    province: 'Santiago del Estero',
    phone: '0385-421-9999',
    whatsapp: '5493854219999',
    email: 'santiago@neumaticosdelValle.com',
    coordinates: { lat: -27.7951, lng: -64.2615 },
    hours: {
      weekdays: '08:30 - 19:00',
      saturday: '08:30 - 13:00',
      sunday: 'Cerrado'
    }
  },
  {
    id: 'salta',
    name: 'Salta',
    address: 'Jujuy 330, Salta',
    province: 'Salta',
    phone: '0387-431-8888',
    whatsapp: '5493874318888',
    email: 'salta@neumaticosdelValle.com',
    coordinates: { lat: -24.7859, lng: -65.4117 },
    hours: {
      weekdays: '08:30 - 19:00',
      saturday: '08:30 - 13:00',
      sunday: 'Cerrado'
    }
  },
  {
    id: 'tucuman',
    name: 'Tucumán',
    address: 'Avenida Gobernador del Campo 436, San Miguel de Tucumán',
    province: 'Tucumán',
    phone: '0381-422-5555',
    whatsapp: '5493814225555',
    email: 'tucuman@neumaticosdelValle.com',
    coordinates: { lat: -26.8083, lng: -65.2176 },
    hours: {
      weekdays: '08:30 - 19:00',
      saturday: '08:30 - 13:00',
      sunday: 'Cerrado'
    }
  }
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.0, 0.0, 0.2, 1.0] as const
    }
  }
};

export default function SucursalesPage() {
  const [selectedProvince, setSelectedProvince] = useState<string>('all');

  // Get unique provinces for filter
  const provinces = ['all', ...new Set(branches.map(b => b.province))];

  // Filter branches by province
  const filteredBranches = selectedProvince === 'all'
    ? branches
    : branches.filter(b => b.province === selectedProvince);

  const handleWhatsApp = (number: string) => {
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const handleMap = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section with Parallax */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
      >
        {/* PixiJS Animated Background */}
        <div className="absolute inset-0">
          <PixiBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FEE004]/10 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#FEE004]/10 border border-[#FEE004]/30 backdrop-blur-lg mb-8"
          >
            <MapPin className="w-5 h-5 text-[#FEE004]" />
            <span className="text-[#FEE004] font-medium">6 Sucursales en el NOA</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6"
          >
            Nuestras <span className="text-[#FEE004]">Sucursales</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl sm:text-2xl text-gray-400 mb-8"
          >
            Distribuidor oficial Pirelli en el NOA
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg text-gray-500 max-w-3xl mx-auto"
          >
            Encontrá la sucursal más cercana y visitanos para obtener el mejor asesoramiento y servicio para tu vehículo
          </motion.p>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-[#FEE004]/50 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-[#FEE004] rounded-full mt-2" />
          </div>
        </motion.div>
      </motion.section>

      {/* Province Filter */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-3 justify-center"
          >
            {provinces.map((province) => (
              <button
                key={province}
                onClick={() => setSelectedProvince(province)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedProvince === province
                    ? 'bg-[#FEE004] text-black'
                    : 'bg-white/5 text-white hover:bg-[#FEE004]/10 hover:text-[#FEE004] border border-white/10 hover:border-[#FEE004]/30'
                }`}
              >
                {province === 'all' ? 'Todas las Provincias' : province}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Branch Cards Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBranches.map((branch, index) => (
              <motion.div
                key={branch.id}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <div className="h-full bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-[#FEE004]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FEE004]/20">
                  {/* Main Badge */}
                  {branch.isMain && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <div className="bg-[#FEE004] text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        PRINCIPAL
                      </div>
                    </div>
                  )}

                  {/* Branch Name */}
                  <h3 className="text-xl font-bold text-white mb-4 flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-[#FEE004] mt-1 flex-shrink-0" />
                    {branch.name}
                  </h3>

                  {/* Branch Details */}
                  <div className="space-y-3 mb-6">
                    {/* Address */}
                    <div className="text-gray-400 text-sm">
                      <p>{branch.address}</p>
                      <p className="text-[#FEE004]/80 mt-1">{branch.province}</p>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3 text-gray-300">
                      <Phone className="w-4 h-4 text-[#FEE004]" />
                      <a
                        href={`tel:${branch.phone}`}
                        className="hover:text-[#FEE004] transition-colors"
                      >
                        {branch.phone}
                      </a>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 text-gray-300">
                      <Mail className="w-4 h-4 text-[#FEE004]" />
                      <a
                        href={`mailto:${branch.email}`}
                        className="text-sm hover:text-[#FEE004] transition-colors break-all"
                      >
                        {branch.email}
                      </a>
                    </div>

                    {/* Hours */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-[#FEE004] mt-1" />
                        <div className="text-sm space-y-1">
                          <p className="text-gray-300">
                            <span className="text-gray-500">Lun-Vie:</span> {branch.hours.weekdays}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-500">Sábado:</span> {branch.hours.saturday}
                          </p>
                          <p className="text-gray-300">
                            <span className="text-gray-500">Domingo:</span> {branch.hours.sunday}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleWhatsApp(branch.whatsapp)}
                      className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 group-hover:scale-105"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </button>

                    <button
                      onClick={() => handleMap(branch.address)}
                      className="w-full bg-white/10 hover:bg-[#FEE004]/10 text-white hover:text-[#FEE004] py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 border border-white/10 hover:border-[#FEE004]/30"
                    >
                      <Navigation className="w-5 h-5" />
                      Ver en Mapa
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Ubicación de <span className="text-[#FEE004]">Nuestras Sucursales</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Encuentra fácilmente la sucursal más cercana a tu ubicación
            </p>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl"
          >
            <div className="aspect-video">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3507.1234567890!2d-65.7852!3d-28.4696!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDI4JzEwLjYiUyA2NcKwNDcnMDYuNyJX!5e0!3m2!1sen!2sar!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative bg-gradient-to-r from-[#FEE004] to-[#FFD700] rounded-3xl p-12 text-center overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-black/10 rounded-full mb-6"
              >
                <Calendar className="w-10 h-10 text-black" />
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-bold text-black mb-4">
                ¿Necesitás un turno?
              </h2>
              <p className="text-black/80 text-lg mb-8 max-w-2xl mx-auto">
                Reservá tu turno online y ahorrá tiempo. Servicio rápido y profesional en todas nuestras sucursales.
              </p>

              <Link href="/turnos">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-black text-[#FEE004] px-10 py-4 rounded-xl font-bold text-lg hover:bg-black/90 transition-all duration-300 shadow-2xl"
                >
                  Reservar Turno Ahora
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <motion.div variants={fadeInUp}>
              <div className="text-4xl sm:text-5xl font-bold text-[#FEE004] mb-2">6</div>
              <div className="text-gray-400">Sucursales</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-4xl sm:text-5xl font-bold text-[#FEE004] mb-2">4</div>
              <div className="text-gray-400">Provincias</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-4xl sm:text-5xl font-bold text-[#FEE004] mb-2">+30</div>
              <div className="text-gray-400">Años de Experiencia</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-4xl sm:text-5xl font-bold text-[#FEE004] mb-2">24/7</div>
              <div className="text-gray-400">Atención WhatsApp</div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}