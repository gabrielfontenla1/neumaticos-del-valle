'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Wrench, Clock, Mail, Phone } from 'lucide-react';

export function UnderConstruction() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-[#FEE004] rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#FEE004] rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16"
        >
          <div className="relative w-full max-w-4xl h-40 md:h-56 mx-auto">
            <Image
              src="/NDV_Logo_Negro.svg"
              alt="Neumáticos del Valle"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Estamos construyendo
            <br />
            <span className="text-[#FEE004] inline-block mt-2">
              algo increíble
            </span>
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Nuestra nueva plataforma digital está en desarrollo.
          Pronto podrás gestionar tus neumáticos de forma más fácil y rápida.
        </motion.p>

        {/* Features preview */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <FeatureCard
            icon={<Wrench className="w-8 h-8" />}
            title="Sistema de Turnos"
            description="Reservá online 24/7"
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8" />}
            title="Catálogo Digital"
            description="Consultá stock en tiempo real"
          />
          <FeatureCard
            icon={<Mail className="w-8 h-8" />}
            title="Atención Directa"
            description="Contacto rápido por WhatsApp"
          />
        </motion.div>

        {/* Contact info */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400"
        >
          <a
            href="tel:03856771265"
            className="flex items-center gap-2 hover:text-[#FEE004] transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span>0385 677-1265</span>
          </a>
          <span className="hidden sm:inline">•</span>
          <a
            href="mailto:info@neumaticosdelvalle.com"
            className="flex items-center gap-2 hover:text-[#FEE004] transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span>info@neumaticosdelvalle.com</span>
          </a>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-16"
        >
          <div className="w-full max-w-md mx-auto bg-gray-800 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FEE004] to-yellow-300"
              initial={{ width: "0%" }}
              animate={{ width: "95%" }}
              transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-gray-500 text-sm mt-4">Progreso del desarrollo: 95%</p>
        </motion.div>
      </div>

      {/* Animated tire icon */}
      <motion.div
        className="absolute bottom-10 right-10 opacity-10"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="100" r="80" stroke="#FEE004" strokeWidth="8" />
          <circle cx="100" cy="100" r="50" stroke="#FEE004" strokeWidth="6" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="100"
              y1="100"
              x2={100 + 65 * Math.cos((angle * Math.PI) / 180)}
              y2={100 + 65 * Math.sin((angle * Math.PI) / 180)}
              stroke="#FEE004"
              strokeWidth="4"
            />
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#FEE004]/50"
    >
      <div className="text-[#FEE004] mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  );
}
