'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, MessageCircle, Navigation, AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import type { Branch } from '@/types/branch';

export default function SucursalesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/branches');
      const data = await response.json();

      if (response.ok && data.success) {
        setBranches(data.branches || []);
      } else {
        setError('Error al cargar sucursales');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  };
  const handleWhatsApp = (number: string | null) => {
    if (!number) return;
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

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-12 h-12 text-[#FEE004] animate-spin mb-4" />
            <p className="text-gray-400">Cargando sucursales...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400">Error</h3>
              </div>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={fetchBranches}
                className="bg-[#FEE004] hover:bg-[#FEE004]/90 text-black py-2 px-4 rounded-lg font-medium flex items-center gap-2 transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Branch Cards - Flyer Style */}
        {!loading && !error && (
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
                  src={branch.background_image_url || '/tire.webp'}
                  alt={branch.name}
                  fill
                  className="object-cover"
                  priority={index < 2}
                  unoptimized={!!branch.background_image_url}
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
                        <span className="text-gray-300">Lun-Vie:</span> {branch.opening_hours.weekdays} • <span className="text-gray-300">Sáb:</span> {branch.opening_hours.saturday}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {branch.whatsapp && (
                      <button
                        onClick={() => handleWhatsApp(branch.whatsapp)}
                        className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 text-white py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 text-sm shadow-lg hover:shadow-[#25D366]/30"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                    )}

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
        )}
      </div>
    </main>
  );
}
