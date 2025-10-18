import TireEquivalenceCalculator from '@/features/tire-equivalence/TireEquivalenceCalculator'

export const metadata = {
  title: 'Cubiertas Equivalentes | Neumáticos del Valle',
  description: 'Encontrá todas las cubiertas equivalentes a la medida de tu neumático actual. Sistema basado en estándares de la industria automotriz.',
}

export default function EquivalenciasPage() {
  return <TireEquivalenceCalculator />
}
