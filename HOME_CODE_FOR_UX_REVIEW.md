# Home Page - Neumáticos del Valle
## Código para Revisión UI/UX

---

## 📋 Contexto del Proyecto

**Tipo**: E-commerce de neumáticos y servicios automotrices
**Negocio**: Neumáticos del Valle SRL - Distribuidor Oficial Pirelli (Argentina, NOA)
**Stack Técnico**:
- Next.js 15.5 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (animaciones)
- Diseño inspirado en Tesla

**Objetivos de Conversión**:
- Reservas de turnos vía online
- Checkout directo por WhatsApp
- Consultas de productos/servicios

**Métricas Clave a Mejorar**:
- Bounce rate
- Tiempo en página
- Conversión a WhatsApp/Turnos

---

## 🏗️ Estructura de la Home

La home está dividida en **11 secciones modulares**:

1. **Navbar** - Navegación fija con links principales
2. **HeroCarousel** - 3 slides con animaciones infinitas (Neumáticos, Aceites, Sucursales)
3. **StatsBar** - Estadísticas de confianza (40 años, 100% original, etc.)
4. **TireModelsSection** - Carrusel de modelos Pirelli
5. **PerformanceStats** - Números de rendimiento destacados
6. **BranchesSection** - 6 sucursales en el NOA
7. **TestimonialsSection** - Testimonios de clientes reales
8. **GuaranteesSection** - Garantías y certificaciones
9. **ProcessSection** - 4 pasos del servicio
10. **FAQSection** - Preguntas frecuentes (acordeón)
11. **CTASection** - Call to action final
12. **Footer** - Información de contacto y links

---

## 📁 Código por Archivo

### 1. Componente Principal: `TeslaHomePage.tsx`

```tsx
'use client'

import { Navbar } from './layout/Navbar'
import {
  HeroCarousel,
  StatsBar,
  TireModelsSection,
  PerformanceStats,
  BranchesSection,
  CTASection,
  Footer,
  TestimonialsSection,
  GuaranteesSection,
  ProcessSection,
  FAQSection,
} from './home'

export function TeslaHomePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <Navbar />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Stats Bar */}
      <StatsBar />

      {/* Tire Models Section */}
      <TireModelsSection />

      {/* Performance Stats */}
      <PerformanceStats />

      {/* Branches Section */}
      <BranchesSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Guarantees */}
      <GuaranteesSection />

      {/* Process */}
      <ProcessSection />

      {/* FAQ */}
      <FAQSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
```

---

### 2. Navbar (Navegación Fija)

```tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, Menu, X, Phone, MapPin, ShoppingCart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isAuthenticated } from '@/features/admin/api'
import { useCartContext } from '@/providers/CartProvider'

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const { itemCount } = useCartContext()

  // Helper function to check if link is active
  const isLinkActive = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname?.startsWith(href)) return true
    return false
  }

  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAdmin(isAuthenticated())
    }

    checkAuth()

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth)

    // Also check periodically in case sessionStorage changed in same tab
    const interval = setInterval(checkAuth, 1000)

    return () => {
      window.removeEventListener('storage', checkAuth)
      clearInterval(interval)
    }
  }, [pathname])

  // Don't render navbar if user is in admin area
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black backdrop-blur-lg" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 py-2 mr-12">
            <Image
              src="/NDV_Logo.svg"
              alt="Neumáticos del Valle"
              width={180}
              height={48}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Inicio
              {isLinkActive('/') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/productos"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/productos')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Ver Productos
              {isLinkActive('/productos') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/agro-camiones"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/agro-camiones')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Agro y Camiones
              {isLinkActive('/agro-camiones') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/equivalencias"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/equivalencias')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Equivalencias
              {isLinkActive('/equivalencias') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/servicios"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/servicios')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Servicios
              {isLinkActive('/servicios') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/aceites"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/aceites')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Aceites
              {isLinkActive('/aceites') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/sucursales"
              className={`text-sm font-medium transition-all duration-300 ease-out relative ${
                isLinkActive('/sucursales')
                  ? 'text-[#FEE004]'
                  : 'text-white hover:text-[#FEE004]'
              }`}
            >
              Sucursales
              {isLinkActive('/sucursales') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FEE004] rounded-full" />
              )}
            </Link>
            <Link
              href="/turnos"
              className="flex items-center gap-2 px-4 py-2 bg-[#FEE004] text-black rounded-lg hover:bg-[#FEE004]/90 transition-all duration-300 ease-out hover:shadow-lg hover:shadow-[#FEE004]/20 text-sm font-semibold"
            >
              <Calendar className="w-4 h-4" />
              Turnos
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Cart Button */}
            <Link
              href="/carrito"
              className="p-2 text-white hover:text-[#FEE004] transition-all duration-300 ease-out rounded-lg hover:bg-white/5 relative"
              aria-label="Carrito de compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Admin panel link - only show if admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 bg-[#FEE004] text-black hover:bg-[#FEE004]/90 rounded-lg transition-all duration-300 ease-out text-sm font-medium"
              >
                Panel Admin
              </Link>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            {/* Cart Button Mobile */}
            <Link
              href="/carrito"
              className="p-2 text-white hover:text-[#FEE004] transition-all duration-300 ease-out relative"
              aria-label="Carrito de compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:text-[#FEE004] transition-all duration-300 ease-out"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 space-y-3 border-t border-white/10 mt-2">
          {/* Mobile navigation links... (shortened for brevity) */}
        </div>
      )}
    </nav>
  )
}
```

---

### 3. HeroCarousel (3 Slides con Animaciones)

**Archivo**: `src/components/home/HeroCarousel.tsx`
**Tamaño**: ~490 líneas (incluye 3 slides completos)

**Características**:
- ✅ Carrusel con 3 slides: Neumáticos, Aceites, Sucursales
- ✅ Animaciones infinitas con Framer Motion (scroll vertical bidireccional)
- ✅ Autoplay con controles de play/pause
- ✅ Navegación por teclado (flechas)
- ✅ Responsive mobile/desktop

**Extracto del código** (ver archivo completo arriba en lectura):

```tsx
// Slide 1: Ofertas de Neumáticos
function SlideOfertas() {
  const column1Images = [...tireImages.column1, ...tireImages.column1]
  const column2Images = [...tireImages.column2, ...tireImages.column2]

  return (
    <div className="relative bg-white h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden">
      {/* 2-column infinite scroll grid con motion.div */}
      {/* Left: Sales Copy + CTAs */}
      {/* Right: Infinite scrolling images */}
    </div>
  )
}

// Slide 2: Cambio de Aceite
function SlideAceite() {
  // Similar pattern con productos Shell Helix
}

// Slide 3: Sucursales
function SlideSucursales() {
  // 8 columnas de imágenes de locales con scroll infinito
}
```

**Colores principales**:
- Amarillo Pirelli: `#FEE004`
- Fondo: `white`, `#F7F7F7`, `#F9F9F9`
- Overlay móvil: `black/50`

---

### 4. StatsBar (Estadísticas de Confianza)

```tsx
'use client'

import { motion } from 'framer-motion'
import { Award } from 'lucide-react'
import { heroStats } from './data'

export function StatsBar() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEE004]/10 backdrop-blur-sm rounded-full mb-6 border border-[#FEE004]/20"
          >
            <Award className="w-5 h-5 text-[#FEE004]" />
            <span className="text-sm font-semibold text-gray-900">
              Distribuidor Oficial Pirelli desde 1984
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Números que hablan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Más de cuatro décadas priorizando tu seguridad en cada kilómetro
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {heroStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FEE004]/10 rounded-2xl mb-4 group-hover:bg-[#FEE004] transition-colors duration-300 shadow-lg">
                {stat.icon && <stat.icon className="w-8 h-8 text-black" />}
              </div>
              <div className="text-4xl lg:text-5xl font-bold text-black mb-2 group-hover:text-[#FEE004] transition-colors">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

### 5. TireModelsSection (Carrusel de Modelos)

**Archivo**: `src/components/home/TireModelsSection.tsx` (125 líneas)

**Características**:
- Carrusel automático con 4 modelos Pirelli
- Autoplay con stop on hover
- Navegación con flechas
- Mobile responsive (1 card) → Desktop (3 cards)

```tsx
export function TireModelsSection() {
  return (
    <section id="modelos" className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2>Neumáticos Pirelli</motion.h2>
          <motion.p>Tecnología italiana de clase mundial...</motion.p>
        </div>

        <Carousel
          opts={{ align: "center", loop: true }}
          plugins={[Autoplay({ delay: 4000, stopOnMouseEnter: true })]}
        >
          <CarouselContent>
            {tireModels.map((model) => (
              <CarouselItem key={model.id} className="basis-full md:basis-1/2 lg:basis-1/3">
                {/* Card con imagen, título, descripción, features */}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="text-center mt-8">
          <Link href="/productos">Ver Catálogo Completo</Link>
        </div>
      </div>
    </section>
  )
}
```

---

### 6. PerformanceStats (Banner Amarillo)

```tsx
export function PerformanceStats() {
  return (
    <section className="py-20 bg-[#FEE004]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {performanceStats.map((stat, index) => (
            <motion.div key={index} /* animaciones */>
              <div className="text-4xl lg:text-5xl font-bold text-black mb-2">
                {stat.number}<span className="ml-1">{stat.suffix}</span>
              </div>
              <div className="text-gray-900 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Stats mostrados**:
- 33,639+ Neumáticos instalados
- 10,440+ Services realizados
- 4.9★ Calificación promedio
- 98% Clientes satisfechos

---

### 7. BranchesSection (6 Sucursales)

**Archivo**: `src/components/home/BranchesSection.tsx` (129 líneas)

**Características**:
- Mobile: Carrusel con autoplay
- Desktop: Grid 3 columnas
- Hover effects con scale y bordes amarillos
- Overlay gradient sobre imágenes

```tsx
export function BranchesSection() {
  return (
    <section id="sucursales" className="py-20 bg-white">
      {/* Mobile Carousel */}
      <div className="md:hidden">
        <Carousel plugins={[Autoplay({ delay: 4000 })]}>
          {branches.map((branch) => (
            <CarouselItem>
              <div className="relative h-[300px] rounded-2xl border-2 border-[#FEE004]/20">
                <Image src={branch.image} alt={branch.name} fill />
                {/* Info overlay */}
              </div>
            </CarouselItem>
          ))}
        </Carousel>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <motion.div /* hover effects */>
            {/* Branch card */}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
```

---

### 8. TestimonialsSection (Testimonios de Clientes)

**Archivo**: `src/components/home/TestimonialsSection.tsx` (204 líneas)

**Características**:
- 3 testimonios reales con fotos
- Rating de 5 estrellas
- Badge de verificación
- Mobile: Carrusel / Desktop: Grid 3 columnas

```tsx
const testimonials = [
  {
    id: 1,
    name: 'Carlos Mendoza',
    role: 'Conductor de Uber',
    location: 'Catamarca',
    rating: 5,
    image: 'https://images.unsplash.com/...',
    quote: 'Después de 40,000 km con mis Pirelli Cinturato...',
    verified: true,
    service: 'Cambio de 4 neumáticos'
  },
  // ... 2 more testimonials
]

function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <Quote icon />
      <div className="flex gap-1 mb-4">
        {/* 5 stars */}
      </div>
      <p>"{testimonial.quote}"</p>
      <div className="flex items-center gap-4 pt-6">
        <Image src={testimonial.image} />
        <div>
          <h4>{testimonial.name} <BadgeCheck /></h4>
          <p>{testimonial.role}</p>
        </div>
      </div>
    </div>
  )
}
```

---

### 9. GuaranteesSection (Garantías y Certificaciones)

**Archivo**: `src/components/home/GuaranteesSection.tsx` (190 líneas)

**Características**:
- Fondo negro con texto blanco
- 3 garantías principales con íconos
- Lista de certificaciones en badges
- Mobile: Carrusel / Desktop: Grid

```tsx
const guarantees = [
  {
    icon: Shield,
    title: 'Garantía de Autenticidad',
    description: 'Todos nuestros productos son 100% originales...',
    features: [
      'Productos directos de fábrica',
      'Certificado de garantía oficial',
      'Trazabilidad completa'
    ]
  },
  // ... 2 more guarantees
]

export function GuaranteesSection() {
  return (
    <section className="py-20 bg-black text-white">
      {/* Header with Shield icon */}
      {/* Grid/Carousel of guarantees */}
      {/* Bottom: Certification badges */}
    </section>
  )
}
```

---

### 10. ProcessSection (4 Pasos del Servicio)

**Archivo**: `src/components/home/ProcessSection.tsx` (213 líneas)

**Características**:
- 4 pasos con íconos circulares
- Timeline con línea de progreso animada
- Hover effects con elevation
- Mobile: Carrusel / Desktop: Grid con conectores

```tsx
const steps = [
  {
    number: '01',
    title: 'Reserva Online',
    description: 'Agenda tu turno en menos de 2 minutos...',
    icon: Calendar,
    time: '2 min'
  },
  // ... 3 more steps
]

function StepCard({ step }) {
  return (
    <motion.div whileHover={{ y: -8 }}>
      <div className="relative w-24 h-24 mx-auto">
        {/* Circular icon with step number badge */}
      </div>
      <h3>{step.title}</h3>
      <p>{step.description}</p>
      <div className="inline-flex items-center gap-2">
        <Clock /> <span>{step.time}</span>
      </div>
    </motion.div>
  )
}
```

---

### 11. FAQSection (Preguntas Frecuentes)

**Archivo**: `src/components/home/FAQSection.tsx` (132 líneas)

**Características**:
- Acordeón con 6 preguntas
- Primera pregunta abierta por defecto
- Animación smooth de expand/collapse
- CTA de contacto al final

```tsx
const faqs = [
  {
    question: '¿Cómo sé que los neumáticos son originales?',
    answer: 'Cada neumático Pirelli incluye un código único...'
  },
  // ... 5 more FAQs
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 bg-gray-50">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div className="bg-white rounded-2xl">
            <button onClick={() => setOpenIndex(openIndex === index ? null : index)}>
              <span>{faq.question}</span>
              <ChevronDown className={openIndex === index ? 'rotate-180' : ''} />
            </button>
            <div className={openIndex === index ? 'max-h-96' : 'max-h-0'}>
              {faq.answer}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-12 p-8 bg-white rounded-2xl">
        <h3>¿No encontraste tu respuesta?</h3>
        <a href="https://wa.me/...">WhatsApp</a>
        <Link href="/turnos">Reservar Turno</Link>
      </div>
    </section>
  )
}
```

---

### 12. CTASection (Call to Action Final)

```tsx
export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden bg-black">
      {/* Background image with opacity */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-cover bg-center"
             style={{ backgroundImage: `url('...')` }} />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white">
            ¿Listo para garantizar tu seguridad?
          </h2>
          <p className="text-xl text-gray-300">
            Reserva tu turno online y evita esperas...
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/turnos" className="bg-[#FEE004]">
              <Calendar /> Agendar Turno
            </Link>
            <a href="https://wa.me/..." className="bg-green-500">
              <MessageCircle /> WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

---

### 13. Footer

```tsx
export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white">Neumáticos del Valle</h3>
            <p className="text-gray-400">Distribuidor Oficial Pirelli</p>
            <div className="flex gap-0.5">
              {/* 5 stars */}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white mb-4">Enlaces</h4>
            <ul>
              {footerLinks.map((link) => (
                <li><Link href={link.href}>{link.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white mb-4">Contacto</h4>
            <div className="space-y-2">
              <a href="tel:+5493855854741">
                <Phone /> +54 9 385 585-4741
              </a>
              <a href="https://wa.me/5493855854741">
                <MessageCircle /> WhatsApp
              </a>
              <a href="/sucursales">
                <MapPin /> 9 Sucursales
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-white/5">
          <p className="text-gray-500">© 2024 Neumáticos del Valle</p>
          <div className="flex gap-6">
            <Link href="/admin">Admin</Link>
            <Link href="#">Términos</Link>
            <Link href="#">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

---

### 14. Data File (Contenido)

**Archivo**: `src/components/home/data.ts`

```typescript
export const tireModels = [
  {
    id: 1,
    name: 'Scorpion Verde',
    category: 'SUV & Camionetas',
    image: '/pirelli-scorpion-verde.webp',
    description: 'Máximo rendimiento para SUVs de alta gama',
    features: ['Todo terreno', 'Bajo ruido', 'Eco-friendly']
  },
  // ... 3 more models
]

export const heroStats = [
  { number: '40+', label: 'Años de trayectoria', icon: Award },
  { number: '100%', label: 'Productos originales', icon: Shield },
  { number: '100K+', label: 'Clientes satisfechos', icon: Users },
  { number: '6', label: 'Sucursales en NOA', icon: MapPin }
]

export const performanceStats = [
  { number: '33,639', label: 'Neumáticos instalados', suffix: '+' },
  { number: '10,440', label: 'Services realizados', suffix: '+' },
  { number: '4.9', label: 'Calificación promedio', suffix: '★' },
  { number: '98', label: 'Clientes satisfechos', suffix: '%' }
]

export const branches = [
  {
    name: 'Catamarca Centro',
    address: 'Av. Belgrano 938, Catamarca',
    phone: '(0383) 443-0000',
    image: '...'
  },
  // ... 5 more branches
]

export const tireImages = {
  column1: ['/pirelli-scorpion-verde.webp', /* ... 7 more */],
  column2: ['/pirelli-cinturato-p1.webp', /* ... 7 more */]
}

export const oilImages = [
  '/helix-hx2-10w-30.jpeg',
  /* ... 3 more */
]

export const footerLinks = [
  { name: 'Productos', href: '/productos' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'Turnos', href: '/turnos' },
  { name: 'Equivalencias', href: '/equivalencias' },
]
```

---

## 🎨 Sistema de Diseño

### Colores Principales

```css
/* Brand Colors */
--pirelli-yellow: #FEE004;
--pirelli-yellow-hover: #FDD000;
--yellow-secondary: #FFC700;

/* Neutrals */
--black: #000000;
--white: #FFFFFF;
--gray-50: #F9F9F9 / #F7F7F7;
--gray-100: #F1F1F1;
--gray-600: #666666;
--gray-900: #111111;

/* Status */
--green: #22C55E (WhatsApp)
--red: #EF4444 (Cart badge)
--blue: #3B82F6 (Verification badge)
```

### Tipografía

```css
/* Fonts */
font-family: 'Helvetica' (headings), 'Montserrat' (body)

/* Sizes */
/* Mobile */
- Hero: 3xl (30px)
- H2: 4xl (36px)
- Body: base (16px)

/* Desktop */
- Hero: 7xl (72px)
- H2: 5xl (48px)
- Body: xl (20px)
```

### Componentes Reutilizables

- **Buttons**:
  - Primary: `bg-[#FEE004] text-black hover:bg-[#FDD000]`
  - Secondary: `bg-white border-2 border-black hover:bg-black hover:text-white`
  - WhatsApp: `bg-green-500 text-white`

- **Cards**:
  - `rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100`

- **Badges**:
  - `px-4 py-2 bg-[#FEE004]/10 rounded-full border border-[#FEE004]/20`

### Animaciones

**Framer Motion** (whileInView patterns):
```tsx
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.5, delay: index * 0.1 }}
```

**Infinite Scroll** (Hero):
```tsx
animate={{ y: [0, "-50%"] }}  // Up
animate={{ y: ["-50%", 0] }}  // Down
transition={{
  duration: 60,
  repeat: Infinity,
  ease: "linear"
}}
```

---

## 🚀 Puntos de Conversión (CTAs)

### CTAs Principales en Home

1. **Hero Slide 1**:
   - "Ver Catálogo Pirelli" → `/productos`
   - "Pedir Asesoramiento" → WhatsApp

2. **Hero Slide 2**:
   - "Reservar Turno Ahora" → `/turnos`
   - "Ver Aceites y Filtros" → `/aceites`

3. **Hero Slide 3**:
   - "Ver Mapa de Sucursales" → `/sucursales`
   - "Reservar Turno" → `/turnos`

4. **Navbar (Fixed)**:
   - "Turnos" → `/turnos` (Botón destacado)
   - Carrito con badge de items

5. **Tire Models Section**:
   - "Ver Catálogo Completo" → `/productos`

6. **Testimonials Section**:
   - "Reservar Mi Turno Ahora" → `/turnos`

7. **FAQ Section**:
   - "Contactar por WhatsApp" → WhatsApp
   - "Reservar Turno" → `/turnos`

8. **CTA Section (Final)**:
   - "Agendar Turno" → `/turnos`
   - "WhatsApp" → WhatsApp

### Flujos de Conversión

**Flujo 1: Compra de Neumáticos**
```
Home → Ver Catálogo → Producto Individual →
Agregar al Carrito → Carrito → WhatsApp Checkout
```

**Flujo 2: Reserva de Turno**
```
Home → Reservar Turno → Formulario de Turno →
Confirmación → Notificación Admin
```

**Flujo 3: Consulta Directa**
```
Home → Pedir Asesoramiento (WhatsApp) →
Conversación con vendedor
```

---

## 📱 Responsive Breakpoints

```css
/* Tailwind Breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */

/* Mobile-first approach */
/* Default: Mobile (< 640px) */
/* md: Tablet y Desktop */
```

**Patrones Responsive**:
- Navbar: Hamburger menu en mobile
- Hero: 1 columna mobile → 2 columnas desktop
- Stats: 2 columnas mobile → 4 columnas desktop
- Cards: Full width mobile → Grid desktop
- Carousels: Auto en mobile → Grid en desktop

---

## ⚠️ Notas Técnicas Importantes

### Performance
- Imágenes optimizadas con `next/image`
- Lazy loading en secciones inferiores
- Autoplay stop on hover (UX)
- `priority` en imágenes above-the-fold

### Accesibilidad
- `aria-label` en botones de navegación
- Semantic HTML (section, nav, footer, h1-h6)
- Keyboard navigation (carousel arrows)
- Color contrast WCAG AA compliant

### SEO
- Headings jerárquicos (h1 → h6)
- Meta descriptions en página
- Structured data (próximamente)
- Alt texts descriptivos

### Animaciones
- `viewport={{ once: true }}` para evitar re-renders
- Transiciones suaves (300-500ms)
- Respect user motion preferences (prefers-reduced-motion)

---

## 🎯 Áreas de Mejora Sugeridas (para UX Review)

### 1. Conversión
- [ ] A/B testing de CTAs (textos, colores, posiciones)
- [ ] Reducir fricción en checkout (menos pasos)
- [ ] Agregar urgencia (stock limitado, ofertas)
- [ ] Trust signals más visibles (certificaciones, garantías)

### 2. Navegación
- [ ] Breadcrumbs en secciones internas
- [ ] Mega menu con productos destacados
- [ ] Búsqueda rápida de neumáticos por vehículo
- [ ] Sticky CTA en scroll

### 3. Mobile UX
- [ ] Optimizar tamaño de botones táctiles (min 44x44px)
- [ ] Reducir altura de hero en mobile
- [ ] Simplificar navegación mobile
- [ ] Thumb-friendly navigation

### 4. Content
- [ ] Reducir cantidad de texto en hero
- [ ] Agregar videos explicativos
- [ ] Testimonios con video
- [ ] Antes/después de servicios

### 5. Performance
- [ ] Lazy load imágenes de carousels
- [ ] Optimizar animaciones para 60fps
- [ ] Reducir bundle size de Framer Motion
- [ ] Implementar skeleton loaders

### 6. Conversión Específica
- [ ] Comparador de neumáticos
- [ ] Calculadora de ahorro de combustible
- [ ] Chat AI más visible
- [ ] WhatsApp widget flotante

---

## 📊 Métricas a Trackear

### Comportamiento del Usuario
- Time on page
- Scroll depth por sección
- Click-through rate de CTAs
- Bounce rate por fuente de tráfico

### Conversiones
- Tasa de conversión a WhatsApp
- Tasa de conversión a turnos
- Abandono de carrito
- Productos más consultados

### Performance
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)

---

## 🔗 Links Útiles

- **Producción**: https://neumaticosdelvallesrl.com
- **Staging**: (si existe)
- **Figma**: (si existe diseño original)
- **Analytics**: Google Analytics / Hotjar

---

**Última Actualización**: Enero 2026
**Versión del Código**: Next.js 15.5.9 + React 19
**Contacto Técnico**: [tu email o GitHub]

---

## 📝 Checklist para Revisión UX

Al revisar este código, considera:

- [ ] **Jerarquía Visual**: ¿La información más importante es la más visible?
- [ ] **Flujo de Usuario**: ¿Los CTAs guían naturalmente hacia conversión?
- [ ] **Consistencia**: ¿Los patrones de diseño se repiten coherentemente?
- [ ] **Feedback**: ¿Todos los elementos interactivos tienen estados hover/active?
- [ ] **Accesibilidad**: ¿Es navegable con teclado y screen readers?
- [ ] **Mobile First**: ¿La experiencia mobile es tan buena como desktop?
- [ ] **Performance**: ¿Las animaciones no afectan el rendimiento?
- [ ] **Contenido**: ¿Los textos son claros, concisos y orientados a acción?
- [ ] **Trust**: ¿Los elementos de confianza son suficientes y visibles?
- [ ] **Urgencia**: ¿Hay elementos que motiven la acción inmediata?

---

**Fin del documento** 🎉

