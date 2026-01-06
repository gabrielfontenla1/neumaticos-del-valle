'use client';

import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, MessageCircle, Navigation } from 'lucide-react';
import Image from 'next/image';

interface Branch {
  id: string;
  name: string;
  address: string;
  province: string;
  phone: string;
  whatsapp: string;
  hours: {
    weekdays: string;
    saturday: string;
  };
}

const branches: Branch[] = [
  {
    id: 'catamarca-belgrano',
    name: 'Catamarca - Av. Belgrano',
    address: 'Av. Belgrano 938, San Fernando del Valle de Catamarca',
    province: 'Catamarca',
    phone: '0383 419-7501',
    whatsapp: '5493834197501',
    hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:30 - 12:30'
    }
  },
  {
    id: 'catamarca-alem',
    name: 'Catamarca - Av. Alem',
    address: 'Av. Alem 1118, San Fernando del Valle de Catamarca',
    province: 'Catamarca',
    phone: '03832 68-8634',
    whatsapp: '5493832688634',
    hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:00 - 12:30'
    }
  },
  {
    id: 'santiago-labanda',
    name: 'Santiago del Estero - La Banda',
    address: 'República del Líbano Sur 866, La Banda',
    province: 'Santiago del Estero',
    phone: '0385 601-1304',
    whatsapp: '5493856011304',
    hours: {
      weekdays: '08:00 - 12:30 y 15:00 - 19:00',
      saturday: '08:00 - 12:30'
    }
  },
  {
    id: 'santiago-belgrano',
    name: 'Santiago del Estero - Belgrano',
    address: 'Av. Belgrano Sur 2834, Santiago del Estero',
    province: 'Santiago del Estero',
    phone: '0385 677-1265',
    whatsapp: '5493856771265',
    hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:00 - 12:30'
    }
  },
  {
    id: 'salta',
    name: 'Salta',
    address: 'Av. Jujuy 330, Salta',
    province: 'Salta',
    phone: '0387 685-8577',
    whatsapp: '5493876858577',
    hours: {
      weekdays: '08:30 - 18:00',
      saturday: '08:30 - 13:00'
    }
  },
  {
    id: 'tucuman',
    name: 'Tucumán',
    address: 'Av. Gdor. del Campo 436, San Miguel de Tucumán',
    province: 'Tucumán',
    phone: '0381 483-4520',
    whatsapp: '5493814834520',
    hours: {
      weekdays: '08:00 - 12:30 y 16:00 - 20:00',
      saturday: '08:00 - 12:30'
    }
  }
];

export default function SucursalesPage() {
  const handleWhatsApp = (number: string) => {
    window.open(`https://wa.me/${number}`, '_blank');
  };

  const handleMap = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-black py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Simple Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
            Nuestras Sucursales
          </h1>
          <p className="text-gray-400 text-lg">
            Encontrá la más cercana
          </p>
        </div>

        {/* Branch Cards - Flyer Style */}
        <div className="space-y-6">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 hover:border-[#FEE004]/50 transition-all duration-300 group h-[280px] sm:h-[240px]"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src="/tire.webp"
                  alt={branch.name}
                  fill
                  className="object-cover"
                  priority={index < 2}
                />
                {/* Gradient Overlay - Left to Right */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/50 to-black" />
              </div>

              {/* Content Container - Right Side */}
              <div className="relative h-full flex items-center justify-end">
                <div className="w-full sm:w-2/5 p-6 sm:p-8 space-y-4">

                  {/* Branch Name */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-[#FEE004]" />
                      <span className="text-xs uppercase tracking-wider text-[#FEE004]/80 font-semibold">
                        {branch.province}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {branch.name}
                    </h3>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    {/* Address */}
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {branch.address}
                    </p>

                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#FEE004]" />
                      <a
                        href={`tel:${branch.phone}`}
                        className="text-gray-300 hover:text-[#FEE004] transition-colors text-sm font-medium"
                      >
                        {branch.phone}
                      </a>
                    </div>

                    {/* Hours */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#FEE004]" />
                      <div className="text-xs text-gray-400">
                        <span className="text-gray-300">Lun-Vie:</span> {branch.hours.weekdays} • <span className="text-gray-300">Sáb:</span> {branch.hours.saturday}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleWhatsApp(branch.whatsapp)}
                      className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 text-sm shadow-lg hover:shadow-[#25D366]/30"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>

                    <button
                      onClick={() => handleMap(branch.address)}
                      className="flex-1 bg-white/10 hover:bg-[#FEE004] hover:text-black text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 border border-white/20 hover:border-[#FEE004] text-sm backdrop-blur-sm"
                    >
                      <Navigation className="w-4 h-4" />
                      Mapa
                    </button>
                  </div>
                </div>
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FEE004]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
