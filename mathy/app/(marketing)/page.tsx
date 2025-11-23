'use client'

import Image from "next/image";
import { useNamespaceTranslation } from "../lib/i18n/LanguageContext";
import ClientOnly from "../components/ClientOnly";
import FeatureGrid from "../components/marketing components/feature-grid";

export default function LandingPage() {
  const { t: tMarketing } = useNamespaceTranslation('marketing');

  return (
    // Integrity Style: Clean White Background, Centered Layout
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans">

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto text-center">

        {/* Hero Title */}
        <ClientOnly fallback={
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 text-[var(--color-text-primary)]">
            Write math and science notes.
          </h1>
        }>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 text-[var(--color-text-primary)]">
            {tMarketing('heroTitle')}
          </h1>
        </ClientOnly>

        {/* Hero Subtitle */}
        <ClientOnly fallback={
          <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            A simpler, smoother, and addictive experience for engineers and students.
          </p>
        }>
          <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            {tMarketing('heroSubtitle')}
          </p>
        </ClientOnly>

        {/* CTA Button */}
        <div className="flex justify-center mb-20">
          <button className="bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] 
            px-8 py-4 rounded-full text-lg font-medium hover:opacity-80 transition-opacity">
            Get Started
          </button>
        </div>

        {/* Hero Image / Visualization */}
        <div className="relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-[var(--color-border-subtle)]">
          <Image
            src="/herodemo.png"
            alt="Clarity Demo"
            width={1200}
            height={675}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-24 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-subtle)]">
        <FeatureGrid />
      </div>

    </div>
  );
}