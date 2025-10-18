'use client';

import { TeslaHomePage } from '@/components/TeslaHomePage';
import { UnderConstruction } from '@/components/UnderConstruction';
import { shouldShowUnderConstruction } from '@/lib/env';

export default function Home() {
  // Automatically switch between Under Construction and Full Site based on environment
  // Production (main branch + NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=true) → Under Construction
  // Staging (staging branch) → Full Site
  // Development (local) → Full Site

  const showUnderConstruction = shouldShowUnderConstruction();

  return showUnderConstruction ? <UnderConstruction /> : <TeslaHomePage />;
}