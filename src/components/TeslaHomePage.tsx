'use client'

import { Navbar } from './layout/Navbar'
import {
  HeroCarousel,
  StatsBar,
  TireModelsSection,
  PerformanceStats,
  BranchesSection,
  CTASection,
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
    </div>
  )
}
