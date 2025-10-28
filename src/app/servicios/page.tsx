'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Target,
  CircleDot,
  RotateCw,
  Wind,
  Settings,
  Hammer,
  Clock,
  DollarSign,
  Check,
  CheckCircle2,
  Calendar,
  MapPin,
  Star,
  Cpu,
  Award,
  Shield,
  Zap,
  ChevronDown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useState, useRef } from 'react';
import { PixiBackground } from '@/components/PixiBackground';
import Link from 'next/link';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.0, 0.0, 0.2, 1.0] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.0, 0.0, 0.2, 1.0] as const }
  }
};

// Services data
const services = [
  {
    id: 1,
    name: 'Alineado',
    icon: Target,
    description: 'Alineación computarizada de alta precisión para optimizar el desgaste de neumáticos y mejorar la estabilidad',
    duration: '45 minutos',
    price: 'Desde $35.000',
    benefits: ['Desgaste uniforme', 'Mayor estabilidad', 'Ahorro de combustible', 'Mejor manejo']
  },
  {
    id: 2,
    name: 'Balanceo',
    icon: CircleDot,
    description: 'Balanceo dinámico computarizado para eliminar vibraciones y mejorar el confort de manejo',
    duration: '30 minutos',
    price: 'Desde $25.000',
    benefits: ['Sin vibraciones', 'Mayor confort', 'Protege suspensión', 'Mayor vida útil']
  },
  {
    id: 3,
    name: 'Rotación',
    icon: RotateCw,
    description: 'Rotación de neumáticos para desgaste uniforme y maximizar la vida útil de tus cubiertas',
    duration: '30 minutos',
    price: 'Desde $20.000',
    benefits: ['Desgaste parejo', 'Mayor durabilidad', 'Mejor tracción', 'Ahorro económico']
  },
  {
    id: 4,
    name: 'Inflado con Nitrógeno',
    icon: Wind,
    description: 'Inflado con nitrógeno puro para mejor rendimiento, menor pérdida de presión y mayor seguridad',
    duration: '20 minutos',
    price: 'Desde $15.000',
    benefits: ['Presión estable', 'Menor oxidación', 'Temperatura controlada', 'Mayor seguridad']
  },
  {
    id: 5,
    name: 'Tren Delantero',
    icon: Settings,
    description: 'Revisión y ajuste completo del sistema de suspensión y dirección para máxima seguridad',
    duration: '60 minutos',
    price: 'Desde $45.000',
    benefits: ['Suspensión óptima', 'Dirección precisa', 'Mayor seguridad', 'Previene averías']
  },
  {
    id: 6,
    name: 'Reparación de Llantas',
    icon: Hammer,
    description: 'Reparación profesional de pinchazos y daños menores con garantía de calidad',
    duration: '40 minutos',
    price: 'Desde $18.000',
    benefits: ['Reparación segura', 'Trabajo garantizado', 'Ahorro vs. reemplazo', 'Servicio rápido']
  }
];

// Process steps data
const processSteps = [
  {
    step: 1,
    title: 'Elegí tu servicio',
    icon: CheckCircle2,
    description: 'Seleccioná el servicio que necesitás'
  },
  {
    step: 2,
    title: 'Reservá tu turno',
    icon: Calendar,
    description: 'Elegí día y horario que te convenga'
  },
  {
    step: 3,
    title: 'Visitá la sucursal',
    icon: MapPin,
    description: 'Acercate a tu sucursal más cercana'
  },
  {
    step: 4,
    title: 'Disfrutá el resultado',
    icon: Star,
    description: 'Tu vehículo en óptimas condiciones'
  }
];

// Why choose us data
const benefits = [
  {
    title: 'Equipamiento de Última Generación',
    description: 'Tecnología de punta para diagnósticos precisos',
    icon: Cpu
  },
  {
    title: 'Técnicos Certificados',
    description: 'Profesionales altamente capacitados',
    icon: Award
  },
  {
    title: 'Garantía de Calidad',
    description: 'Respaldamos todos nuestros trabajos',
    icon: Shield
  },
  {
    title: 'Servicio Express',
    description: 'Atención rápida y eficiente',
    icon: Zap
  }
];

// FAQ data
const faqData = [
  {
    question: '¿Cada cuánto debo alinear mi vehículo?',
    answer: 'Se recomienda realizar el alineado cada 10.000 km o cuando notes desgaste irregular en los neumáticos, el vehículo tire hacia un lado o el volante vibre.'
  },
  {
    question: '¿Qué diferencia hay entre balanceo y alineado?',
    answer: 'El balanceo corrige el peso desigual en las ruedas para eliminar vibraciones, mientras que el alineado ajusta los ángulos de las ruedas para que estén perpendiculares al suelo y paralelas entre sí.'
  },
  {
    question: '¿Cuándo debo rotar mis neumáticos?',
    answer: 'La rotación debe hacerse cada 8.000 a 10.000 km para garantizar un desgaste uniforme y prolongar la vida útil de los neumáticos.'
  },
  {
    question: '¿Qué ventajas tiene el nitrógeno sobre el aire común?',
    answer: 'El nitrógeno mantiene la presión más estable, reduce la oxidación interna, controla mejor la temperatura y mejora la eficiencia del combustible.'
  },
  {
    question: '¿Cuánto tiempo duran los servicios?',
    answer: 'Depende del servicio: rotación y balanceo (30 min), alineado (45 min), tren delantero (60 min). Siempre trabajamos con la mayor eficiencia posible.'
  }
];

// Service Card Component
const ServiceCard = ({ service, index }: { service: typeof services[0], index: number }) => {
  const Icon = service.icon;

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group relative bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/10 hover:border-[#FEE004] transition-all duration-300 overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FEE004]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-16 h-16 bg-[#FEE004]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FEE004]/20 transition-colors duration-300">
          <Icon className="w-8 h-8 text-[#FEE004]" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-3">{service.name}</h3>

        {/* Description */}
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">{service.description}</p>

        {/* Duration and Price */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{service.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-[#FEE004] font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>{service.price}</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-6">
          {service.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#FEE004]" />
              <span className="text-sm text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button className="w-full bg-[#FEE004] text-black font-semibold py-3 px-6 rounded-xl hover:bg-[#FEE004]/90 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
          Reservar Turno
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={false}
      className="border-b border-white/10 last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-[#FEE004] transition-colors duration-300"
      >
        <span className="font-semibold text-lg pr-8">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-[#FEE004]" />
        </motion.div>
      </button>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="text-gray-400 pb-6 pr-12">{answer}</p>
      </motion.div>
    </motion.div>
  );
};

export default function ServiciosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section with Parallax */}
      <section ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* PixiJS Animated Background */}
        <motion.div style={{ y, opacity }} className="absolute inset-0">
          <PixiBackground />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#FEE004_0%,_transparent_70%)] opacity-5" />
        </motion.div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-[#FEE004]/10 backdrop-blur-md border border-[#FEE004]/30 rounded-full px-6 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#FEE004]" />
              <span className="text-[#FEE004] font-medium">Servicio profesional desde 1984</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
            >
              Nuestros Servicios
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12"
            >
              Tecnología de punta y profesionales expertos para el cuidado integral de tu vehículo
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              variants={fadeInUp}
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <ChevronDown className="w-8 h-8 text-[#FEE004]" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 relative bg-gradient-to-b from-black via-gray-900/20 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-center mb-4"
            >
              ¿Cómo funciona?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-400 text-center mb-16 max-w-2xl mx-auto"
            >
              Proceso simple y transparente para tu comodidad
            </motion.p>

            <div className="relative max-w-4xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#FEE004] to-transparent hidden md:block" />

              <div className="space-y-12">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.step}
                      variants={fadeInUp}
                      className={`flex items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                        <p className="text-gray-400">{step.description}</p>
                      </div>

                      <div className="relative">
                        <div className="w-20 h-20 bg-[#FEE004]/10 backdrop-blur-lg rounded-full flex items-center justify-center border-4 border-[#FEE004] relative z-10">
                          <Icon className="w-8 h-8 text-[#FEE004]" />
                        </div>
                        <div className="absolute inset-0 bg-[#FEE004] rounded-full animate-ping opacity-20" />
                      </div>

                      <div className="flex-1 hidden md:block" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-center mb-4"
            >
              ¿Por qué elegirnos?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-400 text-center mb-16 max-w-2xl mx-auto"
            >
              Compromiso con la excelencia en cada servicio
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    variants={scaleIn}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/10 hover:border-[#FEE004] transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 bg-[#FEE004]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#FEE004]/20 transition-colors duration-300">
                      <Icon className="w-7 h-7 text-[#FEE004]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl font-bold text-center mb-4"
            >
              Preguntas Frecuentes
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-gray-400 text-center mb-16 max-w-2xl mx-auto"
            >
              Resolvemos todas tus dudas sobre nuestros servicios
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/10"
            >
              {faqData.map((item, index) => (
                <FAQItem key={index} question={item.question} answer={item.answer} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FEE004]/20 via-[#FEE004]/10 to-[#FEE004]/20 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-[#FEE004]/10 backdrop-blur-md border border-[#FEE004]/30 rounded-full px-6 py-2 mb-8"
            >
              <Calendar className="w-4 h-4 text-[#FEE004]" />
              <span className="text-[#FEE004] font-medium">Agenda tu visita hoy</span>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              ¿Listo para reservar tu servicio?
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              Elegí tu sucursal y horario preferido. Te esperamos con la mejor atención.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button className="bg-[#FEE004] text-black font-bold py-4 px-8 rounded-xl hover:bg-[#FEE004]/90 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-2xl shadow-[#FEE004]/20">
                Reservar Turno
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-white/20 text-white font-bold py-4 px-8 rounded-xl hover:border-[#FEE004] hover:text-[#FEE004] transition-all duration-300 flex items-center justify-center gap-2">
                Ver Sucursales
                <MapPin className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}