import { Award, Shield, Users, MapPin, Zap, Clock, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface TireModel {
  id: number
  name: string
  category: string
  image: string
  description: string
  price: string
  features: string[]
}

export interface Service {
  title: string
  description: string
  image: string
  icon: LucideIcon
}

export interface Benefit {
  icon: LucideIcon
  title: string
  description: string
}

export interface Branch {
  name: string
  address: string
  phone: string
  image: string
}

export interface Stat {
  number: string
  label: string
  icon?: LucideIcon
  suffix?: string
}

export const tireModels: TireModel[] = [
  {
    id: 1,
    name: 'Scorpion Verde',
    category: 'SUV & Camionetas',
    image: '/Scorpion-Verde-1505470074533 (1).webp',
    description: 'Máximo rendimiento para SUVs de alta gama',
    price: 'Consultar',
    features: ['Todo terreno', 'Bajo ruido', 'Eco-friendly']
  },
  {
    id: 2,
    name: 'P Zero',
    category: 'Alta Performance',
    image: '/Pzero-Nuovo-1505470072726.webp',
    description: 'El neumático elegido por los mejores autos deportivos',
    price: 'Consultar',
    features: ['Ultra High Performance', 'Máxima adherencia', 'Control preciso']
  },
  {
    id: 3,
    name: 'Cinturato P7',
    category: 'Autos Premium',
    image: '/Cinturato-P1-Verde-1505470090255.webp',
    description: 'Confort, seguridad y eficiencia para tu auto',
    price: 'Consultar',
    features: ['Bajo consumo', 'Gran durabilidad', 'Confort acústico']
  },
  {
    id: 4,
    name: 'Scorpion HT',
    category: 'Pick-ups & Camionetas',
    image: '/Scorpion-HT-4505525112686.webp',
    description: 'Perfectos para camionetas y uso mixto on/off road',
    price: 'Consultar',
    features: ['Durabilidad extrema', 'Tracción superior', 'Bajo desgaste']
  }
]

export const services: Service[] = [
  {
    title: 'Alineación y Balanceo',
    description: 'Tecnología de última generación para un perfecto equilibrio',
    image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop',
    icon: Zap
  },
  {
    title: 'Service Express',
    description: 'Cambio de neumáticos en menos de 30 minutos',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop',
    icon: Clock
  },
  {
    title: 'Diagnóstico Digital',
    description: 'Evaluación completa del estado de tus neumáticos',
    image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop',
    icon: CheckCircle2
  }
]

export const benefits: Benefit[] = [
  {
    icon: Award,
    title: '40+ Años de Experiencia',
    description: 'Líder en el NOA con más de 4 décadas garantizando tu seguridad'
  },
  {
    icon: Shield,
    title: '100% Productos Originales',
    description: 'Distribuidor oficial Pirelli con garantía de autenticidad'
  },
  {
    icon: Users,
    title: '100K+ Clientes Satisfechos',
    description: 'Miles de conductores confían en nosotros cada año'
  },
  {
    icon: MapPin,
    title: '6 Sucursales en el NOA',
    description: 'Red de sucursales para atenderte cerca de donde estés'
  }
]

export const branches: Branch[] = [
  {
    name: 'Catamarca Centro',
    address: 'Av. Belgrano 938, Catamarca',
    phone: '(0383) 443-0000',
    image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop'
  },
  {
    name: 'La Banda',
    address: 'República del Líbano Sur 866, Santiago del Estero',
    phone: '(0385) 427-0000',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop'
  },
  {
    name: 'San Fernando del Valle',
    address: 'Alem 1118, Catamarca',
    phone: '(0383) 443-1111',
    image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop'
  },
  {
    name: 'Salta',
    address: 'Jujuy 330, Salta',
    phone: '(0387) 431-0000',
    image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&h=400&fit=crop&flip=h'
  },
  {
    name: 'Santiago del Estero',
    address: 'Av. Belgrano Sur 2834, Santiago del Estero',
    phone: '(0385) 422-0000',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop&flip=h'
  },
  {
    name: 'Tucumán',
    address: 'Av. Gobernador del Campo 436, San Miguel de Tucumán',
    phone: '(0381) 424-0000',
    image: 'https://images.unsplash.com/photo-1632823469850-2f77dd9c7f93?w=600&h=400&fit=crop&flip=h'
  }
]

export const heroStats: Stat[] = [
  { number: '40+', label: 'Años de trayectoria', icon: Award },
  { number: '100%', label: 'Productos originales', icon: Shield },
  { number: '100K+', label: 'Clientes satisfechos', icon: Users },
  { number: '6', label: 'Sucursales en NOA', icon: MapPin }
]

export const performanceStats: Stat[] = [
  { number: '33,639', label: 'Neumáticos instalados', suffix: '+' },
  { number: '10,440', label: 'Services realizados', suffix: '+' },
  { number: '4.9', label: 'Calificación promedio', suffix: '★' },
  { number: '98', label: 'Clientes satisfechos', suffix: '%' }
]

export const tireImages = {
  column1: [
    '/Scorpion-Verde-1505470074533 (1).webp',
    '/Scorpion-HT-4505525112686.webp',
    '/Scorpion-4505525112390.webp',
    '/Scorpion-All-Terrain-Plus-4505483375619.webp',
    '/Scorpion-Atr-1505470067539.webp',
    '/Scorpion-MTR-1505470071047.webp',
    '/Scorpion-Zero-1505470088294.webp',
    '/Scorpion-Zero-All-Season-1505470086399.webp',
  ],
  column2: [
    '/Cinturato-P1-Verde-1505470090255.webp',
    '/Cinturato-P7-1505470083092.webp',
    '/cinturato-p7-4505517104514.webp',
    '/Pzero-Nuovo-1505470072726.webp',
    '/Pzero-Corsa-PZC4-1505470090635.webp',
    '/Pzero-Corsa-System-Direzionale-1505470088408.webp',
    '/Pzero-vecchio-1505470066413.webp',
    '/Chrono-1505470062195.webp',
  ]
}

export const oilImages = [
  '/helix-hx2-10w-30.jpeg',
  '/4l-helix-ultra-pro-aml-5w-30-high-version2.jpeg',
  '/4l-helix-hx3-15w-40-high.jpeg',
  '/4l-helix-hx5-10w-30.jpeg',
]

export const locationImages = [
  '/l1.jpg', '/l2.jpg', '/l3.jpg', '/l4.jpg', '/l5.jpg', '/l6.jpg',
  '/l7.jpg', '/l8.jpg', '/l9.jpg', '/l10.jpg', '/l11.jpg', '/l12.jpg',
  '/l13.jpg', '/l14.jpg', '/l15.jpg', '/l16.jpg', '/l17.jpg', '/l18.jpg',
  '/l19.jpg', '/l20.jpg', '/l21.jpg'
]

export const footerLinks = [
  { name: 'Productos', href: '/productos' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'Turnos', href: '/turnos' },
  { name: 'Equivalencias', href: '/equivalencias' },
]
