export interface OilProduct {
  id: string
  name: string
  series: 'Ultra' | 'HX8' | 'HX7' | 'HX5' | 'HX3'
  viscosity: string
  specifications: string[]
  sizes: string[]
  category: 'Premium' | 'Sintético' | 'Semi-Sintético' | 'Mineral'
  features: string[]
  applications: string[]
  image?: string
}

export const shellHelixOils: OilProduct[] = [
  // ULTRA Series - Premium
  {
    id: 'ultra-5w40-4l',
    name: 'Helix Ultra 5W-40',
    series: 'Ultra',
    viscosity: '5W-40',
    specifications: ['API SP', 'ACEA A3/B4', 'OEMs'],
    sizes: ['1L', '4L', '209L'],
    category: 'Premium',
    features: [
      '100% sintético',
      'Máxima protección del motor',
      'Limpieza superior',
      'Rendimiento en condiciones extremas'
    ],
    applications: [
      'Motores gasolina y diésel',
      'Alta performance',
      'Motores turbo',
      'Uso severo'
    ]
  },
  {
    id: 'ultra-x-5w30',
    name: 'Helix Ultra X 5W-30',
    series: 'Ultra',
    viscosity: '5W-30',
    specifications: ['API SP', 'ACEA A3/B4', 'OEMs'],
    sizes: ['1L'],
    category: 'Premium',
    features: [
      '100% sintético',
      'Mayor economía de combustible',
      'Protección avanzada',
      'Tecnología PurePlus'
    ],
    applications: [
      'Motores modernos',
      'Autos premium',
      'Uso diario',
      'Eficiencia energética'
    ]
  },

  // HX8 Series - Sintético
  {
    id: 'hx8-pro-ag-5w30',
    name: 'Helix HX8 Pro AG 5W-30',
    series: 'HX8',
    viscosity: '5W-30',
    specifications: ['API SN', 'GM dexos1', 'ILSAC GF-5'],
    sizes: ['1L', '4L'],
    category: 'Sintético',
    features: [
      'Sintético avanzado',
      'Especial para GM',
      'Protección prolongada',
      'Bajo consumo'
    ],
    applications: [
      'Chevrolet',
      'GM vehicles',
      'Motores modernos',
      'Uso diario'
    ]
  },
  {
    id: 'hx8-prof-av-5w40',
    name: 'Helix HX8 Prof AV 5W-40',
    series: 'HX8',
    viscosity: '5W-40',
    specifications: ['API SN', 'ACEA A3/B4'],
    sizes: ['4L'],
    category: 'Sintético',
    features: [
      'Sintético profesional',
      'Alta resistencia térmica',
      'Protección anti-desgaste',
      'Limpieza activa'
    ],
    applications: [
      'Uso profesional',
      'Motores exigidos',
      'Trabajo pesado',
      'Flotas'
    ]
  },

  // HX7 Series - Semi-Sintético
  {
    id: 'hx7-10w40',
    name: 'Helix HX7 10W-40',
    series: 'HX7',
    viscosity: '10W-40',
    specifications: ['API SN'],
    sizes: ['1L', '4L'],
    category: 'Semi-Sintético',
    features: [
      'Semi-sintético',
      'Excelente relación calidad-precio',
      'Protección confiable',
      'Versatilidad'
    ],
    applications: [
      'Autos medianos',
      'Uso general',
      'Ciudad y ruta',
      'Mantenimiento regular'
    ]
  },

  // HX5 Series - Mineral Premium
  {
    id: 'hx5-15w40',
    name: 'Helix HX5 15W-40',
    series: 'HX5',
    viscosity: '15W-40',
    specifications: ['API SL/CF'],
    sizes: ['4L'],
    category: 'Mineral',
    features: [
      'Mineral premium',
      'Protección básica',
      'Económico',
      'Uso general'
    ],
    applications: [
      'Autos estándar',
      'Motores gasolina/diésel',
      'Uso moderado',
      'Presupuesto económico'
    ]
  },

  // HX3 Series - Mineral Básico
  {
    id: 'hx3-20w50',
    name: 'Helix HX3 20W-50',
    series: 'HX3',
    viscosity: '20W-50',
    specifications: ['API SL/CF'],
    sizes: ['4L'],
    category: 'Mineral',
    features: [
      'Mineral básico',
      'Mayor viscosidad',
      'Motores con desgaste',
      'Precio accesible'
    ],
    applications: [
      'Autos antiguos',
      'Motores con kilometraje alto',
      'Uso básico',
      'Reparaciones'
    ]
  }
]

// Agrupar por serie
export const oilsBySeries = {
  Ultra: shellHelixOils.filter(oil => oil.series === 'Ultra'),
  HX8: shellHelixOils.filter(oil => oil.series === 'HX8'),
  HX7: shellHelixOils.filter(oil => oil.series === 'HX7'),
  HX5: shellHelixOils.filter(oil => oil.series === 'HX5'),
  HX3: shellHelixOils.filter(oil => oil.series === 'HX3')
}

// Agrupar por categoría
export const oilsByCategory = {
  Premium: shellHelixOils.filter(oil => oil.category === 'Premium'),
  Sintético: shellHelixOils.filter(oil => oil.category === 'Sintético'),
  'Semi-Sintético': shellHelixOils.filter(oil => oil.category === 'Semi-Sintético'),
  Mineral: shellHelixOils.filter(oil => oil.category === 'Mineral')
}

// Información de las series
export const seriesInfo = {
  Ultra: {
    name: 'Ultra',
    tagline: '100% Sintético Premium',
    description: 'La máxima protección para motores de alta performance',
    color: 'from-blue-600 to-blue-800'
  },
  HX8: {
    name: 'HX8',
    tagline: 'Sintético Avanzado',
    description: 'Protección superior para uso diario exigente',
    color: 'from-purple-600 to-purple-800'
  },
  HX7: {
    name: 'HX7',
    tagline: 'Semi-Sintético',
    description: 'Balance perfecto entre protección y economía',
    color: 'from-green-600 to-green-800'
  },
  HX5: {
    name: 'HX5',
    tagline: 'Mineral Premium',
    description: 'Protección confiable para uso general',
    color: 'from-yellow-600 to-yellow-700'
  },
  HX3: {
    name: 'HX3',
    tagline: 'Mineral Básico',
    description: 'Solución económica para motores estándar',
    color: 'from-gray-600 to-gray-800'
  }
}
